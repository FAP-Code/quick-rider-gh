import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'memory_verse_provider.g.dart';

/// Placeholder state for the Memory Verse Visualizer™ (docs/02 §1.3) — STUB.
class MemoryVerseState {
  const MemoryVerseState();
}

@riverpod
class MemoryVerse extends _$MemoryVerse {
  @override
  Future<MemoryVerseState> build() async => const MemoryVerseState();
}
