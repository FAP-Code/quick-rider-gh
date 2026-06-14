import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../data/auth_repository.dart';
import '../../data/models/user_model.dart';

part 'auth_provider.g.dart';

enum AuthStatus { unauthenticated, authenticated }

/// Session state surfaced to `app_router.dart` redirect logic and to the
/// Account tab (§02 §1.6).
class AuthState {
  const AuthState({required this.status, this.user});

  final AuthStatus status;
  final UserModel? user;

  bool get isAuthenticated => status == AuthStatus.authenticated;

  static const unauthenticated = AuthState(status: AuthStatus.unauthenticated);
}

@riverpod
class Auth extends _$Auth {
  @override
  Future<AuthState> build() async {
    final user = await ref.watch(authRepositoryProvider).currentUser();
    return user == null
        ? AuthState.unauthenticated
        : AuthState(status: AuthStatus.authenticated, user: user);
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await ref.read(authRepositoryProvider).login(email: email, password: password);
      return AuthState(status: AuthStatus.authenticated, user: session.user);
    });
  }

  Future<void> signup({required String name, required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final session = await ref
          .read(authRepositoryProvider)
          .signup(name: name, email: email, password: password);
      return AuthState(status: AuthStatus.authenticated, user: session.user);
    });
  }

  Future<void> setDenominationLens(String denominationLens) async {
    final current = state.value;
    if (current?.user == null) return;
    // TODO: PATCH /api/v1/users/me { denominationLens } — see docs/09 Users.
    state = AsyncData(AuthState(
      status: current!.status,
      user: current.user!.copyWith(denominationLens: denominationLens),
    ));
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(AuthState.unauthenticated);
  }
}
