import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Centered loading spinner used across async screens.
class LoadingIndicator extends StatelessWidget {
  const LoadingIndicator({this.label, super.key});

  final String? label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          if (label != null) ...[
            const SizedBox(height: 12),
            Text(label!),
          ],
        ],
      ),
    );
  }
}
