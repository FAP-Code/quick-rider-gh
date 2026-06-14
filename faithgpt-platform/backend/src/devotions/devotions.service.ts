import { Injectable, NotFoundException } from '@nestjs/common';
import { Devotion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import {
  DEVOTION_SECTION_KEYS,
  DevotionSectionEvent,
  DevotionSections,
} from '../ai-gateway/types/devotion-sections';
import { GenerateDevotionRequestDto } from './dto/generate-devotion.dto';
import { ListDevotionsQueryDto } from './dto/list-devotions.dto';
import { DevotionResponseDto } from './dto/devotion-response.dto';

/**
 * DevotionsModule — AI Verse-to-Devotion Engine™ (docs/08-backend-architecture.md
 * §2). Persists generated devotions and serves "My Devotions" library reads.
 */
@Injectable()
export class DevotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
  ) {}

  async list(userId: string, query: ListDevotionsQueryDto) {
    const limit = query.limit ?? 20;

    const rows = await this.prisma.devotion.findMany({
      where: { userId, ...(query.type ? { type: query.type } : {}) },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((d) => this.toResponse(d)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  async findOne(userId: string, id: string): Promise<DevotionResponseDto> {
    const devotion = await this.prisma.devotion.findFirst({ where: { id, userId } });
    if (!devotion) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Devotion not found.' });
    }
    return this.toResponse(devotion);
  }

  /**
   * Non-streamed generation path (`Accept: application/json`, docs/09 §6.1).
   * Consumes the same `generateDevotionSections()` async generator as the SSE
   * path but buffers all sections before persisting and returning.
   */
  async generate(userId: string, dto: GenerateDevotionRequestDto): Promise<DevotionResponseDto> {
    const sections = await this.collectSections(userId, dto);
    const devotion = await this.persist(userId, dto, sections);
    return this.toResponse(devotion);
  }

  /**
   * Streaming generation path (`Accept: text/event-stream`, docs/09 §6.1).
   * Yields one `DevotionSectionEvent` per canonical section as it's produced,
   * then persists the assembled Devotion and returns its id for the final
   * `event: done` payload (emitted by the controller).
   */
  async *generateStream(
    userId: string,
    dto: GenerateDevotionRequestDto,
  ): AsyncGenerator<DevotionSectionEvent, { devotionId: string }> {
    const sections: Partial<DevotionSections> = {};

    for await (const event of this.aiGateway.generateDevotionSections({
      userId,
      passageKey: dto.passageKey,
      versionCode: dto.versionCode ?? 'ESV',
      type: dto.type,
      depth: dto.depth,
      themes: dto.themes,
    })) {
      (sections as any)[event.section] = event.content;
      yield event;
    }

    const devotion = await this.persist(userId, dto, sections as DevotionSections);
    return { devotionId: devotion.id };
  }

  /**
   * Regenerates a single section of an existing devotion (PLUS+/PREMIUM+ per
   * docs §11 §2). Returns the updated Devotion with the regenerated section.
   */
  async regenerateSection(userId: string, id: string, sectionKey: string): Promise<DevotionResponseDto> {
    const devotion = await this.prisma.devotion.findFirst({ where: { id, userId } });
    if (!devotion) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Devotion not found.' });
    }

    if (!(DEVOTION_SECTION_KEYS as readonly string[]).includes(sectionKey)) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `Unknown devotion section '${sectionKey}'.`,
      });
    }

    let regenerated: DevotionSectionEvent | undefined;
    for await (const event of this.aiGateway.generateDevotionSections({
      userId,
      passageKey: devotion.passageKey,
      versionCode: devotion.versionCode,
      type: devotion.type,
      depth: devotion.depth,
      sectionKey,
    })) {
      regenerated = event;
    }

    const currentSections = devotion.sections as unknown as DevotionSections;
    const updatedSections: DevotionSections = {
      ...currentSections,
      ...(regenerated ? { [regenerated.section]: regenerated.content } : {}),
    };

    const updated = await this.prisma.devotion.update({
      where: { id },
      data: { sections: updatedSections as any },
    });

    return this.toResponse(updated);
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private async collectSections(
    userId: string,
    dto: GenerateDevotionRequestDto,
  ): Promise<DevotionSections> {
    const sections: Partial<DevotionSections> = {};

    for await (const event of this.aiGateway.generateDevotionSections({
      userId,
      passageKey: dto.passageKey,
      versionCode: dto.versionCode ?? 'ESV',
      type: dto.type,
      depth: dto.depth,
      themes: dto.themes,
    })) {
      (sections as any)[event.section] = event.content;
    }

    return sections as DevotionSections;
  }

  private async persist(
    userId: string,
    dto: GenerateDevotionRequestDto,
    sections: DevotionSections,
  ): Promise<Devotion> {
    return this.prisma.devotion.create({
      data: {
        userId,
        title: sections.title,
        passageKey: dto.passageKey,
        versionCode: dto.versionCode ?? 'ESV',
        type: dto.type,
        depth: dto.depth,
        sections: sections as any,
        memoryVerseRef: sections.memoryVerse ?? null,
        aiModel: this.aiGateway.getDefaultModel(),
        generationParams: { themes: dto.themes ?? [] },
      },
    });
  }

  private toResponse(devotion: Devotion): DevotionResponseDto {
    return {
      id: devotion.id,
      title: devotion.title,
      passageKey: devotion.passageKey,
      versionCode: devotion.versionCode,
      type: devotion.type,
      depth: devotion.depth,
      sections: devotion.sections as unknown as DevotionSections,
      memoryVerseRef: devotion.memoryVerseRef,
      isFavorite: devotion.isFavorite,
      isShared: devotion.isShared,
      createdAt: devotion.createdAt,
    };
  }
}
