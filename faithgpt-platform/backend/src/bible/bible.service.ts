import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BibleBookDto, BibleVersionDto, VerseWithTextDto } from './dto/bible-response.dto';
import { CursorPaginationDto } from '../common/dto/pagination.dto';

/**
 * BibleModule's core Bible content service (docs/08-backend-architecture.md §2):
 * version/book/chapter retrieval and full-text search over
 * BibleVersion/BibleBook/BibleVerse/VerseText. All routes here are @Public()
 * per api/openapi.yaml (GUEST read-only access, docs/09 §5.4).
 */
@Injectable()
export class BibleService {
  constructor(private readonly prisma: PrismaService) {}

  async listVersions(): Promise<BibleVersionDto[]> {
    const versions = await this.prisma.bibleVersion.findMany({ orderBy: { code: 'asc' } });
    return versions.map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name,
      language: v.language,
      license: v.license,
      isOfflineBundled: v.isOfflineBundled,
      publisher: v.publisher,
    }));
  }

  async listBooks(): Promise<BibleBookDto[]> {
    const books = await this.prisma.bibleBook.findMany({ orderBy: { orderIndex: 'asc' } });
    return books.map((b) => ({
      id: b.id,
      name: b.name,
      abbreviation: b.abbreviation,
      testament: b.testament,
      orderIndex: b.orderIndex,
      chapterCount: b.chapterCount,
    }));
  }

  async getChapter(bookId: string, chapter: number, versionCode = 'KJV'): Promise<VerseWithTextDto[]> {
    const book = await this.prisma.bibleBook.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Bible book not found.' });
    }

    const version = await this.prisma.bibleVersion.findUnique({ where: { code: versionCode } });
    if (!version) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Bible version '${versionCode}' not found.` });
    }

    const verses = await this.prisma.bibleVerse.findMany({
      where: { bookId, chapter },
      orderBy: { verse: 'asc' },
      include: {
        texts: { where: { versionId: version.id } },
      },
    });

    if (verses.length === 0) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `No verses found for ${book.name} ${chapter}.`,
      });
    }

    return verses.map((v) => ({
      id: v.id,
      bookId: v.bookId,
      chapter: v.chapter,
      verse: v.verse,
      reference: `${book.name} ${v.chapter}:${v.verse}`,
      text: v.texts[0]?.text ?? '',
      versionCode: version.code,
    }));
  }

  /**
   * Full-text search across VerseText (docs/09 §4.1 cursor pagination).
   * Uses Prisma's `fullTextSearchPostgres` preview feature (schema.prisma generator block).
   */
  async search(
    query: string,
    versionCode = 'KJV',
    pagination: CursorPaginationDto,
  ): Promise<{ data: VerseWithTextDto[]; meta: { pagination: { nextCursor: string | null; hasMore: boolean } } }> {
    const version = await this.prisma.bibleVersion.findUnique({ where: { code: versionCode } });
    if (!version) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `Bible version '${versionCode}' not found.` });
    }

    const limit = pagination.limit ?? 20;

    const texts = await this.prisma.verseText.findMany({
      where: {
        versionId: version.id,
        text: { search: query.trim().split(/\s+/).join(' & ') },
      },
      take: limit + 1,
      ...(pagination.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
      include: { verse: { include: { book: true } } },
    });

    const hasMore = texts.length > limit;
    const page = hasMore ? texts.slice(0, limit) : texts;

    return {
      data: page.map((t) => ({
        id: t.verse.id,
        bookId: t.verse.bookId,
        chapter: t.verse.chapter,
        verse: t.verse.verse,
        reference: `${t.verse.book.name} ${t.verse.chapter}:${t.verse.verse}`,
        text: t.text,
        versionCode: version.code,
      })),
      meta: {
        pagination: {
          nextCursor: hasMore ? page[page.length - 1].id : null,
          hasMore,
        },
      },
    };
  }
}
