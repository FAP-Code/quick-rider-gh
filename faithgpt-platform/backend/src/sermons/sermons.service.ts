import { Injectable } from '@nestjs/common';
import { Sermon } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { GenerateSermonDto, SermonDto } from './dto/sermon.dto';

/**
 * SermonsModule — AI Sermon / Teaching Studio (docs/08-backend-architecture.md
 * §2). PREMIUM+ per docs §11 §2. Persists generated sermons/lesson outlines
 * and serves "My Sermons" library reads.
 */
@Injectable()
export class SermonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
  ) {}

  async list(userId: string, limit: number, cursor?: string) {
    const rows = await this.prisma.sermon.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((s) => this.toResponse(s)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  /** Non-streamed generation path (`Accept: application/json`, docs/09 §6.1). */
  async generate(userId: string, dto: GenerateSermonDto): Promise<SermonDto> {
    const outline = await this.generateOutline(userId, dto);
    const sermon = await this.persist(userId, dto, outline);
    return this.toResponse(sermon);
  }

  /**
   * Streaming generation path (`Accept: text/event-stream`, docs/09 §6.1).
   * Stub: generates the full outline via `generateText()` and yields it as a
   * single `event: section` chunk (section: "outline"), then persists.
   */
  async *generateStream(
    userId: string,
    dto: GenerateSermonDto,
  ): AsyncGenerator<{ section: 'outline'; content: Record<string, unknown> }, { sermonId: string }> {
    const outline = await this.generateOutline(userId, dto);
    yield { section: 'outline', content: outline };

    const sermon = await this.persist(userId, dto, outline);
    return { sermonId: sermon.id };
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  /**
   * Stub: calls the AI Gateway for a single text completion and wraps it in a
   * minimal outline shape. A full implementation would prompt for a
   * structured outline JSON per `outputType` (§06 AI Architecture) and parse
   * the model's response into {title, introduction, mainPoints[],
   * illustrations[], application, altarCall, ...}.
   */
  private async generateOutline(userId: string, dto: GenerateSermonDto): Promise<Record<string, unknown>> {
    const result = await this.aiGateway.generateText({
      feature: 'SERMON',
      userId,
      systemPrompt:
        `You are the FaithGPT AI Sermon/Teaching Studio. Produce a ${dto.outputType} ` +
        `outline${dto.audience ? ` for the audience "${dto.audience}"` : ''}.`,
      userPrompt: `Create a ${dto.outputType} based on: ${dto.passageOrTopic}.`,
    });

    return {
      title: `${dto.outputType.replace(/_/g, ' ')} on ${dto.passageOrTopic}`,
      introduction: result.content,
      mainPoints: [],
      illustrations: [],
      application: '',
      altarCall: '',
    };
  }

  private async persist(
    userId: string,
    dto: GenerateSermonDto,
    outline: Record<string, unknown>,
  ): Promise<Sermon> {
    return this.prisma.sermon.create({
      data: {
        userId,
        title: (outline.title as string) ?? dto.passageOrTopic,
        passageKey: dto.passageOrTopic,
        audience: dto.audience ?? null,
        outline: outline as any,
        aiModel: this.aiGateway.getDefaultModel(),
      },
    });
  }

  private toResponse(sermon: Sermon): SermonDto {
    return {
      id: sermon.id,
      title: sermon.title,
      passageKey: sermon.passageKey,
      audience: sermon.audience,
      outline: sermon.outline as Record<string, unknown>,
      createdAt: sermon.createdAt,
    };
  }
}
