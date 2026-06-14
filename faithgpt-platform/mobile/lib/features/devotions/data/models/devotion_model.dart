import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/constants/app_constants.dart';

part 'devotion_model.freezed.dart';
part 'devotion_model.g.dart';

/// The canonical 15-section structured output of the AI Verse-to-Devotion
/// Engine™ — docs/00-shared-reference.md §8. Fields are nullable/empty until
/// their SSE `section` event arrives (docs/09 §6).
@freezed
class DevotionSections with _$DevotionSections {
  const factory DevotionSections({
    String? title,
    String? keyScripture,
    String? historicalContext,
    String? biblicalContext,
    String? verseExplanation,
    String? theologicalInsights,
    String? spiritualLessons,
    String? lifeApplications,
    @Default(<String>[]) List<String> reflectionQuestions,
    @Default(<String>[]) List<String> discussionQuestions,
    String? prayer,
    @Default(<String>[]) List<String> actionSteps,
    String? memoryVerse,
    @Default(<String>[]) List<String> relatedScriptures,
    String? closingEncouragement,
  }) = _DevotionSections;

  factory DevotionSections.fromJson(Map<String, dynamic> json) => _$DevotionSectionsFromJson(json);
}

/// Mirrors the `Devotion` API schema / Prisma `Devotion` model.
@freezed
class Devotion with _$Devotion {
  const factory Devotion({
    required String id,
    required String title,
    required String passageKey,
    required String versionCode,
    required DevotionType type,
    required DevotionDepth depth,
    required DevotionSections sections,
    String? memoryVerseRef,
    @Default(false) bool isFavorite,
    @Default(false) bool isShared,
    required DateTime createdAt,
  }) = _Devotion;

  factory Devotion.fromJson(Map<String, dynamic> json) => _$DevotionFromJson(json);
}

/// Request body for `POST /devotions/generate` (docs/02 §1.3 Devotion Setup
/// Wizard: passage → themes → type → depth).
@freezed
class GenerateDevotionRequest with _$GenerateDevotionRequest {
  const factory GenerateDevotionRequest({
    required String passageKey,
    @Default('ESV') String versionCode,
    required DevotionType type,
    required DevotionDepth depth,
    @Default(<String>[]) List<String> themes,
  }) = _GenerateDevotionRequest;

  factory GenerateDevotionRequest.fromJson(Map<String, dynamic> json) => _$GenerateDevotionRequestFromJson(json);
}

/// One event in the AI Verse-to-Devotion Engine™ SSE stream
/// (docs/09-api-architecture.md §6: `section` / `done` / `error`).
@freezed
sealed class DevotionSectionEvent with _$DevotionSectionEvent {
  const factory DevotionSectionEvent.section({
    required String sectionKey,
    required Object content,
  }) = DevotionSectionUpdate;

  const factory DevotionSectionEvent.done({required Devotion devotion}) = DevotionGenerationDone;

  const factory DevotionSectionEvent.error({required String message}) = DevotionGenerationError;
}
