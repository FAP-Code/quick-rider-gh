import 'package:flutter/material.dart';

/// Design tokens — see /docs/00-shared-reference.md §2.
class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF1B3A6B); // Royal Blue
  static const Color primaryDark = Color(0xFF0F2748);
  static const Color accent = Color(0xFFD4AF37); // Gold
  static const Color accentSoft = Color(0xFFF2E2A8);

  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF0B1220);

  static const Color textPrimaryLight = Color(0xFF101828);
  static const Color textPrimaryDark = Color(0xFFF5F5F4);

  static const Color success = Color(0xFF1E8E5A);
  static const Color warning = Color(0xFFC77B14);
  static const Color error = Color(0xFFC0392B);
}
