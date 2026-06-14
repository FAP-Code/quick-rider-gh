import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/primary_button.dart';

/// `PaywallSheet` (docs/15-ui-ux-specifications.md §5.1, docs/16-screen-designs.md
/// §16) — surfaced as a full-screen modal route (`/paywall`) when a
/// quota-exceeded or feature-gated action is hit (docs/11 §2 entitlements).
class PaywallScreen extends StatelessWidget {
  const PaywallScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(icon: const Icon(Icons.close), onPressed: () => context.pop()),
              ),
              const Icon(Icons.workspace_premium, color: AppColors.accent, size: 48),
              const SizedBox(height: 12),
              Text(
                'Unlock with Premium',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Upgrade for unlimited devotions and AI Study, plus Sermon Studio and unlimited image generation.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              const Expanded(child: _TierComparisonTable()),
              PrimaryButton(label: 'Upgrade to Premium', onPressed: () => context.pop()),
              const SizedBox(height: 8),
              OutlinedButton(onPressed: () => context.pop(), child: const Text('Not now')),
            ],
          ),
        ),
      ),
    );
  }
}

/// Subset of the §11 §2 feature-gating matrix relevant to common paywall
/// triggers (AI Study quota, deep devotions, Sermon Studio, images).
class _TierComparisonTable extends StatelessWidget {
  const _TierComparisonTable();

  static const _rows = <(String, String, String, String)>[
    ('Daily AI Study questions', '5/day', 'Unlimited', 'Unlimited'),
    ('Deep devotions', '3/month', 'Unlimited', 'Unlimited'),
    ('Sermon Studio', '—', '—', '✓'),
    ('Image generations', '—', '10/month', 'Unlimited'),
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Table(
        border: TableBorder.all(color: AppColors.primary.withOpacity(0.1)),
        columnWidths: const {
          0: FlexColumnWidth(2),
          1: FlexColumnWidth(1),
          2: FlexColumnWidth(1),
          3: FlexColumnWidth(1),
        },
        children: [
          const TableRow(
            decoration: BoxDecoration(color: AppColors.accentSoft),
            children: [
              Padding(padding: EdgeInsets.all(8), child: Text('Capability', style: TextStyle(fontWeight: FontWeight.bold))),
              Padding(padding: EdgeInsets.all(8), child: Text('Free', style: TextStyle(fontWeight: FontWeight.bold))),
              Padding(padding: EdgeInsets.all(8), child: Text('Plus', style: TextStyle(fontWeight: FontWeight.bold))),
              Padding(padding: EdgeInsets.all(8), child: Text('Premium', style: TextStyle(fontWeight: FontWeight.bold))),
            ],
          ),
          for (final row in _rows)
            TableRow(children: [
              Padding(padding: const EdgeInsets.all(8), child: Text(row.$1)),
              Padding(padding: const EdgeInsets.all(8), child: Text(row.$2)),
              Padding(padding: const EdgeInsets.all(8), child: Text(row.$3)),
              Padding(padding: const EdgeInsets.all(8), child: Text(row.$4)),
            ]),
        ],
      ),
    );
  }
}
