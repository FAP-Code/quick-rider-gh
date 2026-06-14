import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'local_database.g.dart';

/// Offline cache of downloaded Bible verse text per version.
class BibleVerses extends Table {
  TextColumn get id => text()();
  TextColumn get bookId => text()();
  IntColumn get chapter => integer()();
  IntColumn get verse => integer()();
  TextColumn get versionCode => text()();
  TextColumn get text => text()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Offline cache of generated devotions for the Devotions Module.
class CachedDevotions extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get passageKey => text()();
  TextColumn get type => text()();
  TextColumn get depth => text()();
  TextColumn get sectionsJson => text()();
  DateTimeColumn get createdAt => dateTime()();
  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Local journal entries available offline.
class JournalEntriesTable extends Table {
  TextColumn get id => text()();
  TextColumn get type => text()();
  TextColumn get title => text().nullable()();
  TextColumn get content => text()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Local highlights/notes/bookmarks for offline Bible interactions.
class HighlightsTable extends Table {
  TextColumn get id => text()();
  TextColumn get verseId => text()();
  TextColumn get color => text().withDefault(const Constant('yellow'))();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [BibleVerses, CachedDevotions, JournalEntriesTable, HighlightsTable])
class LocalDatabase extends _$LocalDatabase {
  LocalDatabase(QueryExecutor e) : super(e);

  /// Opens (or creates) the on-device SQLite file under app documents.
  factory LocalDatabase.open() {
    return LocalDatabase(LazyDatabase(() async {
      final dir = await getApplicationDocumentsDirectory();
      final file = File(p.join(dir.path, 'faithgpt.sqlite'));
      return NativeDatabase.createInBackground(file);
    }));
  }

  @override
  int get schemaVersion => 1;
}
