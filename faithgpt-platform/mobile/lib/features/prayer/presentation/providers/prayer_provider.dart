import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'prayer_provider.g.dart';

/// Placeholder state for the AI Prayer Generator (docs/02 §1.3) — STUB.
class PrayerState {
  const PrayerState();
}

@riverpod
class Prayer extends _$Prayer {
  @override
  Future<PrayerState> build() async => const PrayerState();
}
