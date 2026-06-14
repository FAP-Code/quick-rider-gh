import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { DevotionsService } from './devotions.service';
import { GenerateDevotionRequestDto } from './dto/generate-devotion.dto';
import { ListDevotionsQueryDto } from './dto/list-devotions.dto';
import { DevotionResponseDto } from './dto/devotion-response.dto';

/**
 * DevotionsModule — AI Verse-to-Devotion Engine™ (api/openapi.yaml `Devotions` tag).
 *
 * `POST /devotions/generate` and the section-regenerate endpoint implement the
 * dual JSON/SSE contract from docs/09-api-architecture.md §6: clients sending
 * `Accept: text/event-stream` get a live SSE stream (`event: section` per
 * canonical section, then `event: done` with the persisted devotionId);
 * clients sending `Accept: application/json` (or omitting it) get the
 * buffered `{ data, meta }` JSON envelope once generation completes.
 *
 * Implementation note: a manual `Response` stream (via @Res()) is used here
 * rather than @Sse(), because @Sse() always streams — it cannot conditionally
 * fall back to a normal JSON response (and therefore the global
 * ResponseInterceptor) based on the request's `Accept` header. The manual
 * branch lets a single handler serve both transports from one
 * `DevotionsService.generateStream()` async generator.
 */
@ApiTags('Devotions')
@Controller('devotions')
export class DevotionsController {
  constructor(private readonly devotionsService: DevotionsService) {}

  @Get()
  @ApiOperation({ summary: 'List "My Devotions"' })
  @ApiResponse({ status: 200, type: [DevotionResponseDto] })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListDevotionsQueryDto) {
    return this.devotionsService.list(user.userId, query);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a devotion via the AI Verse-to-Devotion Engine™ (streamable)' })
  @ApiResponse({ status: 201, type: DevotionResponseDto })
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateDevotionRequestDto,
    @Headers('accept') accept: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (accept?.includes('text/event-stream')) {
      await this.streamGeneration(user, dto, res);
      return;
    }

    const devotion = await this.devotionsService.generate(user.userId, dto);
    res.status(201).json({ data: devotion });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single devotion' })
  @ApiResponse({ status: 200, type: DevotionResponseDto })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.devotionsService.findOne(user.userId, id);
  }

  @Post(':id/sections/:sectionKey/regenerate')
  @ApiOperation({ summary: 'Regenerate a single section of a devotion (PLUS+/PREMIUM+ per docs §11 §2)' })
  @ApiResponse({ status: 200, type: DevotionResponseDto })
  regenerateSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('sectionKey') sectionKey: string,
  ) {
    return this.devotionsService.regenerateSection(user.userId, id, sectionKey);
  }

  /**
   * Writes the SSE response per docs/09 §6.1:
   *   event: section\ndata: {"section":"title","content":"..."}\n\n
   *   ...
   *   event: done\ndata: {"devotionId":"..."}\n\n
   * Errors mid-stream are emitted as `event: error` with the standard error
   * envelope, followed by stream closure (partial output not persisted).
   */
  private async streamGeneration(
    user: AuthenticatedUser,
    dto: GenerateDevotionRequestDto,
    res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const generator = this.devotionsService.generateStream(user.userId, dto);
      let result: { devotionId: string } | undefined;

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
