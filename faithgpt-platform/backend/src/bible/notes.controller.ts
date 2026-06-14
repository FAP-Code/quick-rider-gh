import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { BibleInteractionsService } from './bible-interactions.service';
import { CreateNoteDto, NoteDto, UpdateNoteDto } from './dto/note.dto';

@ApiTags('Bible Interactions')
@Controller('notes')
export class NotesController {
  constructor(private readonly service: BibleInteractionsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's verse notes" })
  @ApiResponse({ status: 200, type: [NoteDto] })
  list(@CurrentUser() user: AuthenticatedUser, @Query() pagination: CursorPaginationDto) {
    return this.service.listNotes(user.userId, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Create a note on a verse' })
  @ApiResponse({ status: 201, type: NoteDto })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateNoteDto) {
    return this.service.createNote(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({ status: 200, type: NoteDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.service.updateNote(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.service.deleteNote(user.userId, id);
  }
}
