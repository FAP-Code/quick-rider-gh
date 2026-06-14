import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

/// Displays a Scripture verse (or passage) in the Fraunces display font.
class VerseCard extends StatelessWidget {
  const VerseCard({
    required this.reference,
    required this.text,
    this.versionCode = 'ESV',
    super.key,
  });

  final String reference;
  final String text;
  final String versionCode;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.cardRadius)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              text,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              '$reference ($versionCode)',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}
