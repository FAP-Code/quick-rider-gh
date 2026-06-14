import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/devotions_repository.dart';
import '../../data/models/devotion_model.dart';

part 'devotion_provider.g.dart';

enum DevotionGenerationStatus { idle, streaming, done, error }

/// In-progress generation state, filled in section-by-section as SSE
/// `section` events arrive (docs/09 §6, docs/15 §8 "AI streaming reveal").
class DevotionGenerationState {
  const DevotionGenerationState({
    this.status = DevotionGenerationStatus.idle,
    this.sections = const DevotionSections(),
    this.devotion,
    this.errorMessage,
  });

  final DevotionGenerationStatus status;
  final DevotionSections sections;
  final Devotion? devotion;
  final String? errorMessage;

  DevotionGenerationState copyWith({
    DevotionGenerationStatus? status,
    DevotionSections? sections,
    Devotion? devotion,
    String? errorMessage,
  }) {
    return DevotionGenerationState(
      status: status ?? this.status,
      sections: sections ?? this.sections,
      devotion: devotion ?? this.devotion,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

@riverpod
class DevotionGeneration extends _$DevotionGeneration {
  @override
  DevotionGenerationState build() => const DevotionGenerationState();

  Future<void> generate(GenerateDevotionRequest request) async {
    state = const DevotionGenerationState(status: DevotionGenerationStatus.streaming);
    final stream = ref.read(devotionsRepositoryProvider).generateDevotion(request);

    await for (final event in stream) {
      switch (event) {
        case DevotionSectionUpdate(sectionKey: final key, content: final content):
          state = state.copyWith(sections: _applySection(state.sections, key, content));
        case DevotionGenerationDone(devotion: final devotion):
          state = state.copyWith(
            status: DevotionGenerationStatus.done,
            devotion: devotion,
            sections: devotion.sections,
          );
        case DevotionGenerationError(message: final message):
          state = state.copyWith(status: DevotionGenerationStatus.error, errorMessage: message);
      }
    }
  }

  DevotionSections _applySection(DevotionSections current, String key, Object content) {
    final json = current.toJson();
    json[key] = content;
    return DevotionSections.fromJson(json);
  }
}

@riverpod
Future<List<Devotion>> devotionHistory(DevotionHistoryRef ref) {
  return ref.watch(devotionsRepositoryProvider).getDevotions();
}

@riverpod
Future<Devotion> devotionById(DevotionByIdRef ref, String id) {
  return ref.watch(devotionsRepositoryProvider).getDevotion(id);
}
