import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '@alpha/types';
import {
  RateLimiter,
  RATE_LIMIT_PROFILES,
  FileSecurityUtil,
  WebhookSecurityUtil,
  NotificationPrivacyUtil,
} from '@alpha/utils';

describe('Phase 12 — Gate B: Advanced Security Hardening Suite', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'gate_b_jwt_test_secret_min_32_characters_long',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [AuthService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authService.clearUsers();
  });

  describe('1. Account Lockout & Brute-Force Defense', () => {
    it('locks account after 5 consecutive failed login attempts with ACCOUNT_LOCKED', async () => {
      await authService.register({
        email: 'lockout@alpha.os',
        password: 'CorrectAlphaPass123!',
        fullName: 'Lockout Test User',
        role: UserRole.ATHLETE,
      });

      // 4 consecutive failed attempts should throw INVALID_CREDENTIALS
      for (let i = 1; i <= 4; i++) {
        await expect(
          authService.login({
            email: 'lockout@alpha.os',
            password: 'WrongPassword!',
          }),
        ).rejects.toThrow(UnauthorizedException);
      }

      // 5th failed attempt should trigger ACCOUNT_LOCKED (ForbiddenException)
      try {
        await authService.login({
          email: 'lockout@alpha.os',
          password: 'WrongPassword!',
        });
        fail('Should have thrown ForbiddenException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        const response = err.getResponse();
        expect(response.code).toBe('ACCOUNT_LOCKED');
        expect(response.message).toContain('Account is temporarily locked');
      }

      // Subsequent login attempt (even with correct password) MUST be rejected while locked
      try {
        await authService.login({
          email: 'lockout@alpha.os',
          password: 'CorrectAlphaPass123!',
        });
        fail('Should remain locked even with correct password');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse().code).toBe('ACCOUNT_LOCKED');
      }
    });

    it('resets failed attempt counter upon successful login', async () => {
      await authService.register({
        email: 'reset_counter@alpha.os',
        password: 'CorrectAlphaPass123!',
        fullName: 'Counter Reset User',
      });

      // 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await expect(
          authService.login({
            email: 'reset_counter@alpha.os',
            password: 'WrongPassword!',
          }),
        ).rejects.toThrow(UnauthorizedException);
      }

      // 1 successful login
      const successful = await authService.login({
        email: 'reset_counter@alpha.os',
        password: 'CorrectAlphaPass123!',
      });
      expect(successful.tokens.accessToken).toBeDefined();

      // Another 3 failed attempts should NOT lock the account (since counter was reset)
      for (let i = 0; i < 3; i++) {
        await expect(
          authService.login({
            email: 'reset_counter@alpha.os',
            password: 'WrongPassword!',
          }),
        ).rejects.toThrow(UnauthorizedException);
      }
    });
  });

  describe('2. Active Session Tracking & Multi-Device Revocation', () => {
    it('tracks active sessions per device and allows listing active sessions', async () => {
      const reg = await authService.register({
        email: 'sessions@alpha.os',
        password: 'AlphaPassword123!',
        fullName: 'Multi Device User',
      });

      // Login on Mobile
      await authService.login(
        { email: 'sessions@alpha.os', password: 'AlphaPassword123!' },
        { deviceId: 'iphone-15-pro', platform: 'ios', ipAddress: '192.168.1.50', userAgent: 'Alpha-iOS/1.0' },
      );

      // Login on Web Desktop
      await authService.login(
        { email: 'sessions@alpha.os', password: 'AlphaPassword123!' },
        { deviceId: 'macbook-pro', platform: 'web', ipAddress: '192.168.1.51', userAgent: 'Mozilla/5.0' },
      );

      const sessions = await authService.getActiveSessions(reg.user.id);
      expect(sessions.length).toBe(3); // 1 from register + 2 from logins
      const platforms = sessions.map((s) => s.platform);
      expect(platforms).toContain('ios');
      expect(platforms).toContain('web');
    });

    it('allows selective revocation of an individual session', async () => {
      const reg = await authService.register({
        email: 'revoke_one@alpha.os',
        password: 'AlphaPassword123!',
        fullName: 'Revoke User',
      });

      const mobileLogin = await authService.login(
        { email: 'revoke_one@alpha.os', password: 'AlphaPassword123!' },
        { deviceId: 'pixel-8', platform: 'android' },
      );

      const desktopLogin = await authService.login(
        { email: 'revoke_one@alpha.os', password: 'AlphaPassword123!' },
        { deviceId: 'desktop-chrome', platform: 'web' },
      );

      // Revoke mobile session
      const mobileSessionId = mobileLogin.session!.id;
      const revokeRes = await authService.revokeSession(reg.user.id, mobileSessionId);
      expect(revokeRes.success).toBe(true);

      // Mobile refresh token MUST now fail
      await expect(authService.refresh(mobileLogin.tokens.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // Desktop refresh token MUST still succeed
      const desktopRefreshed = await authService.refresh(desktopLogin.tokens.refreshToken);
      expect(desktopRefreshed.accessToken).toBeDefined();

      const remaining = await authService.getActiveSessions(reg.user.id);
      expect(remaining.some((s) => s.id === mobileSessionId)).toBe(false);
    });

    it('allows revoking all other sessions while preserving current session', async () => {
      const reg = await authService.register({
        email: 'revoke_others@alpha.os',
        password: 'AlphaPassword123!',
        fullName: 'Revoke Others User',
      });

      const session1 = await authService.login(
        { email: 'revoke_others@alpha.os', password: 'AlphaPassword123!' },
        { deviceId: 'device-1', platform: 'ios' },
      );
      const session2 = await authService.login(
        { email: 'revoke_others@alpha.os', password: 'AlphaPassword123!' },
        { deviceId: 'device-2', platform: 'web' },
      );

      // Revoke all sessions except session2
      const currentSessionId = session2.session!.id;
      const bulkRevoke = await authService.revokeAllOtherSessions(reg.user.id, currentSessionId);
      expect(bulkRevoke.success).toBe(true);
      expect(bulkRevoke.revokedCount).toBeGreaterThanOrEqual(2); // initial register session + session1

      // Session1 refresh token MUST fail
      await expect(authService.refresh(session1.tokens.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // Session2 refresh token MUST succeed
      const session2Refresh = await authService.refresh(session2.tokens.refreshToken);
      expect(session2Refresh.accessToken).toBeDefined();

      const active = await authService.getActiveSessions(reg.user.id);
      expect(active.length).toBe(1);
      expect(active[0]?.id).toBe(currentSessionId);
    });
  });

  describe('3. Sliding-Window Rate Limiter Protection', () => {
    it('enforces sliding-window limits and reports retry-after seconds', () => {
      const limiter = new RateLimiter();
      const clientKey = 'ip_10.0.0.1:auth_login';
      const profile = RATE_LIMIT_PROFILES.AUTH_LOGIN; // 5 reqs per 60s
      const baseTime = 1000000;

      // Make 5 requests within the window
      for (let i = 0; i < 5; i++) {
        const res = limiter.check(clientKey, profile.limit, profile.windowSeconds, baseTime + i * 1000);
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(4 - i);
      }

      // 6th request at 6th second must be blocked
      const blocked = limiter.check(clientKey, profile.limit, profile.windowSeconds, baseTime + 5000);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

      // Distinct client IP is NOT blocked
      const otherClient = limiter.check('ip_10.0.0.2:auth_login', profile.limit, profile.windowSeconds, baseTime + 5000);
      expect(otherClient.allowed).toBe(true);

      // After the window slides (e.g. baseTime + 61 seconds), requests become allowed again
      const afterWindow = limiter.check(clientKey, profile.limit, profile.windowSeconds, baseTime + 62000);
      expect(afterWindow.allowed).toBe(true);
    });
  });

  describe('4. File Upload Security & Magic Byte Validation', () => {
    it('validates binary magic bytes for JPEG, PNG, WebP, and PDF', () => {
      // JPEG Magic bytes: FF D8 FF
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      expect(FileSecurityUtil.validateMagicBytes(jpegBuffer, 'image/jpeg')).toBe(true);

      // PNG Magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
      expect(FileSecurityUtil.validateMagicBytes(pngBuffer, 'image/png')).toBe(true);

      // PDF Magic bytes: 25 50 44 46 (%PDF-)
      const pdfBuffer = Buffer.from('%PDF-1.4\n%test file content');
      expect(FileSecurityUtil.validateMagicBytes(pdfBuffer, 'application/pdf')).toBe(true);
    });

    it('rejects forged executable disguised with image extension', () => {
      // Windows PE executable header: 4D 5A (MZ) disguised as image/png
      const forgedExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
      expect(FileSecurityUtil.validateMagicBytes(forgedExeBuffer, 'image/png')).toBe(false);

      // Shell script disguised as PDF
      const shellScriptBuffer = Buffer.from('#!/bin/bash\nrm -rf /');
      expect(FileSecurityUtil.validateMagicBytes(shellScriptBuffer, 'application/pdf')).toBe(false);
    });

    it('sanitizes path traversal filenames safely', () => {
      expect(FileSecurityUtil.sanitizeFilename('../../etc/passwd')).toBe('passwd');
      expect(FileSecurityUtil.sanitizeFilename('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe');
      expect(FileSecurityUtil.sanitizeFilename('user/avatar/photo (1).png')).toBe('photo_1_.png');
      expect(FileSecurityUtil.sanitizeFilename('../../../var/log/app.log')).toBe('app.log');
    });

    it('enforces file size constraints and presigned URL TTL limits', () => {
      // 5MB is allowed for 10MB limit
      expect(FileSecurityUtil.validateFileSize(5 * 1024 * 1024, 10)).toBe(true);
      // 15MB exceeds 10MB limit
      expect(FileSecurityUtil.validateFileSize(15 * 1024 * 1024, 10)).toBe(false);

      // Presigned URL TTL: 900s (15 min) allowed, 3600s rejected
      expect(FileSecurityUtil.isValidSignedUrlTtl(900)).toBe(true);
      expect(FileSecurityUtil.isValidSignedUrlTtl(3600)).toBe(false);
      expect(FileSecurityUtil.isValidSignedUrlTtl(0)).toBe(false);
    });
  });

  describe('5. Webhook Security & Replay Prevention', () => {
    const secret = 'webhook_hmac_secret_key_alpha_secure';

    it('generates and verifies HMAC-SHA256 signature with constant-time comparison', () => {
      const payload = JSON.stringify({ event: 'subscription.updated', userId: 'user_123' });
      const signature = WebhookSecurityUtil.generateSignature(payload, secret);

      const isValid = WebhookSecurityUtil.verifySignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('rejects tampered webhook payloads or signatures', () => {
      const payload = JSON.stringify({ event: 'payment.completed', amount: 5000 });
      const signature = WebhookSecurityUtil.generateSignature(payload, secret);

      // Tampered payload
      const tamperedPayload = JSON.stringify({ event: 'payment.completed', amount: 0 });
      const isValid = WebhookSecurityUtil.verifySignature(tamperedPayload, signature, secret);
      expect(isValid).toBe(false);
    });

    it('rejects replay attacks with timestamp older than 300 seconds', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 350; // 350 seconds ago (> 5 minutes)
      const isFresh = WebhookSecurityUtil.verifyTimestampFreshness(oldTimestamp, 300);
      expect(isFresh).toBe(false);

      const currentTimestamp = Math.floor(Date.now() / 1000) - 10;
      const isCurrentFresh = WebhookSecurityUtil.verifyTimestampFreshness(currentTimestamp, 300);
      expect(isCurrentFresh).toBe(true);
    });
  });

  describe('6. Notification Privacy & Biometric Lock-Screen Redaction', () => {
    it('detects sensitive biometric metrics in notification content', () => {
      expect(NotificationPrivacyUtil.containsSensitiveTelemetry('Heart rate 142 bpm')).toBe(true);
      expect(NotificationPrivacyUtil.containsSensitiveTelemetry('Body fat is 12.4%')).toBe(true);
      expect(NotificationPrivacyUtil.containsSensitiveTelemetry('Weight: 78.5 kg recorded')).toBe(true);
      expect(NotificationPrivacyUtil.containsSensitiveTelemetry('Great job completing workout!')).toBe(false);
    });

    it('redacts sensitive biometric and health metrics from lock-screen notifications by default', () => {
      const sensitiveBody = 'Today morning: Heart Rate 142 bpm, Body Fat 12.4%, Weight 78.5 kg recorded.';
      const sanitized = NotificationPrivacyUtil.sanitizeForLockScreen(
        'Morning Biometric Check-in',
        sensitiveBody,
        false,
      );

      expect(sanitized.title).toBe('Morning Biometric Check-in');
      expect(sanitized.body).not.toContain('142 bpm');
      expect(sanitized.body).not.toContain('12.4%');
      expect(sanitized.body).not.toContain('78.5 kg');
      expect(sanitized.body).toContain('heart rate telemetry recorded');
      expect(sanitized.body).toContain('body composition updated');
      expect(sanitized.body).toContain('weight log recorded');
    });

    it('preserves non-sensitive notification content on lock-screen', () => {
      const standardBody = 'Great job completing your workout session today!';
      const sanitized = NotificationPrivacyUtil.sanitizeForLockScreen(
        'Workout Completed',
        standardBody,
        false,
      );

      expect(sanitized.body).toBe(standardBody);
    });

    it('allows full preview when user has explicitly enabled sensitive previews', () => {
      const sensitiveBody = 'Heart Rate reached 165 bpm during interval sprint.';
      const sanitized = NotificationPrivacyUtil.sanitizeForLockScreen(
        'Heart Rate Alert',
        sensitiveBody,
        true,
      );

      expect(sanitized.body).toBe(sensitiveBody);
    });
  });
});
