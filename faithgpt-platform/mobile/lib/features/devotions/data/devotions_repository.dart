import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/sse_client.dart';
import 'models/devotion_model.dart';

/// AI Verse-to-Devotion Engine™ API surface — docs/06 §2-4, docs/09 §6,
/// docs/18-ai-devotion-engine.md.
class DevotionsRepository {
  DevotionsRepository(this._dio, this._apiClient);

  final Dio _dio;
  final ApiClient _apiClient;

  Future<List<Devotion>> getDevotions() async {
    final response = await _dio.get(ApiEndpoints.devotions);
    final items = (response.data['data'] as List).cast<Map<String, dynamic>>();
    return items.map(Devotion.fromJson).toList();
  }

  Future<Devotion> getDevotion(String id) async {
    final response = await _dio.get(ApiEndpoints.devotionById(id));
    return Devotion.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  /// Streams the 15 canonical sections (docs/00 §8) as the AI generates
  /// them, then a final `done` event carrying the persisted [Devotion].
  Stream<DevotionSectionEvent> generateDevotion(GenerateDevotionRequest request) {
    final rawChunks = _apiClient.streamSse(ApiEndpoints.devotionGenerate, data: request.toJson());
    return SseClient.parse(rawChunks).map((event) {
      switch (event.event) {
        case 'section':
          final json = event.json;
          return DevotionSectionEvent.section(
            sectionKey: json['section'] as String,
            content: json['content'] as Object,
          );
        case 'done':
          return DevotionSectionEvent.done(
            devotion: Devotion.fromJson(event.json['data'] as Map<String, dynamic>),
          );
        default:
          return DevotionSectionEvent.error(
            message: event.json['message']?.toString() ?? 'Unknown error generating devotion',
          );
      }
    });
  }

  /// Regenerates a single section (e.g. after a citation-validation failure
  /// fallback, docs/15 §6) — `POST /devotions/{id}/sections/{sectionKey}/regenerate`.
  Future<Devotion> regenerateSection(String devotionId, String sectionKey) async {
    final response = await _dio.post(ApiEndpoints.devotionSectionRegenerate(devotionId, sectionKey));
    return Devotion.fromJson(response.data['data'] as Map<String, dynamic>);
  }
}

final devotionsRepositoryProvider = Provider<DevotionsRepository>((ref) {
  return DevotionsRepository(ref.watch(dioProvider), ref.watch(apiClientProvider));
});
