import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RefreshTokenSummaryDto } from './dto/session.dto';

/**
 * UsersModule (docs/08-backend-architecture.md §2): authenticated user's
 * profile CRUD, preferences, sessions, account deletion, data export.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found.' });
    }
    return this.toUserResponse(user, user.subscription?.tier ?? SubscriptionTier.FREE);
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
        ...(dto.denominationLens !== undefined ? { denominationLens: dto.denominationLens } : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.defaultBibleVersionId !== undefined
          ? { defaultBibleVersionId: dto.defaultBibleVersionId }
          : {}),
      },
      include: { subscription: true },
    });
    return this.toUserResponse(user, user.subscription?.tier ?? SubscriptionTier.FREE);
  }

  /**
   * Soft-deletes the account (14-day recoverable per docs/12-security-framework.md
   * §5). Stub: marks the account inactive; a scheduled job would hard-delete
   * after 14 days via Prisma `onDelete: Cascade` relations.
   */
  async deleteMe(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }

  async listSessions(userId: string): Promise<RefreshTokenSummaryDto[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map((t) => ({
      id: t.id,
      deviceInfo: t.deviceInfo,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
      isCurrent: false,
    }));
  }

  async revokeSession(userId: string, id: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Queues a "Download My Data" export job (async, docs/12 §5). Stub: the
   * `users` BullMQ producer/processor is not wired up in this scaffold.
   */
  async requestExport(_userId: string): Promise<void> {
    // A full implementation enqueues a job that bundles all user-owned rows
    // and emails a signed S3 download link (24h expiry).
    return;
  }

  private toUserResponse(
    user: { id: string; email: string | null; phone: string | null; name: string; avatarUrl: string | null; role: any; denominationLens: string | null; locale: string; timezone: string; defaultBibleVersionId: string | null; emailVerifiedAt: boolean; isActive: boolean; createdAt: Date },
    tier: SubscriptionTier,
  ): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      tier,
      denominationLens: user.denominationLens,
      locale: user.locale,
      timezone: user.timezone,
      defaultBibleVersionId: user.defaultBibleVersionId,
      emailVerifiedAt: user.emailVerifiedAt,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
