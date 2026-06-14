import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/ai_generated_badge.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/section_card.dart';
import '../../data/models/devotion_model.dart';
import '../providers/devotion_provider.dart';

/// 15-section streamed devotion result (docs/16-screen-designs.md §6).
/// `devotionId == 'generating'` watches the live [devotionGenerationProvider]
/// stream; any other id fetches a previously-generated [Devotion].
class DevotionResultScreen extends ConsumerWidget {
  const DevotionResultScreen({required this.devotionId, super.key});

  final String devotionId;

  static const _generatingId = 'generating';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (devotionId == _generatingId) {
      final generation = ref.watch(devotionGenerationProvider);
      return _ResultView(
        title: generation.sections.title ?? 'Generating your devotion…',
        sections: generation.sections,
        isStreaming: generation.status == DevotionGenerationStatus.streaming,
        errorMessage: generation.errorMessage,
      );
    }

    final devotionAsync = ref.watch(devotionByIdProvider(devotionId));
    return devotionAsync.when(
      data: (devotion) => _ResultView(
        title: devotion.title,
        sections: devotion.sections,
        isStreaming: false,
        errorMessage: null,
      ),
      loading: () => const Scaffold(body: LoadingIndicator()),
      error: (error, _) => Scaffold(body: Center(child: Text('Failed to load devotion: $error'))),
    );
  }
}

class _ResultView extends StatelessWidget {
  const _ResultView({
    required this.title,
    required this.sections,
    required this.isStreaming,
    required this.errorMessage,
  });

  final String title;
  final DevotionSections sections;
  final bool isStreaming;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    final entries = _sectionEntries(sections);

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const AiGeneratedBadge(),
          const SizedBox(height: 16),
          if (errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.warning),
              ),
              child: Text(
                "We couldn't generate this section accurately — showing general guidance instead. ($errorMessage)",
              ),
            ),
            const SizedBox(height: 16),
          ],
          for (final entry in entries) ...[
            SectionCard(
              title: entry.label,
              body: entry.content ?? (isStreaming ? 'Generating…' : '—'),
              icon: entry.icon,
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  List<_SectionEntry> _sectionEntries(DevotionSections s) {
    return [
      _SectionEntry('Key Scripture', s.keyScripture, Icons.menu_book_outlined),
      _SectionEntry('Historical Context', s.historicalContext, Icons.history_edu_outlined),
      _SectionEntry('Biblical Context', s.biblicalContext, Icons.account_balance_outlined),
      _SectionEntry('Verse Explanation', s.verseExplanation, Icons.info_outline),
      _SectionEntry('Theological Insights', s.theologicalInsights, Icons.lightbulb_outline),
      _SectionEntry('Spiritual Lessons', s.spiritualLessons, Icons.spa_outlined),
      _SectionEntry('Life Applications', s.lifeApplications, Icons.checklist_outlined),
      _SectionEntry('Reflection Questions', _bullets(s.reflectionQuestions), Icons.help_outline),
      _SectionEntry('Discussion Questions', _bullets(s.discussionQuestions), Icons.forum_outlined),
      _SectionEntry('Prayer', s.prayer, Icons.volunteer_activism_outlined),
      _SectionEntry('Action Steps', _bullets(s.actionSteps), Icons.flag_outlined),
      _SectionEntry('Memory Verse', s.memoryVerse, Icons.bookmark_outline),
      _SectionEntry('Related Scriptures', _bullets(s.relatedScriptures), Icons.link),
      _SectionEntry('Closing Encouragement', s.closingEncouragement, Icons.favorite_outline),
    ];
  }

  String? _bullets(List<String> items) => items.isEmpty ? null : items.map((item) => '• $item').join('\n');
}

class _SectionEntry {
  const _SectionEntry(this.label, this.content, this.icon);

  final String label;
  final String? content;
  final IconData icon;
}
