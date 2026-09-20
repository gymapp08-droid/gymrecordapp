import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IAuthUser, UserRole, ClientStatus } from '@alpha/types';

/**
 * CoachClientGuard
 * 
 * Enforces strict Tenant & Relationship Isolation:
 * - ADMIN: Unrestricted audit/operational access.
 * - ORG_ADMIN: Can access any client belonging to the same organizationId.
 * - COACH / TRAINER / NUTRITIONIST: MUST have an explicit, active CoachClientRelationship
 *   with the target client (status === ACTIVE and isActive === true).
 * - Multi-tenant isolation: Rejects any cross-organization access if organization IDs do not match.
 */
@Injectable()
export class CoachClientGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as IAuthUser;

    if (!user) {
      throw new ForbiddenException({
        code: 'UNAUTHORIZED_ACCESS',
        message: 'No authenticated user identity found',
      });
    }

    // Platform ADMIN bypasses for operational audit
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const targetClientId =
      request.params.clientId || request.params.id || request.body?.clientId;

    // If no target client specified in request params or body, proceed
    if (!targetClientId) {
      return true;
    }

    // Lookup target client user
    const client = await this.prisma.user.findUnique({
      where: { id: targetClientId },
      select: { id: true, organizationId: true, role: true },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        message: `Target client with ID [${targetClientId}] was not found`,
      });
    }

    // Cross-tenant isolation check: if both user and client have organizationId, they MUST match
    if (
      user.organizationId &&
      client.organizationId &&
      user.organizationId !== client.organizationId
    ) {
      throw new ForbiddenException({
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'Access denied: client belongs to a different organization',
      });
    }

    // ORG_ADMIN check: Must belong to same organization
    if (user.role === UserRole.ORG_ADMIN) {
      if (!user.organizationId || user.organizationId !== client.organizationId) {
        throw new ForbiddenException({
          code: 'CROSS_TENANT_ACCESS_DENIED',
          message: 'Organization administrators may only access clients within their organization',
        });
      }
      return true;
    }

    // Professionals (COACH, TRAINER, NUTRITIONIST) require explicit active relationship
    const relationship = await this.prisma.coachClientRelationship.findUnique({
      where: {
        coachId_clientId: {
          coachId: user.id,
          clientId: targetClientId,
        },
      },
    });

    if (!relationship || !relationship.isActive || relationship.status !== ClientStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'CLIENT_NOT_ASSIGNED_TO_COACH',
        message: 'Access denied: client is not actively assigned to this coach',
      });
    }

    return true;
  }
}
