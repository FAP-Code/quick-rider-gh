import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/storage/secure_storage_service.dart';
import 'models/user_model.dart';

/// Auth API surface — see docs/08-backend-architecture.md `AuthModule`.
abstract class AuthRepository {
  Future<AuthSession> login({required String email, required String password});

  Future<AuthSession> signup({required String name, required String email, required String password});

  Future<AuthTokens> refresh();

  Future<void> logout();

  Future<UserModel?> currentUser();
}

class DioAuthRepository implements AuthRepository {
  DioAuthRepository(this._dio, this._secureStorage);

  final Dio _dio;
  final SecureStorageService _secureStorage;

  @override
  Future<AuthSession> login({required String email, required String password}) async {
    final response = await _dio.post(ApiEndpoints.login, data: {
      'email': email,
      'password': password,
    });
    final session = _sessionFromEnvelope(response.data as Map<String, dynamic>);
    await _secureStorage.saveTokens(
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
    );
    return session;
  }

  @override
  Future<AuthSession> signup({required String name, required String email, required String password}) async {
    final response = await _dio.post(ApiEndpoints.register, data: {
      'name': name,
      'email': email,
      'password': password,
    });
    final session = _sessionFromEnvelope(response.data as Map<String, dynamic>);
    await _secureStorage.saveTokens(
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
    );
    return session;
  }

  @override
  Future<AuthTokens> refresh() async {
    final refreshToken = await _secureStorage.readRefreshToken();
    final response = await _dio.post(ApiEndpoints.refresh, data: {'refreshToken': refreshToken});
    final data = response.data['data'] as Map<String, dynamic>;
    final tokens = AuthTokens(accessToken: data['accessToken'] as String, refreshToken: data['refreshToken'] as String);
    await _secureStorage.saveTokens(accessToken: tokens.accessToken, refreshToken: tokens.refreshToken);
    return tokens;
  }

  @override
  Future<void> logout() async {
    final refreshToken = await _secureStorage.readRefreshToken();
    await _dio.post(ApiEndpoints.logout, data: {'refreshToken': refreshToken});
    await _secureStorage.clear();
  }

  @override
  Future<UserModel?> currentUser() async {
    final token = await _secureStorage.readAccessToken();
    if (token == null) return null;
    final response = await _dio.get(ApiEndpoints.profile);
    return UserModel.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  /// `AuthTokenResponse` (api/openapi.yaml) is `{data: {accessToken, refreshToken, user}}`.
  AuthSession _sessionFromEnvelope(Map<String, dynamic> body) {
    final data = body['data'] as Map<String, dynamic>;
    return AuthSession(
      user: UserModel.fromJson(data['user'] as Map<String, dynamic>),
      tokens: AuthTokens(accessToken: data['accessToken'] as String, refreshToken: data['refreshToken'] as String),
    );
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return DioAuthRepository(ref.watch(dioProvider), ref.watch(secureStorageServiceProvider));
});
