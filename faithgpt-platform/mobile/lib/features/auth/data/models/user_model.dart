import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

/// Mirrors the `User` model in schema/schema.prisma (subset exposed to clients).
@freezed
class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    String? email,
    String? phone,
    required String name,
    String? avatarUrl,
    required String role,
    String? denominationLens,
    required String locale,
    String? defaultBibleVersionId,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) => _$UserModelFromJson(json);
}

/// Access/refresh token pair returned by auth endpoints.
@freezed
class AuthTokens with _$AuthTokens {
  const factory AuthTokens({
    required String accessToken,
    required String refreshToken,
  }) = _AuthTokens;

  factory AuthTokens.fromJson(Map<String, dynamic> json) => _$AuthTokensFromJson(json);
}

/// Combined login/signup response.
@freezed
class AuthSession with _$AuthSession {
  const factory AuthSession({
    required UserModel user,
    required AuthTokens tokens,
  }) = _AuthSession;

  factory AuthSession.fromJson(Map<String, dynamic> json) => _$AuthSessionFromJson(json);
}
