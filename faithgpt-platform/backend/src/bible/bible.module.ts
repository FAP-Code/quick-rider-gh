import { Module } from '@nestjs/common';
import { BibleController } from './bible.controller';
import { BibleService } from './bible.service';
import { BibleInteractionsService } from './bible-interactions.service';
import { HighlightsController } from './highlights.controller';
import { NotesController } from './notes.controller';
import { BookmarksController } from './bookmarks.controller';

/**
 * BibleModule (docs/08-backend-architecture.md §2): Bible content
 * (versions/books/chapters/search) plus the user-interaction sub-resources
 * (highlights/notes/bookmarks). The Cross-Reference Engine / Scripture
 * Analysis Engine (cross_references, themes, scripture_analysis_cache) are
 * also conceptually part of this module but exposed via a dedicated
 * `/scripture-analysis` endpoint — kept as a stub on AiStudyModule's
 * neighbor surface in this scaffold for simplicity (see ai-study module).
 */
@Module({
  controllers: [BibleController, HighlightsController, NotesController, BookmarksController],
  providers: [BibleService, BibleInteractionsService],
  exports: [BibleService],
})
export class BibleModule {}
