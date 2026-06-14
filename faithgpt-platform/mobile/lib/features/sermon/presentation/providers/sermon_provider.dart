import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'sermon_provider.g.dart';

/// Placeholder state for Sermon Studio (docs/02 §1.3) — STUB.
class SermonState {
  const SermonState();
}

@riverpod
class Sermon extends _$Sermon {
  @override
  Future<SermonState> build() async => const SermonState();
}
