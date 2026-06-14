import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/onboarding_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/bible/presentation/screens/bible_reader_screen.dart';
import '../../features/devotions/presentation/screens/devotion_setup_screen.dart';
import '../../features/devotions/presentation/screens/devotion_result_screen.dart';
import '../../features/visual_studio/image_generator/presentation/screens/image_generator_screen.dart';
import '../../features/community/presentation/screens/community_screen.dart';
import '../../features/journal/presentation/screens/journal_screen.dart';
import '../../features/account/presentation/screens/account_screen.dart';
import '../../features/account/presentation/screens/paywall_screen.dart';
import '../../shared/widgets/scaffold_with_nav_bar.dart';

const _authRoutes = {'/onboarding', '/login', '/signup'};

/// go_router config — StatefulShellRoute implements the 5 bottom-tab
/// branches from docs/02-information-architecture.md §1, plus the
/// unauthenticated onboarding/login/signup flow (§3 Login & Signup).
///
/// NOTE: this Provider rebuilds the whole [GoRouter] when [authProvider]
/// changes, which is sufficient for a scaffold; a production app should
/// instead drive `refreshListenable` from auth-state changes so the
/// navigation stack survives token refreshes.
final goRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/home',
    redirect: (context, state) {
      if (authState.isLoading) return null;

      final isAuthenticated = authState.value?.isAuthenticated ?? false;
      final isAuthRoute = _authRoutes.contains(state.matchedLocation);

      if (!isAuthenticated && !isAuthRoute) return '/onboarding';
      if (isAuthenticated && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/bible',
                builder: (context, state) => const BibleReaderScreen(),
                routes: [
                  GoRoute(
                    path: 'reader/:bookId/:chapter',
                    name: 'bibleReader',
                    builder: (context, state) => BibleReaderScreen(
                      bookId: state.pathParameters['bookId'],
                      chapter: int.tryParse(state.pathParameters['chapter'] ?? ''),
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/studio',
                builder: (context, state) => const DevotionSetupScreen(),
                routes: [
                  GoRoute(
                    path: 'devotion/setup',
                    name: 'devotionSetup',
                    builder: (context, state) => const DevotionSetupScreen(),
                  ),
                  GoRoute(
                    path: 'devotion/result/:devotionId',
                    name: 'devotionResult',
                    builder: (context, state) => DevotionResultScreen(
                      devotionId: state.pathParameters['devotionId']!,
                    ),
                  ),
                  GoRoute(
                    path: 'image-generator',
                    name: 'imageGenerator',
                    builder: (context, state) => const ImageGeneratorScreen(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/community',
                builder: (context, state) => const CommunityScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/journal',
                builder: (context, state) => const JournalScreen(),
              ),
            ],
          ),
        ],
      ),
      // Modal / pushed routes
      GoRoute(
        path: '/account',
        name: 'account',
        builder: (context, state) => const AccountScreen(),
      ),
      GoRoute(
        path: '/paywall',
        name: 'paywall',
        pageBuilder: (context, state) => const MaterialPage(
          fullscreenDialog: true,
          child: PaywallScreen(),
        ),
      ),
    ],
  );
});
