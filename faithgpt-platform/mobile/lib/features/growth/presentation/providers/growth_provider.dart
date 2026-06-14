import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'growth_provider.g.dart';

/// Placeholder state for the Spiritual Growth Dashboard™ (docs/02 §1.5) — STUB.
class GrowthState {
  const GrowthState();
}

@riverpod
class Growth extends _$Growth {
  @override
  Future<GrowthState> build() async => const GrowthState();
}
