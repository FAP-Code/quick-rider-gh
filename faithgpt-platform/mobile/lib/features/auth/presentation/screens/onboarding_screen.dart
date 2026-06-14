import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';

/// Locally-held denomination lens selection, applied to the user's profile
/// after signup (docs/00-shared-reference.md `denominationLens`, e.g.
/// "SDA"/"CATHOLIC"/"BAPTIST"/"NEUTRAL").
final selectedDenominationLensProvider = StateProvider<String>((ref) => 'NEUTRAL');

const _denominationOptions = <String, String>{
  'NEUTRAL': 'No preference',
  'SDA': 'Seventh-day Adventist',
  'CATHOLIC': 'Catholic',
  'BAPTIST': 'Baptist',
  'METHODIST': 'Methodist',
  'PENTECOSTAL': 'Pentecostal',
  'PRESBYTERIAN': 'Presbyterian',
  'OTHER': 'Other / Non-denominational',
};

/// Screen 1 — Welcome & Denomination Lens (docs/16-screen-designs.md §1).
class OnboardingScreen extends ConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(selectedDenominationLensProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 32),
              Text(AppConstants.appName, style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 8),
              Text(AppConstants.tagline, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 40),
              Text('Choose your denomination lens', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(
                'FaithGPT tailors devotions and Bible study to your tradition. '
                'You can change this anytime in Account settings.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              Expanded(
                child: Align(
                  alignment: Alignment.topLeft,
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _denominationOptions.entries.map((entry) {
                      final isSelected = entry.key == selected;
                      return ChoiceChip(
                        label: Text(entry.value),
                        selected: isSelected,
                        selectedColor: AppColors.primary,
                        labelStyle: TextStyle(color: isSelected ? Colors.white : null),
                        onSelected: (_) =>
                            ref.read(selectedDenominationLensProvider.notifier).state = entry.key,
                      );
                    }).toList(),
                  ),
                ),
              ),
              PrimaryButton(label: 'Continue', onPressed: () => context.go('/signup')),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('Already have an account? Log in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
