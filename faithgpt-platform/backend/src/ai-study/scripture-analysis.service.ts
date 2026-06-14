import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { ScriptureAnalysisRequestDto, ScriptureAnalysisResultDto } from './dto/scripture-analysis.dto';

/**
 * Scripture Analysis Engine (api/openapi.yaml `Scripture Analysis` tag;
 * docs/06-ai-architecture.md). Conceptually part of BibleModule's
 * Cross-Reference/Scripture-Analysis surface (see bible.module.ts), but
 * exposed here on AiStudyModule per the AI Gateway-adjacent grouping used in
 * this scaffold. Backed by ScriptureAnalysisCache — `meta.cacheHit` indicates
 * whether the AI Gateway was invoked or a cached result was served.
 */
@Injectable()
export class ScriptureAnalysisService {
  private readonly logger = new Logger(ScriptureAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
  ) {}

  async analyze(
    userId: string,
    dto: ScriptureAnalysisRequestDto,
  ): Promise<{ data: ScriptureAnalysisResultDto; meta: { cacheHit: boolean } }> {
    const versionCode = dto.versionCode ?? 'ESV';

    const cached = await this.prisma.scriptureAnalysisCache.findUnique({
      where: { passageKey: dto.passageKey },
    });

    if (cached && (!cached.expiresAt || cached.expiresAt > new Date())) {
      return {
        data: {
          passageKey: cached.passageKey,
          versionCode: cached.versionCode,
          themes: cached.themes as unknown as ScriptureAnalysisResultDto['themes'],
          elements: cached.elements as unknown as ScriptureAnalysisResultDto['elements'],
          suggestedThemes: cached.suggestedThemes as unknown as string[],
        },
        meta: { cacheHit: true },
      };
    }

    const result = await this.generate(userId, dto.passageKey, versionCode);

    await this.prisma.scriptureAnalysisCache.upsert({
      where: { passageKey: dto.passageKey },
      create: {
        passageKey: dto.passageKey,
        versionCode,
        themes: result.themes as any,
        elements: result.elements as any,
        suggestedThemes: result.suggestedThemes as any,
      },
      update: {
        versionCode,
        themes: result.themes as any,
        elements: result.elements as any,
        suggestedThemes: result.suggestedThemes as any,
      },
    });

    return { data: result, meta: { cacheHit: false } };
  }

  /**
   * Stub: invokes the AI Gateway to produce a placeholder structured analysis.
   * A full implementation would prompt the LLM for a structured
   * {themes, elements, suggestedThemes} JSON payload (§06 AI Architecture)
   * and validate it against ScriptureAnalysisResult.
   */
  private async generate(
    userId: string,
    passageKey: string,
    versionCode: string,
  ): Promise<ScriptureAnalysisResultDto> {
    try {
      await this.aiGateway.generateText({
        feature: 'SCRIPTURE_ANALYSIS',
        userId,
        systemPrompt:
          'You are the FaithGPT Scripture Analysis Engine. Given a passage, identify ' +
          'its key themes and biblical elements (commands, promises, warnings, blessings, prophecy).',
        userPrompt: `Analyze ${passageKey} (${versionCode}).`,
      });
    } catch (error) {
      this.logger.warn(`Scripture analysis generation failed, returning placeholder: ${(error as Error).message}`);
    }

    return {
      passageKey,
      versionCode,
      themes: [{ slug: 'hope', name: 'Hope', relevance: 0.5 }],
      elements: [{ type: 'PROMISE', note: `Placeholder analysis for ${passageKey}` }],
      suggestedThemes: ['Placeholder Theme A', 'Placeholder Theme B'],
    };
  }
}
