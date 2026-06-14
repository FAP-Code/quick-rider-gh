import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Shared placeholder for STUB features (docs/14-flutter-project-structure.md
/// §2) — establishes the screen's import path for `app_router.dart` ahead
/// of full implementation.
class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({required this.title, super.key});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.auto_awesome, size: 40, color: AppColors.accent),
            const SizedBox(height: 12),
            Text('Coming soon', style: Theme.of(context).textTheme.titleMedium),
          ],
        ),
      ),
    );
  }
}
