import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AchievementProgressDto,
  AchievementWithProgressDto,
  GrowthDashboardDto,
  GrowthStatsDto,
} from './dto/growth-dashboard.dto';

/**
 * GrowthModule — Spiritual Growth Dashboard™ (docs/08-backend-architecture.md
 * §2): streaks (UserStreak), spiritual stats (SpiritualStat), and achievement
 * unlock/progress (Achievement / UserAchievement).
 */
@Injectable()
export class GrowthService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string): Promise<GrowthDashboardDto> {
    const [streaks, stats, recentAchievements] = await Promise.all([
      this.prisma.userStreak.findMany({ where: { userId } }),
      this.prisma.spiritualStat.findUnique({ where: { userId } }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { earnedAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      streaks: streaks.map((streak) => ({
        type: streak.type,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityDate: streak.lastActivityDate,
      })),
      stats: this.toStatsDto(stats),
      recentAchievements: recentAchievements.map((ua) => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        iconUrl: ua.achievement.iconUrl,
        unlockedAt: ua.earnedAt,
        progress: null,
      })),
    };
  }

  /**
   * Lists all achievements with the user's unlock status. Stub: `progress`
   * is always `null` — a full implementation would evaluate each
   * Achievement.criteria against the user's current stats/streaks to compute
   * {current, target} for not-yet-unlocked achievements.
   */
  async listAchievements(userId: string): Promise<AchievementWithProgressDto[]> {
    const [achievements, userAchievements] = await Promise.all([
      this.prisma.achievement.findMany(),
      this.prisma.userAchievement.findMany({ where: { userId } }),
    ]);

    const unlockedByAchievementId = new Map(userAchievements.map((ua) => [ua.achievementId, ua.earnedAt]));

    return achievements.map((achievement) => {
      const progress: AchievementProgressDto | null = null;
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
        unlockedAt: unlockedByAchievementId.get(achievement.id) ?? null,
        progress,
      };
    });
  }

  private toStatsDto(stats: { totalChaptersRead: number; totalBooksCompleted: number; totalDevotions: number; totalMemoryVerses: number; totalStudyMinutes: number } | null): GrowthStatsDto {
    return {
      chaptersRead: stats?.totalChaptersRead ?? 0,
      booksCompleted: stats?.totalBooksCompleted ?? 0,
      devotionsGenerated: stats?.totalDevotions ?? 0,
      memoryVersesSaved: stats?.totalMemoryVerses ?? 0,
      studyMinutes: stats?.totalStudyMinutes ?? 0,
      // SpiritualStat tracks totalPrayerMinutes, not a prayer-generation count;
      // a full implementation would count Prayer rows for this user instead.
      prayersGenerated: 0,
    };
  }
}
