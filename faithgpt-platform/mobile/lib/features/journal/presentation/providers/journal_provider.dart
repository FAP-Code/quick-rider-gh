import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'journal_provider.g.dart';

/// Placeholder state for the Journal tab (docs/02 §1.5) — STUB.
class JournalState {
  const JournalState();
}

@riverpod
class Journal extends _$Journal {
  @override
  Future<JournalState> build() async => const JournalState();
}
