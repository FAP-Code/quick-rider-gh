import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationPreferencesDto, UpdateNotificationPreferencesDto } from './dto/notification.dto';

/**
 * Default notification preferences (api/openapi.yaml `/notifications/preferences`
 * example). Transactional types (SUBSCRIPTION, SYSTEM) are always-on per the
 * spec and rejected if a caller attempts to disable them.
 */
const DEFAULT_PREFERENCES: NotificationPreferencesDto = {
  DAILY_DEVOTION: true,
  STREAK_REMINDER: true,
  PRAYER_ANSWERED: true,
  GROUP_ACTIVITY: true,
  COMMUNITY_INTERACTION: false,
  SUBSCRIPTION: true,
  SYSTEM: true,
};

/** NotificationType values that are always-on and non-editable per the spec. */
const NON_EDITABLE_TYPES: Array<keyof NotificationPreferencesDto> = ['SUBSCRIPTION', 'SYSTEM'];

/**
 * NotificationsModule (docs/08-backend-architecture.md §2): in-app
 * notification feed + per-type preferences.
 *
 * Stub: preferences are not persisted — `schema.prisma` has no
 * NotificationPreference table/column, so `getPreferences`/`updatePreferences`
 * operate on an in-memory default. A full implementation would add a
 * `notificationPreferences Json` column to `User` (or a dedicated table) and
 * read/write it here.
 */
@Injectable()
export class NotificationsService {
  private readonly preferencesByUser = new Map<string, NotificationPreferencesDto>();

  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, limit: number, cursor?: string) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((n) => this.toResponse(n)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  async markRead(userId: string, id: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Notification not found.' });
    }

    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  getPreferences(userId: string): NotificationPreferencesDto {
    return this.preferencesByUser.get(userId) ?? { ...DEFAULT_PREFERENCES };
  }

  updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto): NotificationPreferencesDto {
    const current = this.getPreferences(userId);
    const updated: NotificationPreferencesDto = { ...current };

    for (const [key, value] of Object.entries(dto) as Array<[keyof NotificationPreferencesDto, boolean | undefined]>) {
      if (value === undefined) continue;
      if (NON_EDITABLE_TYPES.includes(key)) continue; // transactional types: always-on
      updated[key] = value;
    }

    this.preferencesByUser.set(userId, updated);
    return updated;
  }

  private toResponse(notification: Notification) {
    const data = notification.data as { deepLink?: string } | null;
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      deepLink: data?.deepLink ?? null,
      readAt: notification.isRead ? notification.createdAt : null,
      createdAt: notification.createdAt,
    };
  }
}
