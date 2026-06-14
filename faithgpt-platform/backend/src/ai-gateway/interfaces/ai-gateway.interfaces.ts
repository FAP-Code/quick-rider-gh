import { AIFeature, DevotionDepth, DevotionType, ImageStyle } from '@prisma/client';

/**
 * Generic text-generation request handled by AiGatewayService.generateText()
 * (docs/08-backend-architecture.md §2.1). Used by DevotionsModule, AIStudyModule,
 * PrayersModule, SermonsModule, and the Scripture Analysis Engine.
 */
export interface GenerateTextRequest {
  feature: AIFeature;
  userId?: string;
  systemPrompt: string;
  userPrompt: string;
  /** Hint for model selection / cost tier — provider-specific. */
  model?: string;
  maxTokens?: number;
  temperature?: number;
  /** When true, callers expect a stream of incremental chunks. */
  stream?: boolean;
}

/** Non-streamed text generation result. */
export interface GenerateTextResult {
  content: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

/** A single incremental chunk from a streamed text generation. */
export interface GenerateTextChunk {
  delta: string;
  done: boolean;
}

/**
 * Image-generation request handled by AiGatewayService.generateImage()
 * (consumed by VisualStudioModule).
 */
export interface GenerateImageRequest {
  userId: string;
  prompt: string;
  style: ImageStyle;
  width?: number;
  height?: number;
}

export interface GenerateImageResult {
  resultUrl: string;
  thumbnailUrl: string;
  modelName: string;
  latencyMs: number;
}

/**
 * Input to AiGatewayService.generateDevotionSections() — the AI Verse-to-Devotion
 * Engine™ entry point consumed by DevotionsService.
 */
export interface GenerateDevotionSectionsRequest {
  userId: string;
  passageKey: string;
  versionCode: string;
  type: DevotionType;
  depth: DevotionDepth;
  themes?: string[];
  /** Optional: regenerate only this section of an existing devotion. */
  sectionKey?: string;
}
