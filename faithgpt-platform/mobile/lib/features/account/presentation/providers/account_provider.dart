import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'account_provider.g.dart';

/// Placeholder state for Account & Settings (docs/02 §1.6) — STUB.
class AccountState {
  const AccountState();
}

@riverpod
class Account extends _$Account {
  @override
  Future<AccountState> build() async => const AccountState();
}
