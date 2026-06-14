import { Body, Controller, Get, Headers, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { AiStudyService } from './ai-study.service';
import {
  AIConversationDetailDto,
  AIConversationDto,
  AIMessageDto,
  CreateConversationDto,
  PostMessageDto,
} from './dto/ai-conversation.dto';

/**
 * AIStudyModule — AI Bible Study Assistant™ (api/openapi.yaml `AI Study` tag).
 *
 * `POST /ai-conversations/:id/messages` implements the same dual JSON/SSE
 * contract as `POST /devotions/generate` (docs/09 §6): clients sending
 * `Accept: text/event-stream` get a live SSE stream with `event: section`
 * (section: "answer") chunks followed by `event: done` carrying the
 * persisted AIMessage id; clients sending `Accept: application/json` get the
 * buffered `{ data, meta }` JSON envelope once generation completes.
 */
@ApiTags('AI Study')
@Controller('ai-conversations')
export class AiStudyController {
  constructor(private readonly aiStudyService: AiStudyService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's AI Bible Study conversations" })
  @ApiResponse({ status: 200, type: [AIConversationDto] })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: CursorPaginationDto) {
    return this.aiStudyService.list(user.userId, query.limit ?? 20, query.cursor);
  }

  @Post()
  @ApiOperation({ summary: 'Start a new conversation' })
  @ApiResponse({ status: 201, type: AIConversationDto })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateConversationDto) {
    return this.aiStudyService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation with its messages' })
  @ApiResponse({ status: 200, type: AIConversationDetailDto })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.aiStudyService.findOne(user.userId, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Ask a question in a conversation (streamable assistant reply)' })
  @ApiResponse({ status: 201, type: AIMessageDto })
  async postMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PostMessageDto,
    @Headers('accept') accept: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (accept?.includes('text/event-stream')) {
      await this.streamReply(user, id, dto, res);
      return;
    }

    const message = await this.aiStudyService.postMessage(user.userId, id, dto);
    res.status(201).json({ data: message });
  }

  /**
   * Writes the SSE response per docs/09 §6.1:
   *   event: section\ndata: {"section":"answer","content":"..."}\n\n
   *   event: done\ndata: {"messageId":"..."}\n\n
   * Errors mid-stream are emitted as `event: error` with the standard error
   * envelope, followed by stream closure.
   */
  private async streamReply(
    user: AuthenticatedUser,
    conversationId: string,
    dto: PostMessageDto,
    res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const generator = this.aiStudyService.postMessageStream(user.userId, conversationId, dto);
      let result: { messageId: string } | undefined;

      while (true) {
        const next = await generator.next();
        if (next.done) {
          result = next.value;
          break;
        }
        res.write(`event: section\ndata: ${JSON.stringify(next.value)}\n\n`);
      }

      res.write(`event: done\ndata: ${JSON.stringify(result)}\n\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: { code: 'AI_PROVIDER_ERROR', message } })}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}
