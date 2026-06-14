import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/network/api_endpoints.dart';
import 'models/bible_models.dart';

/// Bible API surface — see docs/08-backend-architecture.md `BibleModule` and
/// the "Bible" / "Bible Interactions" tags in api/openapi.yaml.
class BibleRepository {
  BibleRepository(this._dio);

  final Dio _dio;

  Future<List<BibleVersion>> getVersions() async {
    final response = await _dio.get(ApiEndpoints.bibleVersions);
    final items = (response.data['data'] as List).cast<Map<String, dynamic>>();
    return items.map(BibleVersion.fromJson).toList();
  }

  Future<List<BibleBook>> getBooks() async {
    final response = await _dio.get(ApiEndpoints.bibleBooks);
    final items = (response.data['data'] as List).cast<Map<String, dynamic>>();
    return items.map(BibleBook.fromJson).toList();
  }

  Future<List<BibleVerse>> getChapter(String bookId, int chapter, {String versionCode = 'ESV'}) async {
    final response = await _dio.get(
      ApiEndpoints.bibleChapter(bookId, chapter),
      queryParameters: {'version': versionCode},
    );
    final items = (response.data['data'] as List).cast<Map<String, dynamic>>();
    return items.map(BibleVerse.fromJson).toList();
  }

  Future<List<BibleVerse>> search(String query, {String versionCode = 'ESV'}) async {
    final response = await _dio.get(
      ApiEndpoints.bibleSearch,
      queryParameters: {'q': query, 'version': versionCode},
    );
    final items = (response.data['data'] as List).cast<Map<String, dynamic>>();
    return items.map(BibleVerse.fromJson).toList();
  }

  Future<Highlight> addHighlight(String verseId, {String color = 'yellow'}) async {
    final response = await _dio.post(ApiEndpoints.highlights, data: {'verseId': verseId, 'color': color});
    return Highlight.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> removeHighlight(String id) => _dio.delete('${ApiEndpoints.highlights}/$id');

  Future<BibleNote> addNote(String verseId, String content) async {
    final response = await _dio.post(ApiEndpoints.notes, data: {'verseId': verseId, 'content': content});
    return BibleNote.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<Bookmark> addBookmark(String verseId) async {
    final response = await _dio.post(ApiEndpoints.bookmarks, data: {'verseId': verseId});
    return Bookmark.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> removeBookmark(String id) => _dio.delete('${ApiEndpoints.bookmarks}/$id');
}

final bibleRepositoryProvider = Provider<BibleRepository>((ref) {
  return BibleRepository(ref.watch(dioProvider));
});
