import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { CreateHighlightDto } from './dto/highlight.dto';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { CreateBookmarkDto } from './dto/bookmark.dto';

/**
 * BibleModule sub-resources: highlights, notes, bookmarks (thin per-user CRUD
 * over BibleVerse — docs/08-backend-architecture.md §2 "User Bible Interaction").
 */
@Injectable()
export class BibleInteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Highlights ---------------------------------------------------------

  async listHighlights(userId: string, pagination: CursorPaginationDto) {
    return this.cursorPage('highlight', { userId }, pagination);
  }

  async createHighlight(userId: string, dto: CreateHighlightDto) {
    return this.prisma.highlight.upsert({
      where: { userId_verseId: { userId, verseId: dto.verseId } },
      create: { userId, verseId: dto.verseId, color: dto.color ?? 'yellow' },
      update: { color: dto.color ?? 'yellow' },
    });
  }

  async removeHighlight(userId: string, id: string): Promise<void> {
    await this.prisma.highlight.deleteMany({ where: { id, userId } });
  }

  // --- Notes ---------------------------------------------------------------

  async listNotes(userId: string, pagination: CursorPaginationDto) {
    return this.cursorPage('note', { userId }, pagination);
  }

  async createNote(userId: string, dto: CreateNoteDto) {
    return this.prisma.note.create({
      data: { userId, verseId: dto.verseId, content: dto.content },
    });
  }

  async updateNote(userId: string, id: string, dto: UpdateNoteDto) {
    return this.prisma.note.update({
      where: { id },
      data: { content: dto.content },
    });
  }

  async deleteNote(userId: string, id: string): Promise<void> {
    await this.prisma.note.deleteMany({ where: { id, userId } });
  }

  // --- Bookmarks -------------------------------------------------------------

  async listBookmarks(userId: string, pagination: CursorPaginationDto) {
    return this.cursorPage('bookmark', { userId }, pagination);
  }

  async createBookmark(userId: string, dto: CreateBookmarkDto) {
    return this.prisma.bookmark.upsert({
      where: { userId_verseId: { userId, verseId: dto.verseId } },
      create: { userId, verseId: dto.verseId },
      update: {},
    });
  }

  async removeBookmark(userId: string, id: string): Promise<void> {
    await this.prisma.bookmark.deleteMany({ where: { id, userId } });
  }

  // --- Shared cursor pagination helper -------------------------------------

  private async cursorPage(
    model: 'highlight' | 'note' | 'bookmark',
    where: Record<string, unknown>,
    pagination: CursorPaginationDto,
  ) {
    const limit = pagination.limit ?? 20;
    const delegate = this.prisma[model] as any;

    const rows = await delegate.findMany({
      where,
      take: limit + 1,
      ...(pagination.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      data: page,
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }
}
