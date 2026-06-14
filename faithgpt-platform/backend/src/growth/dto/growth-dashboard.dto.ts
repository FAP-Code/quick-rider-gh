import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StreakType } from '@prisma/client';

export class StreakSummaryDto {
  @ApiProperty({ enum: StreakType })
  type!: StreakType;

  @ApiProperty()
  currentStreak!: number;

  @ApiProperty()
  longestStreak!: number;

  @ApiProperty({ type: String, format: 'date' })
  lastActivityDate!: Date | null;
}

export class GrowthStatsDto {
  @ApiProperty()
  chaptersRead!: number;

  @ApiProperty()
  booksCompleted!: number;

  @ApiProperty()
  devotionsGenerated!: number;

  @ApiProperty()
  memoryVersesSaved!: number;

  @ApiProperty()
  studyMinutes!: number;

  @ApiProperty()
  prayersGenerated!: number;
}

export class AchievementProgressDto {
  @ApiProperty()
  current!: number;

  @ApiProperty()
  target!: number;
}

/** AchievementWithProgress (api/openapi.yaml `AchievementWithProgress` schema). */
export class AchievementWithProgressDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  iconUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  unlockedAt!: Date | null;

  @ApiPropertyOptional({ type: AchievementProgressDto, nullable: true })
  progress!: AchievementProgressDto | null;
}

/** GrowthDashboard (api/openapi.yaml `GrowthDashboard` schema). */
export class GrowthDashboardDto {
  @ApiProperty({ type: [StreakSummaryDto] })
  streaks!: StreakSummaryDto[];

  @ApiProperty({ type: GrowthStatsDto })
  stats!: GrowthStatsDto;

  @ApiProperty({ type: [AchievementWithProgressDto] })
  recentAchievements!: AchievementWithProgressDto[];
}
