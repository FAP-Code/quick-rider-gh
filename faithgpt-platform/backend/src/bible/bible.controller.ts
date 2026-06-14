import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { BibleService } from './bible.service';
import { BibleBookDto, BibleVersionDto, VerseWithTextDto } from './dto/bible-response.dto';
import { BibleSearchQueryDto, ChapterQueryDto } from './dto/bible-search.dto';

/**
 * Bible content endpoints (api/openapi.yaml `Bible` tag). All routes are
 * @Public() — `security: []` in openapi.yaml, with GUEST read-only access
 * per docs/09 §5.4.
 */
@ApiTags('Bible')
@Public()
@Controller('bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @Get('versions')
  @ApiOperation({ summary: 'List available Bible versions' })
  @ApiResponse({ status: 200, type: [BibleVersionDto] })
  listVersions(): Promise<BibleVersionDto[]> {
    return this.bibleService.listVersions();
  }

  @Get('books')
  @ApiOperation({ summary: 'List the 66 canonical Bible books' })
  @ApiResponse({ status: 200, type: [BibleBookDto] })
  listBooks(): Promise<BibleBookDto[]> {
    return this.bibleService.listBooks();
  }

  @Get('books/:bookId/chapters/:chapter')
  @ApiOperation({ summary: 'Get all verses for a chapter in a given version' })
  @ApiResponse({ status: 200, type: [VerseWithTextDto] })
  getChapter(
    @Param('bookId') bookId: string,
    @Param('chapter', ParseIntPipe) chapter: number,
    @Query() query: ChapterQueryDto,
  ): Promise<VerseWithTextDto[]> {
    return this.bibleService.getChapter(bookId, chapter, query.version);
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search across Bible text (by version)' })
  @ApiResponse({ status: 200, type: [VerseWithTextDto] })
  search(@Query() query: BibleSearchQueryDto) {
    return this.bibleService.search(query.q, query.version, query);
  }
}
