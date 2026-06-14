import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OffsetPaginationDto } from '../common/dto/pagination.dto';
import {
  AddOrganizationMemberDto,
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

/**
 * OrganizationsModule (docs/08-backend-architecture.md §2 / §6 multi-tenancy):
 * Ministry org CRUD, seat management, member roles.
 */
@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map((m) => m.organization);
  }

  async create(userId: string, dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        type: dto.type ?? 'CHURCH',
        billingEmail: dto.billingEmail ?? null,
        members: {
          create: { userId, roleInOrg: 'ADMIN' },
        },
      },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Organization not found.' });
    }
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.seatLimit !== undefined ? { seatLimit: dto.seatLimit } : {}),
        ...(dto.billingEmail !== undefined ? { billingEmail: dto.billingEmail } : {}),
      },
    });
  }

  async listMembers(id: string, pagination: OffsetPaginationDto) {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 20;

    const [members, total] = await Promise.all([
      this.prisma.organizationMember.findMany({
        where: { organizationId: id },
        include: { user: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.organizationMember.count({ where: { organizationId: id } }),
    ]);

    return {
      data: members,
      meta: {
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  }

  /**
   * Invites/adds a member by email. Stub: assumes the user already exists;
   * a full implementation would create a pending invite for unknown emails.
   */
  async addMember(organizationId: string, dto: AddOrganizationMemberDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: `No user found with email '${dto.email}' to invite.`,
      });
    }

    return this.prisma.organizationMember.create({
      data: { organizationId, userId: user.id, roleInOrg: dto.roleInOrg },
    });
  }
}
