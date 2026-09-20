import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IAuthUser, UserRole } from '@alpha/types';

@Injectable()
export class AnalyticsAuthorizationGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as IAuthUser;

    if (!user) {
      throw new UnauthorizedException('Authentication required for analytics access');
    }

    // Platform ADMIN has operational audit permissions
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const path = request.path || '';

    // 1. Organization Analytics Scope Check
    if (path.includes('/analytics/organization') || request.query.organizationId) {
      const targetOrgId = request.query.organizationId || request.params.organizationId;
      if (user.role !== UserRole.ORG_ADMIN) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_ORG_ANALYTICS',
          message: 'Only organization administrators can access executive organization analytics',
        });
      }
      if (targetOrgId && targetOrgId !== user.organizationId) {
        throw new ForbiddenException({
          code: 'CROSS_ORG_FORBIDDEN',
          message: 'Cross-tenant organization analytics access is strictly denied',
        });
      }
      return true;
    }

    // 2. Coach Analytics Scope Check
    if (path.includes('/analytics/coach') || request.query.coachId) {
      const targetCoachId = request.query.coachId || request.params.coachId;
      const isCoachRole = [
        UserRole.COACH,
        UserRole.TRAINER,
        UserRole.NUTRITIONIST,
        UserRole.ORG_ADMIN,
      ].includes(user.role);

      if (!isCoachRole) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_COACH_ANALYTICS',
          message: 'Only coaching personnel or organization administrators can access coach analytics',
        });
      }

      if (targetCoachId && targetCoachId !== user.id && user.role !== UserRole.ORG_ADMIN) {
        throw new ForbiddenException({
          code: 'UNAUTHORIZED_COACH_SCOPE',
          message: 'Cannot access analytics for another coach without administrative authorization',
        });
      }
      return true;
    }

    // 3. Client Analytics Scope Check
    const targetClientId = request.query.clientId || request.params.clientId || request.params.id;
    if (targetClientId && targetClientId !== user.id) {
      // If user is a Coach, check active relationship
      if ([UserRole.COACH, UserRole.TRAINER, UserRole.NUTRITIONIST].includes(user.role)) {
        const relationship = await this.prisma.coachClientRelationship.findFirst({
          where: {
            coachId: user.id,
            clientId: targetClientId,
            isActive: true,
            status: 'ACTIVE',
          },
        });

        if (!relationship) {
          throw new ForbiddenException({
            code: 'FORBIDDEN_CLIENT_ANALYTICS',
            message: 'Coach does not have an active authorized relationship with this client',
          });
        }
        return true;
      }

      // If user is Org Admin, verify same organization
      if (user.role === UserRole.ORG_ADMIN) {
        const targetClient = await this.prisma.user.findUnique({
          where: { id: targetClientId },
          select: { organizationId: true },
        });

        if (!targetClient || targetClient.organizationId !== user.organizationId) {
          throw new ForbiddenException({
            code: 'CROSS_ORG_CLIENT_ANALYTICS',
            message: 'Cannot access client analytics outside your organization',
          });
        }
        return true;
      }

      // Any other role (e.g. Athlete) cannot access another user's analytics
      throw new ForbiddenException({
        code: 'FORBIDDEN_USER_ANALYTICS',
        message: 'Athletes can only access their own personal performance analytics',
      });
    }

    return true;
  }
}
