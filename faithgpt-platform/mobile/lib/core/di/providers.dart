import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import '../storage/local_database.dart';

/// Root DI providers — Riverpod providers are the sole DI mechanism (no get_it).
/// Feature-level providers depend on these via `ref.watch`.

final dioProvider = Provider<Dio>((ref) => ref.watch(apiClientProvider).dio);

final localDatabaseProvider = Provider<LocalDatabase>((ref) {
  final db = LocalDatabase.open();
  ref.onDispose(db.close);
  return db;
});
