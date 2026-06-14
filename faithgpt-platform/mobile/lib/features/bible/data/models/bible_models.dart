import 'package:freezed_annotation/freezed_annotation.dart';

part 'bible_models.freezed.dart';
part 'bible_models.g.dart';

/// Mirrors `BibleVersion` (schema/schema.prisma) — translation metadata.
@freezed
class BibleVersion with _$BibleVersion {
  const factory BibleVersion({
    required String id,
    required String code,
    required String name,
    required String language,
    required String license,
    required bool isOfflineBundled,
    String? publisher,
  }) = _BibleVersion;

  factory BibleVersion.fromJson(Map<String, dynamic> json) => _$BibleVersionFromJson(json);
}

/// Mirrors `BibleBook` (schema/schema.prisma).
@freezed
class BibleBook with _$BibleBook {
  const factory BibleBook({
    required String id,
    required String name,
    required String abbreviation,
    required String testament,
    required int orderIndex,
    required int chapterCount,
  }) = _BibleBook;

  factory BibleBook.fromJson(Map<String, dynamic> json) => _$BibleBookFromJson(json);
}

/// A single verse with resolved text for a given version — mirrors the
/// `VerseWithText` API schema (`BibleVerse` joined with `VerseText`).
@freezed
class BibleVerse with _$BibleVerse {
  const factory BibleVerse({
    required String id,
    required String bookId,
    required int chapter,
    required int verse,
    required String reference,
    required String text,
    required String versionCode,
  }) = _BibleVerse;

  factory BibleVerse.fromJson(Map<String, dynamic> json) => _$BibleVerseFromJson(json);
}

/// Mirrors the `Highlight` API schema.
@freezed
class Highlight with _$Highlight {
  const factory Highlight({
    required String id,
    required String verseId,
    required String color,
    required DateTime createdAt,
  }) = _Highlight;

  factory Highlight.fromJson(Map<String, dynamic> json) => _$HighlightFromJson(json);
}

/// Mirrors the `Note` API schema (named `BibleNote` to avoid clashing with
/// Journal's `JournalEntry` notes).
@freezed
class BibleNote with _$BibleNote {
  const factory BibleNote({
    required String id,
    required String verseId,
    required String content,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _BibleNote;

  factory BibleNote.fromJson(Map<String, dynamic> json) => _$BibleNoteFromJson(json);
}

/// Mirrors the `Bookmark` API schema.
@freezed
class Bookmark with _$Bookmark {
  const factory Bookmark({
    required String id,
    required String verseId,
    required DateTime createdAt,
  }) = _Bookmark;

  factory Bookmark.fromJson(Map<String, dynamic> json) => _$BookmarkFromJson(json);
}
