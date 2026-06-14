import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionTier } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { TierRequired } from '../common/decorators/tier-required.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto, GroupDto, GroupMembershipDto, ListGroupsQueryDto } from './dto/group.dto';

/** GroupsModule (api/openapi.yaml `Groups` tag): community groups + membership. */
@ApiTags('Groups')
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: "List discoverable groups + the user's own groups" })
  @ApiResponse({ status: 200, type: [GroupDto] })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListGroupsQueryDto) {
    return this.groupsService.list(user.userId, query);
  }

  @Post()
  @TierRequired(SubscriptionTier.PLUS)
  @ApiOperation({ summary: 'Create a Community Group (PLUS+ per docs §11 §2)' })
  @ApiResponse({ status: 201, type: GroupDto })
  @ApiResponse({ status: 403, description: 'Tier required' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group detail (feed, members, prayer wall accessed via other resources)' })
  @ApiResponse({ status: 200, type: GroupDto })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a group' })
  @ApiResponse({ status: 201, type: GroupMembershipDto })
  @ApiResponse({ status: 409, description: 'Already a member' })
  join(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.groupsService.join(user.userId, id);
  }
}
