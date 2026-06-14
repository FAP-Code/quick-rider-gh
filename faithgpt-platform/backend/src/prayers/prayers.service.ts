import { Injectable } from '@nestjs/common';
import { Prayer } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { GeneratePrayerDto, PrayerDto } from './dto/prayer.dto';

/**
 * PrayersModule — AI Prayer Generator (docs/08-backend-architecture.md §2).
 * Persists generated prayers and serves "My Prayers" library reads.
 */
@Injectable()
export class PrayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
  ) {}

  async list(userId: string, limit: number, cursor?: string) {
    const rows = await this.prisma.prayer.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((p) => this.toResponse(p)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  /** Non-streamed generation path (`Accept: application/json`, docs/09 §6.1). */
  async generate(userId: string, dto: GeneratePrayerDto): Promise<PrayerDto> {
    const content = await this.generateContent(userId, dto);
    const prayer = await this.persist(userId, dto, content);
    return this.toResponse(prayer);
  }

  /**
   * Streaming generation path (`Accept: text/event-stream`, docs/09 §6.1).
   * Stub: generates the full prayer text via `generateText()` and yields it
   * as a single `event: section` chunk (section: "prayer"), then persists.
   */
  async *generateStream(
    userId: string,
    dto: GeneratePrayerDto,
  ): AsyncGenerator<{ section: 'prayer'; content: string }, { prayerId: string }> {
    const content = await this.generateContent(userId, dto);
    yield { section: 'prayer', content };

    const prayer = await this.persist(userId, dto, content);
    return { prayerId: prayer.id };
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private async generateContent(userId: string, dto: GeneratePrayerDto): Promise<string> {
    const subject = dto.passageKey
      ? `the passage ${dto.passageKey}`
      : dto.topic
        ? `the topic "${dto.topic}"`
        : 'the user';

    const result = await this.aiGateway.generateText({
      feature: 'PRAYER',
      userId,
      systemPrompt:
        'You are the FaithGPT AI Prayer Generator. Write a heartfelt, biblically ' +
        `grounded ${dto.type.toLowerCase()} prayer.`,
      userPrompt: `Write a ${dto.type.toLowerCase()} prayer related to ${subject}.`,
    });

    return result.content;
  }

  private async persist(userId: string, dto: GeneratePrayerDto, content: string): Promise<Prayer> {
    return this.prisma.prayer.create({
      data: {
        userId,
        type: dto.type,
        passageKey: dto.passageKey ?? null,
        content,
      },
    });
  }

  private toResponse(prayer: Prayer): PrayerDto {
    return {
      id: prayer.id,
      type: prayer.type,
      passageKey: prayer.passageKey,
      content: prayer.content,
      isFavorite: prayer.isFavorite,
      createdAt: prayer.createdAt,
    };
  }
}
