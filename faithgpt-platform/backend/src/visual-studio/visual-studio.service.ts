import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BibleStoryVisualization,
  GenerationStatus,
  ImageGeneration,
  MemoryVerseCard,
  StoryboardFrame,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { GenerateImageRequestDto, ImageGenerationDto } from './dto/image-generation.dto';
import {
  BibleStoryVisualizationDetailDto,
  BibleStoryVisualizationDto,
  GenerateStoryVisualizationDto,
} from './dto/story-visualization.dto';
import { GenerateMemoryVerseCardDto, MemoryVerseCardDto } from './dto/memory-verse-card.dto';

/**
 * VisualStudioModule — AI Scripture Image Generator™, Bible Story
 * Visualizer™, and Memory Verse Visualizer™ (docs/08-backend-architecture.md
 * §2). In production these jobs are queued on the BullMQ `image-generation`
 * queue and resolved asynchronously (status PENDING -> PROCESSING ->
 * COMPLETED/FAILED, polled via GET /images/{id} or pushed via notification).
 *
 * Stub implementation: calls AiGatewayService.generateImage() synchronously
 * and persists rows as COMPLETED immediately, so the request/response shapes
 * can be exercised without a queue worker.
 */
@Injectable()
export class VisualStudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
  ) {}

  // ---------------------------------------------------------------------
  // Images (AI Scripture Image Generator™)
  // ---------------------------------------------------------------------

  async listImages(userId: string, limit: number, cursor?: string) {
    const rows = await this.prisma.imageGeneration.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((row) => this.toImageDto(row)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  async generateImage(userId: string, dto: GenerateImageRequestDto): Promise<ImageGenerationDto> {
    const sourceKey = dto.sourceKey ?? dto.devotionId ?? dto.prayerId ?? dto.sermonId ?? 'custom-prompt';
    const refinedPrompt = dto.userPrompt ?? `${dto.sourceType} visualization of ${sourceKey} in ${dto.style} style`;

    const result = await this.aiGateway.generateImage({
      userId,
      prompt: refinedPrompt,
      style: dto.style,
    });

    const image = await this.prisma.imageGeneration.create({
      data: {
        userId,
        sourceType: dto.sourceType,
        sourceKey,
        devotionId: dto.devotionId ?? null,
        prayerId: dto.prayerId ?? null,
        sermonId: dto.sermonId ?? null,
        style: dto.style,
        userPrompt: dto.userPrompt ?? null,
        refinedPrompt,
        modelName: result.modelName,
        status: GenerationStatus.COMPLETED,
        resultUrl: result.resultUrl,
        thumbnailUrl: result.thumbnailUrl,
        completedAt: new Date(),
      },
    });

    return this.toImageDto(image);
  }

  async getImage(userId: string, id: string): Promise<ImageGenerationDto> {
    const image = await this.prisma.imageGeneration.findFirst({ where: { id, userId } });
    if (!image) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Image generation not found.' });
    }
    return this.toImageDto(image);
  }

  // ---------------------------------------------------------------------
  // Story Visualizations (AI Bible Story Visualizer™)
  // ---------------------------------------------------------------------

  async generateStoryVisualization(
    userId: string,
    dto: GenerateStoryVisualizationDto,
  ): Promise<BibleStoryVisualizationDto> {
    const visualization = await this.prisma.bibleStoryVisualization.create({
      data: {
        userId,
        storyKey: dto.storyKey,
        style: dto.style,
        outputType: dto.outputType,
      },
    });

    // Stub: a full implementation enqueues per-frame image generation jobs
    // and creates StoryboardFrame rows as each completes.
    return this.toStoryVisualizationDto(visualization);
  }

  async getStoryVisualization(userId: string, id: string): Promise<BibleStoryVisualizationDetailDto> {
    const visualization = await this.prisma.bibleStoryVisualization.findFirst({
      where: { id, userId },
      include: { frames: { include: { imageGeneration: true }, orderBy: { sequence: 'asc' } } },
    });

    if (!visualization) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Story visualization not found.' });
    }

    return {
      ...this.toStoryVisualizationDto(visualization),
      frames: visualization.frames.map((frame) => this.toFrameDto(frame)),
    };
  }

  // ---------------------------------------------------------------------
  // Memory Verse Cards (Memory Verse Visualizer™)
  // ---------------------------------------------------------------------

  async listMemoryVerseCards(userId: string, limit: number, cursor?: string) {
    const rows = await this.prisma.memoryVerseCard.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { imageGeneration: true },
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((row) => this.toMemoryVerseCardDto(row)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  async generateMemoryVerseCard(userId: string, dto: GenerateMemoryVerseCardDto): Promise<MemoryVerseCardDto> {
    const style = dto.style ?? 'CHRISTIAN_ARTWORK';
    const result = await this.aiGateway.generateImage({
      userId,
      prompt: `Memory verse card (${dto.format}) for verse ${dto.verseId}`,
      style,
    });

    const image = await this.prisma.imageGeneration.create({
      data: {
        userId,
        sourceType: 'MEMORY_VERSE',
        sourceKey: dto.verseId,
        style,
        refinedPrompt: `Memory verse card (${dto.format}) for verse ${dto.verseId}`,
        modelName: result.modelName,
        status: GenerationStatus.COMPLETED,
        resultUrl: result.resultUrl,
        thumbnailUrl: result.thumbnailUrl,
        completedAt: new Date(),
      },
    });

    const card = await this.prisma.memoryVerseCard.create({
      data: {
        userId,
        verseId: dto.verseId,
        format: dto.format,
        imageGenerationId: image.id,
      },
      include: { imageGeneration: true },
    });

    return this.toMemoryVerseCardDto(card);
  }

  // ---------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------

  private toImageDto(image: ImageGeneration): ImageGenerationDto {
    return {
      id: image.id,
      sourceType: image.sourceType,
      sourceKey: image.sourceKey,
      style: image.style,
      refinedPrompt: image.refinedPrompt,
      status: image.status,
      resultUrl: image.resultUrl,
      thumbnailUrl: image.thumbnailUrl,
      isWatermarked: image.isWatermarked,
      moderationStatus: image.moderationStatus,
      createdAt: image.createdAt,
      completedAt: image.completedAt,
    };
  }

  private toStoryVisualizationDto(visualization: BibleStoryVisualization): BibleStoryVisualizationDto {
    return {
      id: visualization.id,
      storyKey: visualization.storyKey,
      style: visualization.style,
      outputType: visualization.outputType as BibleStoryVisualizationDto['outputType'],
      createdAt: visualization.createdAt,
    };
  }

  private toFrameDto(frame: StoryboardFrame & { imageGeneration: ImageGeneration | null }) {
    return {
      id: frame.id,
      sequence: frame.sequence,
      caption: frame.caption,
      imageGeneration: frame.imageGeneration ? this.toImageDto(frame.imageGeneration) : null,
    };
  }

  private toMemoryVerseCardDto(card: MemoryVerseCard & { imageGeneration: ImageGeneration | null }): MemoryVerseCardDto {
    return {
      id: card.id,
      verseId: card.verseId,
      format: card.format,
      imageGeneration: card.imageGeneration ? this.toImageDto(card.imageGeneration) : null,
      createdAt: card.createdAt,
    };
  }
}
