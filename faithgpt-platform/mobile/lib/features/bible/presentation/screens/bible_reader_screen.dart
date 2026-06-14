import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../shared/widgets/loading_indicator.dart';
import '../providers/bible_provider.dart';
import '../widgets/verse_selection_sheet.dart';

/// Bible tab (docs/02-information-architecture.md §1.2,
/// docs/16-screen-designs.md §4). With no `bookId`/`chapter` this shows a
/// book picker; once a book/chapter is selected it renders the chapter's
/// verses, each tappable to open the [VerseSelectionSheet].
class BibleReaderScreen extends ConsumerWidget {
  const BibleReaderScreen({this.bookId, this.chapter, super.key});

  final String? bookId;
  final int? chapter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (bookId == null || chapter == null) {
      return const _BookPicker();
    }

    final versesAsync = ref.watch(bibleChapterProvider(bookId: bookId!, chapter: chapter!));
    final versionCode = ref.watch(selectedBibleVersionProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Chapter $chapter'),
        actions: [
          PopupMenuButton<String>(
            initialValue: versionCode,
            onSelected: (value) => ref.read(selectedBibleVersionProvider.notifier).state = value,
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'ESV', child: Text('ESV')),
              PopupMenuItem(value: 'KJV', child: Text('KJV')),
              PopupMenuItem(value: 'NIV', child: Text('NIV')),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(child: Text(versionCode)),
            ),
          ),
        ],
      ),
      body: versesAsync.when(
        data: (verses) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: verses.length,
          itemBuilder: (context, index) {
            final verse = verses[index];
            return InkWell(
              onTap: () => VerseSelectionSheet.show(context, verse),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: RichText(
                  text: TextSpan(
                    style: Theme.of(context)
                        .textTheme
                        .bodyLarge
                        ?.copyWith(fontFamily: 'Fraunces', height: 1.6),
                    children: [
                      TextSpan(
                        text: '${verse.verse} ',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontStyle: FontStyle.italic),
                      ),
                      TextSpan(text: verse.text),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
        loading: () => const LoadingIndicator(),
        error: (error, _) => Center(child: Text('Failed to load chapter: $error')),
      ),
    );
  }
}

class _BookPicker extends ConsumerWidget {
  const _BookPicker();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booksAsync = ref.watch(bibleBooksProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Bible')),
      body: booksAsync.when(
        data: (books) => ListView.separated(
          itemCount: books.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final book = books[index];
            return ListTile(
              title: Text(book.name),
              subtitle: Text('${book.chapterCount} chapters · ${book.testament}'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.goNamed(
                'bibleReader',
                pathParameters: {'bookId': book.id, 'chapter': '1'},
              ),
            );
          },
        ),
        loading: () => const LoadingIndicator(),
        error: (error, _) => Center(child: Text('Failed to load books: $error')),
      ),
    );
  }
}
