import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { AdminUserQueryDto, ChangeRoleDto } from './dto/admin-user.dto';
import { AiUsageQueryDto, AiUsageSummaryDto } from './dto/ai-usage.dto';
import { ModerationQueryDto, ResolvePostDto } from './dto/moderation.dto';
import { UpdateOrganizationDto } from '../organizations/dto/organization.dto';

/**
 * AdminModule (docs/08-backend-architecture.md §2; api/openapi.yaml `Admin`
 * tag; docs/17 Admin Portal Design). Route-level access is enforced by
 * @Roles() + RolesGuard per docs/10 §5 RBAC matrix.
 *
 * Note: `schema.prisma` has no `AdminAuditLog` model, though the OpenAPI spec
 * describes role changes as "writes AdminAuditLog". This stub logs such
 * actions via Nest's Logger instead — a full implementation would add an
 * AdminAuditLog table and persist {actorId, action, targetId, metadata}.
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async listUsers(query: AdminUserQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.tier ? { subscription: { tier: query.tier } } : {}),
      ...(query.q
        ? {
            OR: [
              { email: { contains: query.q, mode: 'insensitive' as const } },
              { name: { contains: query.q, mode: 'insensitive' as const } },
              { id: query.q },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { subscription: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => this.toUserResponse(user, user.subscription?.tier ?? SubscriptionTier.FREE)),
      meta: { pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    };
  }

  async changeUserRole(actorUserId: string, targetUserId: string, dto: ChangeRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { subscription: true },
    });
    if (!user) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found.' });
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      include: { subscription: true },
    });

    this.logger.log(
      `AdminAuditLog (stub): actor=${actorUserId} action=CHANGE_ROLE target=${targetUserId} role=${dto.role}`,
    );

    return this.toUserResponse(updated, updated.subscription?.tier ?? SubscriptionTier.FREE);
  }

  async updateOrganization(id: string, dto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, dto);
  }

  /**
   * Aggregates AIUsageLog rows into the AIUsageSummary shape. errorRate is
   * computed as FAILED / total per feature.
   */
  async getAiUsageSummary(query: AiUsageQueryDto): Promise<AiUsageSummaryDto> {
    const where = {
      ...(query.feature ? { feature: query.feature } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const logs = await this.prisma.aIUsageLog.findMany({ where });

    const totalRequests = logs.length;
    const totalCostUsdMicros = logs.reduce((sum, log) => sum + log.costUsdMicros, 0);

    const byFeatureMap = new Map<string, { requests: number; costUsdMicros: number; latencySum: number; failed: number }>();
    for (const log of logs) {
      const entry = byFeatureMap.get(log.feature) ?? { requests: 0, costUsdMicros: 0, latencySum: 0, failed: 0 };
      entry.requests += 1;
      entry.costUsdMicros += log.costUsdMicros;
      entry.latencySum += log.latencyMs;
      if (log.status === 'FAILED') entry.failed += 1;
      byFeatureMap.set(log.feature, entry);
    }

    const byFeature = Array.from(byFeatureMap.entries()).map(([feature, entry]) => ({
      feature: feature as AiUsageSummaryDto['byFeature'][number]['feature'],
      requests: entry.requests,
      costUsdMicros: entry.costUsdMicros,
      avgLatencyMs: entry.requests > 0 ? Math.round(entry.latencySum / entry.requests) : 0,
      errorRate: entry.requests > 0 ? entry.failed / entry.requests : 0,
    }));

    return { totalRequests, totalCostUsdMicros, byFeature };
  }

  /** Lists ImageGenerations flagged for moderation review. */
  async listFlaggedImages(query: ModerationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = { moderationStatus: 'FLAGGED' as const };

    const [images, total] = await Promise.all([
      this.prisma.imageGeneration.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.imageGeneration.count({ where }),
    ]);

    return {
      data: images,
      meta: { pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    };
  }

  async resolveFlaggedPost(actorUserId: string, id: string, dto: ResolvePostDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Post not found.' });
    }

    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: { moderationStatus: dto.moderationStatus },
      include: { user: { include: { subscription: true } }, _count: { select: { likes: true, comments: true } } },
    });

    this.logger.log(
      `AdminAuditLog (stub): actor=${actorUserId} action=RESOLVE_POST target=${id} status=${dto.moderationStatus}`,
    );

    return {
      id: updated.id,
      type: updated.type,
      content: updated.content,
      moderationStatus: updated.moderationStatus,
      likeCount: updated._count.likes,
      commentCount: updated._count.comments,
      author: this.toUserResponse(updated.user, updated.user.subscription?.tier ?? SubscriptionTier.FREE),
      createdAt: updated.createdAt,
    };
  }

  private toUserResponse(
    user: { id: string; email: string | null; phone: string | null; name: string; avatarUrl: string | null; role: any; denominationLens: string | null; locale: string; timezone: string; defaultBibleVersionId: string | null; emailVerifiedAt: boolean; isActive: boolean; createdAt: Date },
    tier: SubscriptionTier,
  ): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      tier,
      denominationLens: user.denominationLens,
      locale: user.locale,
      timezone: user.timezone,
      defaultBibleVersionId: user.defaultBibleVersionId,
      emailVerifiedAt: user.emailVerifiedAt,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
