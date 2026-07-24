'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Lock, Trophy } from 'lucide-react';

interface Badge {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

const ALL_BADGES: Badge[] = [
  { id: 'STREAK_3',       label: '3-Day Streak',   emoji: '🔥', desc: 'Delivered 3 days in a row' },
  { id: 'STREAK_7',       label: '7-Day Streak',   emoji: '⚡', desc: 'Delivered 7 days in a row' },
  { id: 'STREAK_30',      label: '30-Day Legend',  emoji: '👑', desc: 'Delivered 30 days in a row' },
  { id: 'DELIVERIES_10',  label: '10 Deliveries',  emoji: '📦', desc: 'Completed 10 deliveries' },
  { id: 'DELIVERIES_50',  label: '50 Deliveries',  emoji: '🏆', desc: 'Completed 50 deliveries' },
  { id: 'DELIVERIES_100', label: 'Century Rider',  emoji: '💯', desc: 'Completed 100 deliveries' },
  { id: 'DELIVERIES_500', label: 'Elite Courier',  emoji: '⭐', desc: 'Completed 500 deliveries' },
  { id: 'TOP_RATED',      label: 'Top Rated',      emoji: '⭐', desc: 'Maintained 4.8+ rating' },
  { id: 'FAST_RIDER',     label: 'Speed Demon',    emoji: '⚡', desc: 'Avg delivery under 20 min' },
  { id: 'VETERAN',        label: 'Veteran',        emoji: '🎖️', desc: 'Over 1 year on platform' },
];

// Milestone thresholds for progress bars
const DELIVERY_MILESTONES = [10, 50, 100, 500];
const STREAK_MILESTONES   = [3, 7, 30];

function nextMilestone(current: number, milestones: number[]) {
  return milestones.find((m) => m > current) ?? null;
}

export default function RiderGamificationPage() {
  const { data: gameData, isLoading } = useQuery<{ data: any }>({
    queryKey: ['rider-game-stats'],
    queryFn: () => api.get('/rider/game-stats'),
  });

  const g = gameData?.data ?? gameData ?? {};

  const earnedBadgeIds: string[] = g.badges ?? [];
  const currentStreak:  number   = g.currentStreak ?? 0;
  const longestStreak:  number   = g.longestStreak ?? 0;
  const totalDeliveries: number  = g.totalDeliveries ?? 0;
  const carbonSaved:    number   = g.carbonSaved ?? 0;
  const leaderboardRank: number  = g.leaderboardRank ?? 0;

  const nextDelivery = nextMilestone(totalDeliveries, DELIVERY_MILESTONES);
  const prevDelivery = DELIVERY_MILESTONES.filter((m) => m <= totalDeliveries).pop() ?? 0;

  const nextStreakMile = nextMilestone(currentStreak, STREAK_MILESTONES);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Achievements</h2>
        <p className="text-muted-foreground text-sm mt-1">Your milestones, badges, and standing</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Current Streak', value: currentStreak === 0 ? '—' : `${currentStreak} days`, suffix: '🔥', color: 'text-orange-500' },
          { label: 'Longest Streak', value: longestStreak === 0 ? '—' : `${longestStreak} days`, suffix: '📅', color: 'text-blue-500' },
          { label: 'Total Deliveries', value: totalDeliveries, suffix: '📦', color: 'text-green-600' },
          { label: 'CO₂ Saved',       value: `${carbonSaved.toFixed(1)} kg`, suffix: '🌱', color: 'text-green-500' },
        ].map(({ label, value, suffix, color }) => (
          <div key={label} className="bg-card border rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl mb-0.5">{suffix}</p>
            <p className={`text-xl font-bold ${color}`}>{isLoading ? '…' : value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard position */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
          <Trophy size={28} className="text-brand-gold" />
        </div>
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Weekly Leaderboard</p>
          {isLoading ? (
            <div className="h-6 bg-gray-700 rounded w-40 mt-1 animate-pulse" />
          ) : leaderboardRank > 0 ? (
            <>
              <p className="text-xl font-bold mt-0.5">You&apos;re ranked <span className="text-brand-gold">#{leaderboardRank}</span> this week</p>
              <p className="text-xs text-gray-400 mt-0.5">Keep delivering to climb higher!</p>
            </>
          ) : (
            <p className="text-lg font-bold mt-0.5 text-gray-300">Complete deliveries to appear on the leaderboard</p>
          )}
        </div>
      </div>

      {/* Progress toward next badges */}
      <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm">Progress</h3>

        {nextDelivery != null && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{totalDeliveries}/{nextDelivery} deliveries to next badge</span>
              <span>{Math.round(((totalDeliveries - prevDelivery) / (nextDelivery - prevDelivery)) * 100)}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((totalDeliveries - prevDelivery) / (nextDelivery - prevDelivery)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {nextStreakMile != null && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{currentStreak}/{nextStreakMile} days to streak badge</span>
              <span>{Math.round((currentStreak / nextStreakMile) * 100)}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (currentStreak / nextStreakMile) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {nextDelivery == null && nextStreakMile == null && (
          <p className="text-sm text-muted-foreground">All milestone badges earned! 🎉</p>
        )}
      </div>

      {/* Badge grid */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">All Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ALL_BADGES.map((badge) => {
            const earned = earnedBadgeIds.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`relative rounded-2xl border p-4 text-center shadow-sm transition-all ${
                  earned
                    ? 'bg-card border-brand-green-300 shadow-green-100'
                    : 'bg-muted/40 border-border opacity-60'
                }`}
              >
                {!earned && (
                  <div className="absolute top-2 right-2">
                    <Lock size={12} className="text-muted-foreground" />
                  </div>
                )}
                {earned && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 rounded-full bg-brand-green-500 flex items-center justify-center">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}
                <p className="text-3xl mb-1.5">{badge.emoji}</p>
                <p className={`text-xs font-bold leading-tight ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>{badge.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{badge.desc}</p>
                {earned && (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-brand-green-100 text-brand-green-700 text-[10px] font-bold uppercase">Earned</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
