import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'home_provider.g.dart';

/// Placeholder dashboard state — see docs/02-information-architecture.md §1.1.
class HomeDashboardState {
  const HomeDashboardState({this.streakDays = 0, this.hasTodaysDevotion = false});

  final int streakDays;
  final bool hasTodaysDevotion;
}

@riverpod
class HomeDashboard extends _$HomeDashboard {
  @override
  Future<HomeDashboardState> build() async {
    return const HomeDashboardState();
  }
}
