import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../data/models/devotion_model.dart';
import '../providers/devotion_provider.dart';

const _themeOptions = [
  'faith',
  'hope',
  'love',
  'grace',
  'forgiveness',
  'perseverance',
  'gratitude',
  'identity in Christ',
];

/// Devotion Setup Wizard (docs/02 §1.3, docs/16-screen-designs.md §5) —
/// 4 steps: passage → themes → type → depth, per the `WizardStepper`
/// component (docs/15 §5.2).
class DevotionSetupScreen extends ConsumerStatefulWidget {
  const DevotionSetupScreen({super.key});

  @override
  ConsumerState<DevotionSetupScreen> createState() => _DevotionSetupScreenState();
}

class _DevotionSetupScreenState extends ConsumerState<DevotionSetupScreen> {
  static const _stepTitles = ['Passage', 'Themes', 'Type', 'Depth'];

  int _step = 0;
  final _passageController = TextEditingController(text: 'ROM.8.28-39');
  final Set<String> _selectedThemes = {};
  DevotionType _type = DevotionType.personal;
  DevotionDepth _depth = DevotionDepth.standard;

  @override
  void dispose() {
    _passageController.dispose();
    super.dispose();
  }

  void _next() {
    if (_step < _stepTitles.length - 1) {
      setState(() => _step++);
    } else {
      _generate();
    }
  }

  void _back() {
    if (_step > 0) setState(() => _step--);
  }

  void _generate() {
    final request = GenerateDevotionRequest(
      passageKey: _passageController.text.trim(),
      type: _type,
      depth: _depth,
      themes: _selectedThemes.toList(),
    );
    unawaited(ref.read(devotionGenerationProvider.notifier).generate(request));
    context.goNamed('devotionResult', pathParameters: const {'devotionId': 'generating'});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Generate a Devotion')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildStepper(context),
            const SizedBox(height: 24),
            Expanded(child: _buildStep(context)),
            const SizedBox(height: 16),
            Row(
              children: [
                if (_step > 0) ...[
                  Expanded(child: OutlinedButton(onPressed: _back, child: const Text('Back'))),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: PrimaryButton(
                    label: _step == _stepTitles.length - 1 ? 'Generate' : 'Next',
                    onPressed: _next,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepper(BuildContext context) {
    return Row(
      children: List.generate(_stepTitles.length, (index) {
        final isActive = index == _step;
        final isComplete = index < _step;
        final color = isComplete ? AppColors.success : (isActive ? AppColors.primary : Colors.grey.shade300);
        return Expanded(
          child: Column(
            children: [
              CircleAvatar(
                radius: 14,
                backgroundColor: color,
                child: Text('${index + 1}', style: const TextStyle(color: Colors.white, fontSize: 12)),
              ),
              const SizedBox(height: 4),
              Text(_stepTitles[index], style: Theme.of(context).textTheme.labelSmall),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildStep(BuildContext context) {
    switch (_step) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Which passage?', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            TextField(
              controller: _passageController,
              decoration: const InputDecoration(
                labelText: 'Passage key',
                hintText: 'e.g. ROM.8.28-39',
              ),
            ),
          ],
        );
      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pick a few themes (optional)', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _themeOptions.map((theme) {
                final selected = _selectedThemes.contains(theme);
                return FilterChip(
                  label: Text(theme),
                  selected: selected,
                  selectedColor: AppColors.accentSoft,
                  onSelected: (value) => setState(() {
                    if (value) {
                      _selectedThemes.add(theme);
                    } else {
                      _selectedThemes.remove(theme);
                    }
                  }),
                );
              }).toList(),
            ),
          ],
        );
      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Devotion type', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 2.6,
                children: DevotionType.values.map((type) {
                  final selected = type == _type;
                  return ChoiceChip(
                    label: Text(_label(type.name)),
                    selected: selected,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(color: selected ? Colors.white : null),
                    onSelected: (_) => setState(() => _type = type),
                  );
                }).toList(),
              ),
            ),
          ],
        );
      case 3:
      default:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Depth', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: DevotionDepth.values.map((depth) {
                final selected = depth == _depth;
                return ChoiceChip(
                  label: Text(_label(depth.name)),
                  selected: selected,
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(color: selected ? Colors.white : null),
                  onSelected: (_) => setState(() => _depth = depth),
                );
              }).toList(),
            ),
          ],
        );
    }
  }

  /// "sabbathSchool" -> "Sabbath School".
  String _label(String enumName) {
    final withSpaces = enumName.replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m[1]}');
    return withSpaces[0].toUpperCase() + withSpaces.substring(1);
  }
}
