import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RefreshTokenSummaryDto } from './dto/session.dto';

/** UsersModule (api/openapi.yaml `Users` tag — `/users/me*`). */
@ApiTags('Users')
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Get the authenticated user's profile" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService.getMe(user.userId);
  }

  @Patch()
  @ApiOperation({ summary: "Update the authenticated user's profile/preferences" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateMe(user.userId, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Soft-delete the authenticated user's account (14-day recoverable, docs §12 §5)" })
  @ApiResponse({ status: 202, description: 'Account scheduled for deletion' })
  async deleteMe(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.usersService.deleteMe(user.userId);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions (non-revoked refresh tokens)' })
  @ApiResponse({ status: 200, type: [RefreshTokenSummaryDto] })
  listSessions(@CurrentUser() user: AuthenticatedUser): Promise<RefreshTokenSummaryDto[]> {
    return this.usersService.listSessions(user.userId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a single session ("log out this device")' })
  @ApiResponse({ status: 204, description: 'Session revoked' })
  async revokeSession(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.usersService.revokeSession(user.userId, id);
  }

  @Post('export')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a "Download My Data" export (async job, docs §12 §5)' })
  @ApiResponse({ status: 202, description: 'Export job queued; a signed S3 download link will be emailed (24h expiry)' })
  async requestExport(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.usersService.requestExport(user.userId);
  }
}
