import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { BibleInteractionsService } from './bible-interactions.service';
import { BookmarkDto, CreateBookmarkDto } from './dto/bookmark.dto';

@ApiTags('Bible Interactions')
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly service: BibleInteractionsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's bookmarks" })
  @ApiResponse({ status: 200, type: [BookmarkDto] })
  list(@CurrentUser() user: AuthenticatedUser, @Query() pagination: CursorPaginationDto) {
    return this.service.listBookmarks(user.userId, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Bookmark a verse' })
  @ApiResponse({ status: 201, type: BookmarkDto })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookmarkDto) {
    return this.service.createBookmark(user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a bookmark' })
  @ApiResponse({ status: 204, description: 'Removed' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.service.removeBookmark(user.userId, id);
  }
}
