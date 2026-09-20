import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OwnershipGuard } from '../src/common/guards/ownership.guard';
import { IAuthUser, UserRole, AccountStatus } from '@alpha/types';

describe('User Isolation & OwnershipGuard (Mandatory Security Tests)', () => {
  let guard: OwnershipGuard;
  let reflector: Reflector;

  const userA: IAuthUser = {
    id: 'user_A_uuid_1111',
    email: 'user_a@alpha.os',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  const userB: IAuthUser = {
    id: 'user_B_uuid_2222',
    email: 'user_b@alpha.os',
    role: UserRole.ATHLETE,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  const adminUser: IAuthUser = {
    id: 'admin_uuid_9999',
    email: 'admin@alpha.os',
    role: UserRole.ADMIN,
    status: AccountStatus.ACTIVE,
    isEmailVerified: true,
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new OwnershipGuard(reflector);
  });

  function createMockContext(authenticatedUser: IAuthUser, params: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: authenticatedUser,
          params,
          body: {},
          query: {},
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('MANDATORY: User A accessing User A resource => ALLOWED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ paramName: 'userId' });

    const ctx = createMockContext(userA, { userId: userA.id });
    const canActivate = guard.canActivate(ctx);

    expect(canActivate).toBe(true);
  });

  it('MANDATORY: User A accessing User B resource => DENIED (ForbiddenException)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ paramName: 'userId' });

    const ctx = createMockContext(userA, { userId: userB.id });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    try {
      guard.canActivate(ctx);
    } catch (err: unknown) {
      const response = (err as ForbiddenException).getResponse() as { code: string };
      expect(response.code).toBe('CROSS_USER_ACCESS_DENIED');
    }
  });

  it('MANDATORY: User B accessing User B resource => ALLOWED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ paramName: 'userId' });

    const ctx = createMockContext(userB, { userId: userB.id });
    const canActivate = guard.canActivate(ctx);

    expect(canActivate).toBe(true);
  });

  it('MANDATORY: User B accessing User A resource => DENIED (ForbiddenException)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ paramName: 'userId' });

    const ctx = createMockContext(userB, { userId: userA.id });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    try {
      guard.canActivate(ctx);
    } catch (err: unknown) {
      const response = (err as ForbiddenException).getResponse() as { code: string };
      expect(response.code).toBe('CROSS_USER_ACCESS_DENIED');
    }
  });

  it('Admin accessing User A resource for audit => ALLOWED', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ paramName: 'userId' });

    const ctx = createMockContext(adminUser, { userId: userA.id });
    const canActivate = guard.canActivate(ctx);

    expect(canActivate).toBe(true);
  });
});
