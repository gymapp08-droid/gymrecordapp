import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHECK_OWNERSHIP_KEY, OwnershipRule } from '../decorators/check-ownership.decorator';
import { IAuthUser, UserRole } from '@alpha/types';

/**
 * Enforces User Isolation:
 * Verifies that the authenticated user matches the target resource owner ID.
 * Admins are permitted for operational audit.
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rule = this.reflector.getAllAndOverride<OwnershipRule>(CHECK_OWNERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as IAuthUser;
    const targetUserId = request.params[rule.paramName] || request.body[rule.paramName] || request.query[rule.paramName];

    if (!user) {
      throw new ForbiddenException({
        code: 'UNAUTHORIZED_ACCESS',
        message: 'Authentication required for owner verification',
      });
    }

    // Admins bypass strict ownership for compliance/support
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Cross-user access check
    if (user.id !== targetUserId) {
      throw new ForbiddenException({
        code: 'CROSS_USER_ACCESS_DENIED',
        message: 'Access denied: You are not authorized to view or modify this user resource',
      });
    }

    return true;
  }
}
