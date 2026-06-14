import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { OrganizationDto, UpdateOrganizationDto } from '../organizations/dto/organization.dto';
import { ImageGenerationDto } from '../visual-studio/dto/image-generation.dto';
import { CommunityPostDto } from '../community/dto/community-post.dto';
import { AdminService } from './admin.service';
import { AdminUserQueryDto, ChangeRoleDto } from './dto/admin-user.dto';
import { AiUsageQueryDto, AiUsageSummaryDto } from './dto/ai-usage.dto';
import { ModerationQueryDto, ResolvePostDto } from './dto/moderation.dto';

/**
 * AdminModule (api/openapi.yaml `Admin` tag; docs/17 Admin Portal Design —
 * this is the API subset). Each route is restricted via @Roles() + RolesGuard
 * per docs/10-authentication-system.md §5 RBAC matrix.
 */
@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(UserRole.SUPPORT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Search/list users (SUPPORT, ADMIN, SUPER_ADMIN)' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  listUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Change a user's role (ADMIN, SUPER_ADMIN) — writes AdminAuditLog" })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  changeUserRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.adminService.changeUserRole(actor.userId, id, dto);
  }

  @Patch('organizations/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Update an organization's seats/billing (ADMIN, SUPER_ADMIN)" })
  @ApiResponse({ status: 200, type: OrganizationDto })
  updateOrganization(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.adminService.updateOrganization(id, dto);
  }

  @Get('ai-usage')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Aggregate AI usage analytics (ADMIN, SUPER_ADMIN)' })
  @ApiResponse({ status: 200, type: AiUsageSummaryDto })
  getAiUsage(@Query() query: AiUsageQueryDto) {
    return this.adminService.getAiUsageSummary(query);
  }

  @Get('moderation/images')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List flagged image generations (MODERATOR, ADMIN, SUPER_ADMIN)' })
  @ApiResponse({ status: 200, type: [ImageGenerationDto] })
  listFlaggedImages(@Query() query: ModerationQueryDto) {
    return this.adminService.listFlaggedImages(query);
  }

  @Patch('moderation/posts/:id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resolve a flagged community post (MODERATOR, ADMIN, SUPER_ADMIN)' })
  @ApiResponse({ status: 200, type: CommunityPostDto })
  resolveFlaggedPost(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolvePostDto,
  ) {
    return this.adminService.resolveFlaggedPost(actor.userId, id, dto);
  }
}
