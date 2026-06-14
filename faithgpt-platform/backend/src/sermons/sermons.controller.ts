import { Body, Controller, Get, Headers, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { SubscriptionTier } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TierRequired } from '../common/decorators/tier-required.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { SermonsService } from './sermons.service';
import { GenerateSermonDto, SermonDto } from './dto/sermon.dto';

/**
 * SermonsModule — AI Sermon / Teaching Studio (api/openapi.yaml `Sermons`
 * tag). PREMIUM+ per docs §11 §2; enforced via @TierRequired(PREMIUM) +
 * TierGuard.
 *
 * `POST /sermons/generate` implements the same dual JSON/SSE contract as
 * `POST /devotions/generate` (docs/09 §6).
 */
@ApiTags('Sermons')
@Controller('sermons')
@TierRequired(SubscriptionTier.PREMIUM)
export class SermonsController {
  constructor(private readonly sermonsService: SermonsService) {}

  @Get()
  @ApiOperation({ summary: 'List "My Sermons" (PREMIUM+ per docs §11 §2)' })
  @ApiResponse({ status: 200, type: [SermonDto] })
  @ApiResponse({ status: 403, description: 'Tier required' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: CursorPaginationDto) {
    return this.sermonsService.list(user.userId, query.limit ?? 20, query.cursor);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a sermon/lesson outline (PREMIUM+, streamable)' })
  @ApiResponse({ status: 201, type: SermonDto })
  @ApiResponse({ status: 403, description: 'Tier required' })
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateSermonDto,
    @Headers('accept') accept: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (accept?.includes('text/event-stream')) {
      await this.streamGeneration(user, dto, res);
      return;
    }

    const sermon = await this.sermonsService.generate(user.userId, dto);
    res.status(201).json({ data: sermon });
  }

  /**
   * Writes the SSE response per docs/09 §6.1:
   *   event: section\ndata: {"section":"outline","content":{...}}\n\n
   *   event: done\ndata: {"sermonId":"..."}\n\n
   */
  private async streamGeneration(
    user: AuthenticatedUser,
    dto: GenerateSermonDto,
    res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const generator = this.sermonsService.generateStream(user.userId, dto);
      let result: { sermonId: string } | undefined;

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
