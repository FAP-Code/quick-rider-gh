import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../shared/widgets/verse_card.dart';
import '../../../../shared/widgets/section_card.dart';

/// Home (Dashboard) tab — docs/02-information-architecture.md §1.1.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('FaithGPT'),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_outlined)),
          IconButton(
            onPressed: () => context.push('/account'),
            icon: const Icon(Icons.account_circle_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          VerseCard(
            reference: 'Jeremiah 29:11',
            text: '"For I know the plans I have for you," declares the Lord...',
          ),
          SizedBox(height: 16),
          SectionCard(
            title: "Today's Devotion",
            body: 'Tap to read your AI-generated devotion for today.',
            icon: Icons.auto_stories_outlined,
          ),
          SizedBox(height: 16),
          SectionCard(
            title: 'Streak Summary',
            body: 'Reading, Prayer, and Devotion streaks at a glance.',
            icon: Icons.local_fire_department_outlined,
          ),
        ],
      ),
    );
  }
}
