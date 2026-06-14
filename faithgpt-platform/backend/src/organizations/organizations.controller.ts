import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { OffsetPaginationDto } from '../common/dto/pagination.dto';
import { OrganizationsService } from './organizations.service';
import {
  AddOrganizationMemberDto,
  CreateOrganizationDto,
  OrganizationDto,
  OrganizationMemberDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

/** OrganizationsModule (api/openapi.yaml `Organizations` tag, multi-tenant — docs §08 §6). */
@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List organizations the authenticated user belongs to' })
  @ApiResponse({ status: 200, type: [OrganizationDto] })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.listForUser(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Ministry organization (initiates MINISTRY subscription setup)' })
  @ApiResponse({ status: 201, type: OrganizationDto })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization detail' })
  @ApiResponse({ status: 200, type: OrganizationDto })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization (name, seatLimit, billingEmail) — ADMIN role in org' })
  @ApiResponse({ status: 200, type: OrganizationDto })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List organization members' })
  @ApiResponse({ status: 200, type: [OrganizationMemberDto] })
  listMembers(@Param('id') id: string, @Query() pagination: OffsetPaginationDto) {
    return this.organizationsService.listMembers(id, pagination);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Invite/add a member to the organization' })
  @ApiResponse({ status: 201, type: OrganizationMemberDto })
  addMember(@Param('id') id: string, @Body() dto: AddOrganizationMemberDto) {
    return this.organizationsService.addMember(id, dto);
  }
}
