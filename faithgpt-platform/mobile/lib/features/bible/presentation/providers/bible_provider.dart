import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/bible_repository.dart';
import '../../data/models/bible_models.dart';

part 'bible_provider.g.dart';

/// Currently-selected Bible translation code (defaults to ESV).
final selectedBibleVersionProvider = StateProvider<String>((ref) => 'ESV');

@riverpod
Future<List<BibleVersion>> bibleVersions(BibleVersionsRef ref) {
  return ref.watch(bibleRepositoryProvider).getVersions();
}

@riverpod
Future<List<BibleBook>> bibleBooks(BibleBooksRef ref) {
  return ref.watch(bibleRepositoryProvider).getBooks();
}

@riverpod
Future<List<BibleVerse>> bibleChapter(
  BibleChapterRef ref, {
  required String bookId,
  required int chapter,
}) {
  final versionCode = ref.watch(selectedBibleVersionProvider);
  return ref.watch(bibleRepositoryProvider).getChapter(bookId, chapter, versionCode: versionCode);
}
