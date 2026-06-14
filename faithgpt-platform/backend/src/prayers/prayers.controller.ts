import { Body, Controller, Get, Headers, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { PrayersService } from './prayers.service';
import { GeneratePrayerDto, PrayerDto } from './dto/prayer.dto';

/**
 * PrayersModule — AI Prayer Generator (api/openapi.yaml `Prayers` tag).
 *
 * `POST /prayers/generate` implements the same dual JSON/SSE contract as
 * `POST /devotions/generate` (docs/09 §6).
 */
@ApiTags('Prayers')
@Controller('prayers')
export class PrayersController {
  constructor(private readonly prayersService: PrayersService) {}

  @Get()
  @ApiOperation({ summary: 'List "My Prayers"' })
  @ApiResponse({ status: 200, type: [PrayerDto] })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: CursorPaginationDto) {
    return this.prayersService.list(user.userId, query.limit ?? 20, query.cursor);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a prayer via the AI Prayer Generator (streamable)' })
  @ApiResponse({ status: 201, type: PrayerDto })
  async generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GeneratePrayerDto,
    @Headers('accept') accept: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (accept?.includes('text/event-stream')) {
      await this.streamGeneration(user, dto, res);
      return;
    }

    const prayer = await this.prayersService.generate(user.userId, dto);
    res.status(201).json({ data: prayer });
  }

  /**
   * Writes the SSE response per docs/09 §6.1:
   *   event: section\ndata: {"section":"prayer","content":"..."}\n\n
   *   event: done\ndata: {"prayerId":"..."}\n\n
   */
  private async streamGeneration(
    user: AuthenticatedUser,
    dto: GeneratePrayerDto,
    res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    try {
      const generator = this.prayersService.generateStream(user.userId, dto);
      let result: { prayerId: string } | undefined;

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
