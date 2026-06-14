import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TierGuard } from './common/guards/tier.guard';

import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { AiGatewayModule } from './ai-gateway/ai-gateway.module';
import { AiStudyModule } from './ai-study/ai-study.module';
import { AuthModule } from './auth/auth.module';
import { BibleModule } from './bible/bible.module';
import { CommunityModule } from './community/community.module';
import { DevotionsModule } from './devotions/devotions.module';
import { GrowthModule } from './growth/growth.module';
import { JournalModule } from './journal/journal.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PrayersModule } from './prayers/prayers.module';
import { ReadingPlansModule } from './reading-plans/reading-plans.module';
import { SermonsModule } from './sermons/sermons.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UsersModule } from './users/users.module';
import { VisualStudioModule } from './visual-studio/visual-studio.module';

/**
 * Root module (docs/08-backend-architecture.md §1-2). Wires up:
 *
 * - `ConfigModule` (global) so every module's `ConfigService` injection
 *   (AuthModule's JwtModule, JwtStrategy, AiGatewayService, ...) resolves
 *   against `process.env` / `.env`.
 * - `nestjs-pino` `LoggerModule`, consumed by `app.useLogger()` in main.ts.
 * - `ThrottlerModule`, global per-IP rate limiting (docs/12-security-framework.md
 *   §"@nestjs/throttler global limits"); per-route AI-generation overrides are
 *   applied with `@Throttle()` on individual handlers.
 * - `PrismaModule` (also `@Global()`, imported here once for the module graph).
 * - `HealthModule`, the `/health` liveness probe excluded from the `api/v1`
 *   prefix and from auth (main.ts, common/decorators/public.decorator.ts).
 * - The three global guards backing the `@Public()` / `@Roles()` /
 *   `@TierRequired()` decorators (docs/10-authentication-system.md §5,
 *   docs/11-subscription-system.md §2). Order matters: JwtAuthGuard runs
 *   first to populate `request.user`, then RolesGuard and TierGuard read it.
 * - Every feature module (docs/08 §2).
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: ['req.headers.authorization'],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AdminModule,
    AiGatewayModule,
    AiStudyModule,
    AuthModule,
    BibleModule,
    CommunityModule,
    DevotionsModule,
    GrowthModule,
    JournalModule,
    NotificationsModule,
    OrganizationsModule,
    PrayersModule,
    ReadingPlansModule,
    SermonsModule,
    SubscriptionsModule,
    UsersModule,
    VisualStudioModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: TierGuard },
  ],
})
export class AppModule {}
