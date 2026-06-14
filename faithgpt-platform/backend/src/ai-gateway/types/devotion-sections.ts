/**
 * Canonical 15-section AI Verse-to-Devotion Engine™ output
 * (docs/00-shared-reference.md §8 / api/openapi.yaml `DevotionSections`).
 *
 * Order matters: this is the order sections are streamed as SSE `event: section`
 * payloads (docs/09-api-architecture.md §6.1).
 */
export const DEVOTION_SECTION_KEYS = [
  'title',
  'keyScripture',
  'historicalContext',
  'biblicalContext',
  'verseExplanation',
  'theologicalInsights',
  'spiritualLessons',
  'lifeApplications',
  'reflectionQuestions',
  'discussionQuestions',
  'prayer',
  'actionSteps',
  'memoryVerse',
  'relatedScriptures',
  'closingEncouragement',
] as const;

export type DevotionSectionKey = (typeof DEVOTION_SECTION_KEYS)[number];

/** String-valued sections (rendered as paragraphs/markdown). */
export type DevotionStringSectionKey = Exclude<
  DevotionSectionKey,
  'reflectionQuestions' | 'discussionQuestions' | 'actionSteps' | 'relatedScriptures'
>;

/** Array-valued sections (rendered as lists). */
export type DevotionArraySectionKey =
  | 'reflectionQuestions'
  | 'discussionQuestions'
  | 'actionSteps'
  | 'relatedScriptures';

/**
 * Full structured devotion output persisted to `Devotion.sections` (Json).
 * Mirrors `components/schemas/DevotionSections` in api/openapi.yaml.
 */
export interface DevotionSections {
  title: string;
  keyScripture: string;
  historicalContext: string;
  biblicalContext: string;
  verseExplanation: string;
  theologicalInsights: string;
  spiritualLessons: string;
  lifeApplications: string;
  reflectionQuestions: string[];
  discussionQuestions: string[];
  prayer: string;
  actionSteps: string[];
  memoryVerse: string;
  relatedScriptures: string[];
  closingEncouragement: string;
}

/** A single streamed/generated section event (SSE `event: section` payload). */
export interface DevotionSectionEvent {
  section: DevotionSectionKey;
  content: string | string[];
}
