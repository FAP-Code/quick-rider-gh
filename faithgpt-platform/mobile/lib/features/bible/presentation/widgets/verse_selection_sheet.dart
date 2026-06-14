import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/bible_repository.dart';
import '../../data/models/bible_models.dart';

/// "Selection → Action Sheet" pattern (docs/15-ui-ux-specifications.md §5.1
/// `ActionSheet`) — opened when a verse is tapped in the Bible reader.
/// Row ordering is fixed: Generate Devotion, Ask AI, Generate Prayer,
/// Generate Image, Highlight/Note/Bookmark, Cross-References.
class VerseSelectionSheet extends ConsumerWidget {
  const VerseSelectionSheet({required this.verse, super.key});

  final BibleVerse verse;

  static Future<void> show(BuildContext context, BibleVerse verse) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => VerseSelectionSheet(verse: verse),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            title: Text(verse.reference, style: Theme.of(context).textTheme.titleMedium),
            subtitle: Text(verse.text, maxLines: 2, overflow: TextOverflow.ellipsis),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.auto_stories_outlined),
            title: const Text('Generate Devotion'),
            onTap: () {
              Navigator.of(context).pop();
              context.go('/studio');
            },
          ),
          ListTile(
            leading: const Icon(Icons.chat_bubble_outline),
            title: const Text('Ask AI'),
            onTap: () => Navigator.of(context).pop(),
          ),
          ListTile(
            leading: const Icon(Icons.volunteer_activism_outlined),
            title: const Text('Generate Prayer'),
            onTap: () => Navigator.of(context).pop(),
          ),
          ListTile(
            leading: const Icon(Icons.image_outlined),
            title: const Text('Generate Image'),
            onTap: () {
              Navigator.of(context).pop();
              context.goNamed('imageGenerator');
            },
          ),
          ListTile(
            leading: const Icon(Icons.highlight_outlined),
            title: const Text('Highlight'),
            onTap: () async {
              await ref.read(bibleRepositoryProvider).addHighlight(verse.id);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          ListTile(
            leading: const Icon(Icons.note_add_outlined),
            title: const Text('Add Note'),
            onTap: () => Navigator.of(context).pop(),
          ),
          ListTile(
            leading: const Icon(Icons.bookmark_add_outlined),
            title: const Text('Bookmark'),
            onTap: () async {
              await ref.read(bibleRepositoryProvider).addBookmark(verse.id);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          ListTile(
            leading: const Icon(Icons.compare_arrows_outlined),
            title: const Text('Cross-References'),
            onTap: () => Navigator.of(context).pop(),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
