import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'content_creator_provider.g.dart';

/// Placeholder state for the Christian Content Creator™ (docs/02 §1.3) — STUB.
class ContentCreatorState {
  const ContentCreatorState();
}

@riverpod
class ContentCreator extends _$ContentCreator {
  @override
  Future<ContentCreatorState> build() async => const ContentCreatorState();
}
