import { Injectable, NotFoundException } from '@nestjs/common';
import { AIConversation, AIMessage, MessageRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { CreateConversationDto, PostMessageDto } from './dto/ai-conversation.dto';

/**
 * AIStudyModule — AI Bible Study Assistant™ (docs/08-backend-architecture.md §2).
 * Manages conversations and their messages, delegating reply generation to
 * AiGatewayService.
 */
@Injectable()
export class AiStudyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
  ) {}

  async list(userId: string, limit: number, cursor?: string) {
    const rows = await this.prisma.aIConversation.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { updatedAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((c) => this.toConversationDto(c)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  async create(userId: string, dto: CreateConversationDto) {
    const conversation = await this.prisma.aIConversation.create({
      data: {
        userId,
        contextPassageKey: dto.contextPassageKey ?? null,
      },
    });

    return this.toConversationDto(conversation);
  }

  async findOne(userId: string, id: string) {
    const conversation = await this.prisma.aIConversation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Conversation not found.' });
    }

    return {
      ...this.toConversationDto(conversation),
      messages: conversation.messages.map((m) => this.toMessageDto(m)),
    };
  }

  /**
   * Non-streamed reply path (`Accept: application/json`, docs/09 §6.1).
   * Persists the user's message, generates the assistant reply via
   * AiGatewayService, persists it, and returns the assistant AIMessage.
   */
  async postMessage(userId: string, conversationId: string, dto: PostMessageDto) {
    const conversation = await this.getOwnedConversation(userId, conversationId);

    await this.prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.USER,
        category: dto.category,
        content: dto.content,
      },
    });

    const result = await this.aiGateway.generateText({
      feature: 'BIBLE_STUDY',
      userId,
      systemPrompt:
        'You are the FaithGPT AI Bible Study Assistant. Answer the user\'s question ' +
        'with biblically grounded, pastorally sensitive guidance, citing scripture references.',
      userPrompt: dto.content,
    });

    const assistantMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.ASSISTANT,
        category: dto.category,
        content: result.content,
      },
    });

    await this.prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return this.toMessageDto(assistantMessage);
  }

  /**
   * Streaming reply path (`Accept: text/event-stream`, docs/09 §6.1). Yields
   * `event: section` chunks with `section: "answer"`, then returns the
   * persisted assistant AIMessage id for the final `event: done` payload.
   *
   * Stub implementation: persists the user message, generates the full reply
   * via `generateText()`, then yields it as a single chunk. A full
   * implementation would stream incremental tokens from the AI provider.
   */
  async *postMessageStream(
    userId: string,
    conversationId: string,
    dto: PostMessageDto,
  ): AsyncGenerator<{ section: 'answer'; content: string }, { messageId: string }> {
    const conversation = await this.getOwnedConversation(userId, conversationId);

    await this.prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.USER,
        category: dto.category,
        content: dto.content,
      },
    });

    const result = await this.aiGateway.generateText({
      feature: 'BIBLE_STUDY',
      userId,
      systemPrompt:
        'You are the FaithGPT AI Bible Study Assistant. Answer the user\'s question ' +
        'with biblically grounded, pastorally sensitive guidance, citing scripture references.',
      userPrompt: dto.content,
    });

    yield { section: 'answer', content: result.content };

    const assistantMessage = await this.prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.ASSISTANT,
        category: dto.category,
        content: result.content,
      },
    });

    await this.prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return { messageId: assistantMessage.id };
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private async getOwnedConversation(userId: string, id: string): Promise<AIConversation> {
    const conversation = await this.prisma.aIConversation.findFirst({ where: { id, userId } });
    if (!conversation) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Conversation not found.' });
    }
    return conversation;
  }

  private toConversationDto(conversation: AIConversation) {
    return {
      id: conversation.id,
      title: conversation.title,
      contextPassageKey: conversation.contextPassageKey,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private toMessageDto(message: AIMessage) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      category: message.category,
      content: message.content,
      citations: message.citations as unknown as Array<{ ref: string; versionCode: string }> | null,
      createdAt: message.createdAt,
    };
  }
}
