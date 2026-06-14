import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JournalService } from './journal.service';
import {
  CreateJournalEntryDto,
  JournalEntryDto,
  ListJournalEntriesQueryDto,
  UpdateJournalEntryDto,
} from './dto/journal-entry.dto';
import {
  AnswerPrayerRequestDto,
  CreatePrayerRequestDto,
  ListPrayerRequestsQueryDto,
  PrayerRequestDto,
} from './dto/prayer-request.dto';

/** JournalModule (api/openapi.yaml `Journal` tag): journal entries + prayer requests. */
@ApiTags('Journal')
@Controller()
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get('journal-entries')
  @ApiOperation({ summary: 'List journal entries' })
  @ApiResponse({ status: 200, type: [JournalEntryDto] })
  listEntries(@CurrentUser() user: AuthenticatedUser, @Query() query: ListJournalEntriesQueryDto) {
    return this.journalService.listEntries(user.userId, query);
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'Create a journal entry' })
  @ApiResponse({ status: 201, type: JournalEntryDto })
  createEntry(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJournalEntryDto) {
    return this.journalService.createEntry(user.userId, dto);
  }

  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Get a journal entry' })
  @ApiResponse({ status: 200, type: JournalEntryDto })
  findEntry(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.journalService.findEntry(user.userId, id);
  }

  @Patch('journal-entries/:id')
  @ApiOperation({ summary: 'Update a journal entry' })
  @ApiResponse({ status: 200, type: JournalEntryDto })
  updateEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.journalService.updateEntry(user.userId, id, dto);
  }

  @Delete('journal-entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a journal entry' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async deleteEntry(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.journalService.deleteEntry(user.userId, id);
  }

  @Get('prayer-requests')
  @ApiOperation({ summary: 'List prayer requests (own, or group/public per visibility)' })
  @ApiResponse({ status: 200, type: [PrayerRequestDto] })
  listPrayerRequests(@CurrentUser() user: AuthenticatedUser, @Query() query: ListPrayerRequestsQueryDto) {
    return this.journalService.listPrayerRequests(user.userId, query);
  }

  @Post('prayer-requests')
  @ApiOperation({ summary: 'Create a prayer request' })
  @ApiResponse({ status: 201, type: PrayerRequestDto })
  createPrayerRequest(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePrayerRequestDto) {
    return this.journalService.createPrayerRequest(user.userId, dto);
  }

  @Post('prayer-requests/:id/answer')
  @ApiOperation({ summary: 'Mark a prayer request as answered' })
  @ApiResponse({ status: 200, type: PrayerRequestDto })
  answerPrayerRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AnswerPrayerRequestDto,
  ) {
    return this.journalService.answerPrayerRequest(user.userId, id, dto);
  }
}
