import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';
import { NotificationsService } from './notifications.service';
import {
  NotificationDto,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification.dto';

/** NotificationsModule (api/openapi.yaml `Notifications` tag). */
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's notifications" })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: CursorPaginationDto) {
    return this.notificationsService.list(user.userId, query.limit ?? 20, query.cursor);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 204, description: 'Marked read' })
  async markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.notificationsService.markRead(user.userId, id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences (by NotificationType)' })
  @ApiResponse({ status: 200, type: NotificationPreferencesDto })
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return { data: this.notificationsService.getPreferences(user.userId) };
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences (transactional types always-on, non-editable)' })
  @ApiResponse({ status: 200, type: NotificationPreferencesDto })
  updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateNotificationPreferencesDto) {
    return { data: this.notificationsService.updatePreferences(user.userId, dto) };
  }
}
