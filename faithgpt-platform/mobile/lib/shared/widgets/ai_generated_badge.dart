import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// "AI-Generated Insight" badge — required on all AI commentary (PRD §8).
class AiGeneratedBadge extends StatelessWidget {
  const AiGeneratedBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.accentSoft,
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.auto_awesome, size: 14, color: AppColors.primaryDark),
          SizedBox(width: 4),
          Text(
            'AI-Generated Insight',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryDark),
          ),
        ],
      ),
    );
  }
}
