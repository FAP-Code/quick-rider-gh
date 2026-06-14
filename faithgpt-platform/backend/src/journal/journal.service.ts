import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JournalEntry, PrayerRequest, PrayerRequestVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateJournalEntryDto,
  ListJournalEntriesQueryDto,
  UpdateJournalEntryDto,
} from './dto/journal-entry.dto';
import {
  AnswerPrayerRequestDto,
  CreatePrayerRequestDto,
  ListPrayerRequestsQueryDto,
} from './dto/prayer-request.dto';

/**
 * JournalModule (docs/08-backend-architecture.md §2): Spiritual Journal
 * entries and Prayer Requests (private/group/public visibility).
 */
@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------
  // Journal Entries
  // ---------------------------------------------------------------------

  async listEntries(userId: string, query: ListJournalEntriesQueryDto) {
    const limit = query.limit ?? 20;

    const rows = await this.prisma.journalEntry.findMany({
      where: { userId, ...(query.type ? { type: query.type } : {}) },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((entry) => this.toEntryDto(entry)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  async createEntry(userId: string, dto: CreateJournalEntryDto) {
    const entry = await this.prisma.journalEntry.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title ?? null,
        content: dto.content,
        tags: dto.tags ?? [],
        relatedDevotionId: dto.relatedDevotionId ?? null,
        relatedPrayerId: dto.relatedPrayerId ?? null,
      },
    });

    return this.toEntryDto(entry);
  }

  async findEntry(userId: string, id: string) {
    const entry = await this.getOwnedEntry(userId, id);
    return this.toEntryDto(entry);
  }

  async updateEntry(userId: string, id: string, dto: UpdateJournalEntryDto) {
    await this.getOwnedEntry(userId, id);

    const entry = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      },
    });

    return this.toEntryDto(entry);
  }

  async deleteEntry(userId: string, id: string): Promise<void> {
    await this.getOwnedEntry(userId, id);
    await this.prisma.journalEntry.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------
  // Prayer Requests
  // ---------------------------------------------------------------------

  /**
   * Lists prayer requests visible to the user: their own requests, plus
   * GROUP requests for groups they belong to and PUBLIC requests, filtered
   * by `visibility` if provided.
   */
  async listPrayerRequests(userId: string, query: ListPrayerRequestsQueryDto) {
    const limit = query.limit ?? 20;

    const membershipGroupIds = await this.prisma.groupMembership
      .findMany({ where: { userId }, select: { groupId: true } })
      .then((rows) => rows.map((r) => r.groupId));

    const visibilityFilter = query.visibility
      ? { visibility: query.visibility }
      : {
          OR: [
            { userId },
            { visibility: PrayerRequestVisibility.PUBLIC },
            ...(membershipGroupIds.length > 0
              ? [{ visibility: PrayerRequestVisibility.GROUP, groupId: { in: membershipGroupIds } }]
              : []),
          ],
        };

    const where = query.visibility ? { AND: [{ userId }, visibilityFilter] } : visibilityFilter;

    const rows = await this.prisma.prayerRequest.findMany({
      where,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page.map((req) => this.toPrayerRequestDto(req)),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }

  async createPrayerRequest(userId: string, dto: CreatePrayerRequestDto) {
    const request = await this.prisma.prayerRequest.create({
      data: {
        userId,
        content: dto.content,
        isAnonymous: dto.isAnonymous ?? false,
        visibility: dto.visibility ?? PrayerRequestVisibility.PRIVATE,
        groupId: dto.groupId ?? null,
      },
    });

    return this.toPrayerRequestDto(request);
  }

  async answerPrayerRequest(userId: string, id: string, dto: AnswerPrayerRequestDto) {
    const request = await this.prisma.prayerRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prayer request not found.' });
    }
    if (request.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only mark your own prayer requests as answered.',
      });
    }

    const updated = await this.prisma.prayerRequest.update({
      where: { id },
      data: {
        isAnswered: true,
        answeredNote: dto.answeredNote ?? null,
        answeredAt: new Date(),
      },
    });

    return this.toPrayerRequestDto(updated);
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private async getOwnedEntry(userId: string, id: string): Promise<JournalEntry> {
    const entry = await this.prisma.journalEntry.findFirst({ where: { id, userId } });
    if (!entry) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Journal entry not found.' });
    }
    return entry;
  }

  private toEntryDto(entry: JournalEntry) {
    return {
      id: entry.id,
      type: entry.type,
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      relatedDevotionId: entry.relatedDevotionId,
      relatedPrayerId: entry.relatedPrayerId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private toPrayerRequestDto(request: PrayerRequest) {
    return {
      id: request.id,
      content: request.content,
      isAnonymous: request.isAnonymous,
      isAnswered: request.isAnswered,
      answeredNote: request.answeredNote,
      answeredAt: request.answeredAt,
      visibility: request.visibility,
      groupId: request.groupId,
      createdAt: request.createdAt,
    };
  }
}
