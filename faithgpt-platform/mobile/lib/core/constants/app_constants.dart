/// Enums mirrored from schema/schema.prisma — see docs/00-shared-reference.md §6-12.

enum DevotionType {
  personal,
  family,
  youth,
  children,
  pathfinder,
  women,
  men,
  leadership,
  marriage,
  evangelistic,
  sabbathSchool,
  smallGroup,
  sermonPrep,
}

enum DevotionDepth {
  quick,
  standard,
  deep,
  advanced,
  teaching,
  sermon,
}

enum ImageStyle {
  photorealistic,
  cinematic,
  christianArtwork,
  cartoon,
  childrensStorybook,
  comicBook,
  watercolor,
  oilPainting,
  minimalistPoster,
  socialMediaGraphic,
}

enum ImageSourceType {
  verse,
  chapter,
  bibleStory,
  devotion,
  prayer,
  sermon,
  memoryVerse,
  customPrompt,
}

enum PrayerType {
  personal,
  family,
  healing,
  intercessory,
  gratitude,
  leadership,
  marriage,
  guidance,
  strength,
}

enum AIQuestionCategory {
  meaning,
  simpleExplanation,
  childrensExplanation,
  historicalBackground,
  culturalContext,
  modernApplication,
  hebrewOriginal,
  greekOriginal,
  crossReferences,
  characterParallels,
  christConnection,
  general,
}

/// App-wide constants.
class AppConstants {
  AppConstants._();

  static const String appName = 'FaithGPT';
  static const String tagline = 'Transforming Scripture into Daily Living';
}
