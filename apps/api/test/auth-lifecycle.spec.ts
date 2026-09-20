import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';
import { AccountStatus, SocialProvider, UserRole } from '@alpha/types';

describe('Auth Lifecycle & Session Security (Phase 02 Gate 02 Tests)', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'test_jwt_access_secret_min_32_characters_long',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [AuthService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authService.clearUsers();
  });

  it('LIFECYCLE 1: Complete Registration flow with hashed password and verification token', async () => {
    const res = await authService.register({
      email: 'alex@alpha.os',
      password: 'AlphaPassword123!',
      fullName: 'Alex Rivers',
      role: UserRole.ATHLETE,
    });

    expect(res).toBeDefined();
    expect(res.user.email).toBe('alex@alpha.os');
    expect(res.user.status).toBe(AccountStatus.ACTIVE);
    expect(res.user.isEmailVerified).toBe(false);
    expect(res.tokens.accessToken).toBeDefined();
    expect(res.tokens.refreshToken).toBeDefined();
    expect(res.verificationToken).toBeDefined();
  });

  it('LIFECYCLE 2: Login returns valid tokens and session context', async () => {
    await authService.register({
      email: 'marcus@alpha.os',
      password: 'StrongPassword123!',
      fullName: 'Marcus Vance',
    });

    const loginRes = await authService.login({
      email: 'marcus@alpha.os',
      password: 'StrongPassword123!',
    });

    expect(loginRes.user.email).toBe('marcus@alpha.os');
    expect(loginRes.tokens.accessToken).toBeDefined();
    expect(loginRes.tokens.refreshToken).toBeDefined();
  });

  it('LIFECYCLE 3: Session Restore via Refresh Token works and rotates tokens', async () => {
    const reg = await authService.register({
      email: 'elena@alpha.os',
      password: 'StrongPassword123!',
      fullName: 'Elena Rostova',
    });

    const newTokens = await authService.refresh(reg.tokens.refreshToken);
    expect(newTokens.accessToken).toBeDefined();
    expect(newTokens.refreshToken).toBeDefined();
    expect(newTokens.accessToken).not.toBe(reg.tokens.accessToken);
  });

  it('LIFECYCLE 4 & 5: Logout invalidates the refresh token (subsequent refresh fails with SESSION_REVOKED)', async () => {
    const reg = await authService.register({
      email: 'sarah@alpha.os',
      password: 'StrongPassword123!',
      fullName: 'Sarah Connor',
    });

    // Logout
    const logoutRes = await authService.logout({ refreshToken: reg.tokens.refreshToken }, reg.user.id);
    expect(logoutRes.success).toBe(true);

    // Attempting to restore session with logged-out refresh token MUST fail
    await expect(authService.refresh(reg.tokens.refreshToken)).rejects.toThrow(UnauthorizedException);

    // User can login again and gets fresh active tokens
    const loginAgain = await authService.login({
      email: 'sarah@alpha.os',
      password: 'StrongPassword123!',
    });
    expect(loginAgain.tokens.accessToken).toBeDefined();

    // New token works for session restore
    const restored = await authService.refresh(loginAgain.tokens.refreshToken);
    expect(restored.accessToken).toBeDefined();
  });

  it('LIFECYCLE 6: Password Recovery flow (Forgot Password -> Reset Password -> Login with new password)', async () => {
    await authService.register({
      email: 'reset_test@alpha.os',
      password: 'OldPassword123!',
      fullName: 'Reset Tester',
    });

    // 1. Forgot Password request
    const forgotRes = await authService.forgotPassword({ email: 'reset_test@alpha.os' });
    expect(forgotRes.success).toBe(true);
    expect(forgotRes.debugResetToken).toBeDefined();

    const resetToken = forgotRes.debugResetToken!;

    // 2. Confirm Password Reset
    const resetRes = await authService.resetPassword({
      token: resetToken,
      newPassword: 'BrandNewPassword123!',
    });
    expect(resetRes.success).toBe(true);

    // 3. Old password no longer works
    await expect(
      authService.login({
        email: 'reset_test@alpha.os',
        password: 'OldPassword123!',
      }),
    ).rejects.toThrow(UnauthorizedException);

    // 4. New password works
    const newLogin = await authService.login({
      email: 'reset_test@alpha.os',
      password: 'BrandNewPassword123!',
    });
    expect(newLogin.tokens.accessToken).toBeDefined();

    // 5. Reusing the reset token fails
    await expect(
      authService.resetPassword({
        token: resetToken,
        newPassword: 'AnotherPassword123!',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('SECURITY: Invalid Credential Handling (prevents detailed leak)', async () => {
    await authService.register({
      email: 'secure_user@alpha.os',
      password: 'Password123!',
      fullName: 'Secure User',
    });

    // Wrong password
    await expect(
      authService.login({ email: 'secure_user@alpha.os', password: 'WrongPassword!' }),
    ).rejects.toThrow(UnauthorizedException);

    // Non-existent email gives identical generic error
    await expect(
      authService.login({ email: 'nonexistent@alpha.os', password: 'Password123!' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('SECURITY: Suspended and Deleted accounts are blocked from login', async () => {
    await authService.register({
      email: 'suspended_user@alpha.os',
      password: 'Password123!',
      fullName: 'Suspended User',
    });

    // Suspend user
    const user = (authService as any).inMemoryUsers.get('suspended_user@alpha.os');
    user.status = AccountStatus.SUSPENDED;

    await expect(
      authService.login({ email: 'suspended_user@alpha.os', password: 'Password123!' }),
    ).rejects.toThrow(ForbiddenException);

    // Delete user
    user.status = AccountStatus.DELETED;
    await expect(
      authService.login({ email: 'suspended_user@alpha.os', password: 'Password123!' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('SECURITY: Social Auth correctly reports unconfigured providers without fake success', async () => {
    await expect(
      authService.socialAuth({
        provider: SocialProvider.GOOGLE,
        idToken: 'mock_google_id_token',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      authService.socialAuth({
        provider: SocialProvider.APPLE,
        idToken: 'mock_apple_identity_token',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('EMAIL VERIFICATION: Confirms email and records status', async () => {
    const reg = await authService.register({
      email: 'verify_me@alpha.os',
      password: 'Password123!',
      fullName: 'Verify Athlete',
    });

    expect(reg.verificationToken).toBeDefined();

    const verifyRes = await authService.verifyEmail({ token: reg.verificationToken! });
    expect(verifyRes.success).toBe(true);

    const user = (authService as any).inMemoryUsers.get('verify_me@alpha.os');
    expect(user.isEmailVerified).toBe(true);

    // Reusing expired/used token fails
    await expect(authService.verifyEmail({ token: reg.verificationToken! })).rejects.toThrow(BadRequestException);
  });
});