import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Multi-tenancy guard for `MINISTRY` tier org-scoped routes
 * (docs/08-backend-architecture.md §6), e.g.
 * `/api/v1/organizations/:organizationId/...`.
 *
 * Resolves the authenticated user's OrganizationMember row for the
 * `:organizationId` path param (or `X-Organization-Id` header as a fallback),
 * verifies membership, and attaches `request.organizationId` to the request
 * context for downstream Prisma-scoped queries.
 *
 * This is a structural stub — full Prisma middleware enforcement (defense in
 * depth, per §6) is not implemented here.
 */
@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const organizationId: string | undefined =
      request.params?.organizationId ?? request.params?.id ?? request.headers['x-organization-id'];

    if (!organizationId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Organization context is required for this resource.',
      });
    }

    if (!user) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Authentication is required for organization-scoped resources.',
      });
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: user.userId } },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: 'TENANT_MISMATCH',
        message: 'You are not a member of this organization.',
      });
    }

    request.organizationId = organizationId;
    request.organizationRole = membership.roleInOrg;

    return true;
  }
}
