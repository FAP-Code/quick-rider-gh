import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'ai_assistant_provider.g.dart';

/// Placeholder state for the AI Bible Study Assistant™ (docs/02 §1.3) — STUB.
class AiAssistantState {
  const AiAssistantState();
}

@riverpod
class AiAssistant extends _$AiAssistant {
  @override
  Future<AiAssistantState> build() async => const AiAssistantState();
}
