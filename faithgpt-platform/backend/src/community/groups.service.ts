import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Group } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, ListGroupsQueryDto } from './dto/group.dto';

/**
 * GroupsModule's service (api/openapi.yaml `Groups` tag) — community groups
 * and membership. Hosted alongside CommunityModule in this scaffold since
 * groups are a community sub-resource.
 */
@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListGroupsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = query.mine
      ? { members: { some: { userId } } }
      : { OR: [{ isPrivate: false }, { members: { some: { userId } } }] };

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { members: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      data: groups.map((group) => this.toGroupDto(group)),
      meta: { pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    };
  }

  /** PLUS+ per docs §11 §2 — enforced via @TierRequired(PLUS) + TierGuard on the controller. */
  async create(userId: string, dto: CreateGroupDto) {
    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        ownerId: userId,
        members: { create: { userId, role: 'LEADER' } },
      },
      include: { _count: { select: { members: true } } },
    });

    return this.toGroupDto(group);
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });

    if (!group) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Group not found.' });
    }

    return this.toGroupDto(group);
  }

  async join(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Group not found.' });
    }

    const existing = await this.prisma.groupMembership.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_ENROLLED',
        message: 'You are already a member of this group.',
      });
    }

    const membership = await this.prisma.groupMembership.create({
      data: { groupId, userId },
    });

    return {
      id: membership.id,
      groupId: membership.groupId,
      userId: membership.userId,
      role: membership.role,
      joinedAt: membership.joinedAt,
    };
  }

  private toGroupDto(group: Group & { _count: { members: number } }) {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group._count.members,
      createdAt: group.createdAt,
    };
  }
}
