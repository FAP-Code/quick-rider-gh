import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'story_visualizer_provider.g.dart';

/// Placeholder state for the AI Bible Story Visualizer™ (docs/02 §1.3) — STUB.
class StoryVisualizerState {
  const StoryVisualizerState();
}

@riverpod
class StoryVisualizer extends _$StoryVisualizer {
  @override
  Future<StoryVisualizerState> build() async => const StoryVisualizerState();
}
