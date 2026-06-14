import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { GenerationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  GenerateImageRequest,
  GenerateImageResult,
  GenerateTextRequest,
  GenerateTextResult,
  GenerateDevotionSectionsRequest,
} from './interfaces/ai-gateway.interfaces';
import {
  DEVOTION_SECTION_KEYS,
  DevotionSectionEvent,
  DevotionSectionKey,
} from './types/devotion-sections';

/**
 * AIGatewayModule's service — the only place in the monolith that talks to an
 * LLM/image-generation provider SDK directly (docs/08-backend-architecture.md §2.1).
 *
 * Every call is expected to write a corresponding AIUsageLog row (tokens, cost
 * in costUsdMicros, latency, status) — see logUsage(). Consuming modules
 * (Devotions, AI Study, Prayers, Sermons, Visual Studio) depend only on this
 * service's interface so the Phase-3 extraction described in §1.1 is a
 * non-breaking change for callers.
 */
@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly anthropic: Anthropic;
  private readonly defaultModel = 'claude-sonnet-4-5';

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  /**
   * Non-streamed text completion. Used for prayers/sermons/AI-study replies
   * and as the fallback path for `Accept: application/json` requests to
   * `devotions/generate` and other dual-mode endpoints (docs/09 §6.1).
   */
  async generateText(request: GenerateTextRequest): Promise<GenerateTextResult> {
    const start = Date.now();

    try {
      const model = request.model ?? this.defaultModel;
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: [{ role: 'user', content: request.userPrompt }],
      });

      const latencyMs = Date.now() - start;
      const textBlock = response.content.find((block) => block.type === 'text');
      const content = textBlock && 'text' in textBlock ? textBlock.text : '';

      await this.logUsage({
        userId: request.userId,
        feature: request.feature,
        modelName: model,
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        latencyMs,
        status: GenerationStatus.COMPLETED,
      });

      return {
        content,
        modelName: model,
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      await this.logUsage({
        userId: request.userId,
        feature: request.feature,
        modelName: request.model ?? this.defaultModel,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs,
        status: GenerationStatus.FAILED,
      });
      this.logger.error(`generateText failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException({
        code: 'AI_PROVIDER_ERROR',
        message: 'The AI provider returned an error. Please try again.',
      });
    }
  }

  /**
   * Image generation — used by VisualStudioModule for AI Scripture Image
   * Generator™, Bible Story Visualizer™, Memory Verse Visualizer™, and
   * Christian Content Creator™. Stub: returns placeholder URLs; a real
   * implementation calls the configured diffusion provider
   * (IMAGE_PROVIDER_API_KEY) and uploads the result to S3 (§08 §3.3).
   */
  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResult> {
    const start = Date.now();
    this.logger.warn('generateImage is a stub — no image provider is wired up yet');

    const latencyMs = Date.now() - start;
    await this.logUsage({
      userId: request.userId,
      feature: 'IMAGE_GENERATION' as any,
      modelName: 'stub-diffusion-model',
      promptTokens: 0,
      completionTokens: 0,
      latencyMs,
      status: GenerationStatus.COMPLETED,
    });

    return {
      resultUrl: 'https://cdn.faithgpt.app/placeholder/image-generation-result.png',
      thumbnailUrl: 'https://cdn.faithgpt.app/placeholder/image-generation-thumb.png',
      modelName: 'stub-diffusion-model',
      latencyMs,
    };
  }

  /**
   * Generates the canonical 15-section devotion output (docs/00 §8) as an
   * async generator, yielding one `DevotionSectionEvent` per section in
   * canonical order. DevotionsService consumes this both to stream
   * `event: section` SSE payloads and to assemble the final `sections` JSON
   * persisted on the Devotion row.
   *
   * Stub implementation: yields placeholder content per section without
   * calling the LLM, so the streaming contract can be exercised end-to-end
   * without a live ANTHROPIC_API_KEY. A full implementation would call
   * `generateText()` once per section (or a single structured-output call)
   * using DevotionTemplate.systemPrompt for `request.type`/`request.depth`.
   */
  async *generateDevotionSections(
    request: GenerateDevotionSectionsRequest,
  ): AsyncGenerator<DevotionSectionEvent> {
    const sectionsToGenerate: readonly DevotionSectionKey[] = request.sectionKey
      ? [request.sectionKey as DevotionSectionKey]
      : DEVOTION_SECTION_KEYS;

    for (const section of sectionsToGenerate) {
      yield this.placeholderSection(section, request);
    }
  }

  private placeholderSection(
    section: DevotionSectionKey,
    request: GenerateDevotionSectionsRequest,
  ): DevotionSectionEvent {
    const arraySections: DevotionSectionKey[] = [
      'reflectionQuestions',
      'discussionQuestions',
      'actionSteps',
      'relatedScriptures',
    ];

    if (arraySections.includes(section)) {
      return {
        section,
        content: [`Placeholder ${section} item 1 for ${request.passageKey}`],
      };
    }

    if (section === 'title') {
      return { section, content: `Devotion on ${request.passageKey}` };
    }

    return {
      section,
      content: `[Placeholder ${section} content for ${request.passageKey} (${request.type}/${request.depth})]`,
    };
  }

  /**
   * Writes an AIUsageLog row for every AI Gateway call, regardless of caller
   * (docs/08-backend-architecture.md §2.1). costUsdMicros is left at 0 in this
   * stub — a full implementation would compute cost from token counts and the
   * provider's published per-token pricing for `modelName`.
   */
  private async logUsage(entry: {
    userId?: string;
    feature: import('@prisma/client').AIFeature;
    modelName: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    status: GenerationStatus;
  }): Promise<void> {
    try {
      await this.prisma.aIUsageLog.create({
        data: {
          userId: entry.userId,
          feature: entry.feature,
          modelName: entry.modelName,
          promptTokens: entry.promptTokens,
          completionTokens: entry.completionTokens,
          costUsdMicros: 0,
          latencyMs: entry.latencyMs,
          status: entry.status,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write AIUsageLog: ${(error as Error).message}`);
    }
  }

  /** Exposed for GenerateTextResult consumers that need the AIGateway's default model. */
  getDefaultModel(): string {
    return this.defaultModel;
  }
}
