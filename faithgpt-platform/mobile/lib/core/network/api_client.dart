import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage_service.dart';

const String _baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://api.faithgpt.app',
);

/// Shared Dio client with auth + error-mapping interceptors.
class ApiClient {
  ApiClient(this._secureStorage) {
    dio = Dio(
      BaseOptions(
        baseUrl: _baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
      ),
    );
    dio.interceptors.add(_authInterceptor());
    dio.interceptors.add(_errorInterceptor());
  }

  final SecureStorageService _secureStorage;
  late final Dio dio;

  Interceptor _authInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _secureStorage.readAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // TODO hook: refresh token + retry handled by AuthRepository.
        }
        handler.next(error);
      },
    );
  }

  Interceptor _errorInterceptor() {
    return InterceptorsWrapper(
      onError: (error, handler) {
        final mapped = DioException(
          requestOptions: error.requestOptions,
          error: error.error,
          message: error.response?.data?['message']?.toString() ?? error.message,
          response: error.response,
          type: error.type,
        );
        handler.next(mapped);
      },
    );
  }

  /// Opens a Server-Sent-Events stream for AI generation endpoints
  /// (devotion/prayer/sermon/chat streams — see §06 AI Architecture).
  Stream<String> streamSse(String path, {Map<String, dynamic>? data}) async* {
    final response = await dio.post<ResponseBody>(
      path,
      data: data,
      options: Options(
        responseType: ResponseType.stream,
        headers: {'Accept': 'text/event-stream'},
      ),
    );

    final stream = response.data!.stream;
    await for (final chunk in stream) {
      yield String.fromCharCodes(chunk);
    }
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(secureStorageServiceProvider));
});
