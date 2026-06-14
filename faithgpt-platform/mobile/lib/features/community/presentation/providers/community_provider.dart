import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'community_provider.g.dart';

/// Placeholder state for the Community tab (docs/02 §1.4) — STUB.
class CommunityState {
  const CommunityState();
}

@riverpod
class Community extends _$Community {
  @override
  Future<CommunityState> build() async => const CommunityState();
}
