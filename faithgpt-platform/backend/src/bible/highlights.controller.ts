import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { BibleInteractionsService } from './bible-interactions.service';
import { CreateHighlightDto, HighlightDto } from './dto/highlight.dto';

@ApiTags('Bible Interactions')
@Controller('highlights')
export class HighlightsController {
  constructor(private readonly service: BibleInteractionsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's highlights" })
  @ApiResponse({ status: 200, type: [HighlightDto] })
  list(@CurrentUser() user: AuthenticatedUser, @Query() pagination: CursorPaginationDto) {
    return this.service.listHighlights(user.userId, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Highlight a verse' })
  @ApiResponse({ status: 201, type: HighlightDto })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHighlightDto) {
    return this.service.createHighlight(user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a highlight' })
  @ApiResponse({ status: 204, description: 'Removed' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.service.removeHighlight(user.userId, id);
  }
}
