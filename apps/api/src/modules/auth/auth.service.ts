import {
  Injectable,
  OnModuleInit,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { HashUtil } from '@alpha/utils';
import {
  AccountStatus,
  IAuthTokens,
  IAuthUser,
  SocialProvider,
  UserRole,
} from '@alpha/types';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RegisterDto,
  ResetPasswordDto,
  SocialAuthDto,
  VerifyEmailDto,
} from '@alpha/validation';

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface StoredVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface StoredSession {
  id: string;
  userId: string;
  deviceId?: string;
  platform: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: Date;
  createdAt: Date;
  refreshTokenHash: string;
}

export interface SanitizedSession {
  id: string;
  userId: string;
  deviceId?: string;
  platform: string;
  ipAddress?: string;
  userAgent?: string;
  lastActiveAt: Date;
  createdAt: Date;
}

export interface FailedAttemptRecord {
  count: number;
  lockedUntil?: Date;
  firstAttemptAt: Date;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  // In-memory backing stores for testing and fallback execution
  private readonly inMemoryUsers = new Map<string, StoredUser>();
  private readonly passwordResetTokens = new Map<string, StoredResetToken>();
  private readonly emailVerificationTokens = new Map<string, StoredVerificationToken>();
  private readonly revokedTokenHashes = new Set<string>();
  private readonly failedAttempts = new Map<string, FailedAttemptRecord>();
  private readonly activeSessions = new Map<string, StoredSession>();

  public static readonly MAX_FAILED_ATTEMPTS = 5;
  public static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdminUsers();
  }

  private async seedDefaultAdminUsers() {
    const adminEmail = (this.configService.get<string>('ADMIN_EMAIL') || 'admin@alpha.io').toLowerCase().trim();
    const coachEmail = (this.configService.get<string>('COACH_EMAIL') || 'coach@alpha.io').toLowerCase().trim();

    if (!this.inMemoryUsers.has(adminEmail)) {
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD') || 'Admin@Alpha2026!';
      const passwordHash = await HashUtil.hashPassword(adminPassword);
      this.inMemoryUsers.set(adminEmail, {
        id: 'user_master_admin',
        email: adminEmail,
        passwordHash,
        fullName: 'Master Administrator',
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      this.logger.log(`Initialized default enterprise administrator account: [${adminEmail}]`);
    }

    if (!this.inMemoryUsers.has(coachEmail)) {
      const coachPassword = this.configService.get<string>('COACH_PASSWORD') || 'Coach@Alpha2026!';
      const passwordHash = await HashUtil.hashPassword(coachPassword);
      this.inMemoryUsers.set(coachEmail, {
        id: 'user_lead_coach',
        email: coachEmail,
        passwordHash,
        fullName: 'Lead Performance Coach',
        role: UserRole.COACH,
        status: AccountStatus.ACTIVE,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      this.logger.log(`Initialized default coach account: [${coachEmail}]`);
    }
  }

  /**
   * Account Registration
   */
  async register(dto: RegisterDto): Promise<{ user: IAuthUser; tokens: IAuthTokens; verificationToken?: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    if (!normalizedEmail.endsWith('@gmail.com') && !normalizedEmail.endsWith('@googlemail.com') && !normalizedEmail.endsWith('@alpha.io')) {
      throw new BadRequestException({
        code: 'INVALID_EMAIL_DOMAIN',
        message: 'Only verified Google accounts (@gmail.com) are permitted for athlete registration.',
      });
    }

    if (this.inMemoryUsers.has(normalizedEmail)) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      });
    }

    const userId = HashUtil.generateUuid();
    const passwordHash = await HashUtil.hashPassword(dto.password);

    const newUser: StoredUser = {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role || UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isActive: true,
      isEmailVerified: false,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.inMemoryUsers.set(normalizedEmail, newUser);
    this.logger.log(`Registered user [${userId}] ${normalizedEmail}`);

    // Create verification token
    const rawVerificationToken = HashUtil.generateSecureToken(32);
    const tokenHash = this.sha256(rawVerificationToken);
    this.emailVerificationTokens.set(tokenHash, {
      id: HashUtil.generateUuid(),
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000), // 24h
      createdAt: new Date(),
    });

    const authUser: IAuthUser = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      status: newUser.status,
      isEmailVerified: newUser.isEmailVerified,
    };

    const sessionId = HashUtil.generateUuid();
    const tokens = await this.generateTokens(authUser, sessionId);
    const refreshTokenHash = this.sha256(tokens.refreshToken);

    this.activeSessions.set(sessionId, {
      id: sessionId,
      userId,
      platform: 'web',
      lastActiveAt: new Date(),
      createdAt: new Date(),
      refreshTokenHash,
    });

    return {
      user: authUser,
      tokens,
      verificationToken: rawVerificationToken,
    };
  }

  /**
   * Account Login with Account Lockout Protection & Session Tracking
   */
  async login(
    dto: LoginDto,
    meta?: { deviceId?: string; platform?: string; ipAddress?: string; userAgent?: string },
  ): Promise<{ user: IAuthUser; tokens: IAuthTokens; session?: SanitizedSession }> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check account lockout
    const attempt = this.failedAttempts.get(normalizedEmail);
    if (attempt?.lockedUntil) {
      if (attempt.lockedUntil.getTime() > Date.now()) {
        const remainingMs = attempt.lockedUntil.getTime() - Date.now();
        const remainingMin = Math.max(1, Math.ceil(remainingMs / 60000));
        throw new ForbiddenException({
          code: 'ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to 5 consecutive failed login attempts. Try again in ${remainingMin} minutes.`,
          lockedUntil: attempt.lockedUntil.toISOString(),
        });
      } else {
        this.failedAttempts.delete(normalizedEmail);
      }
    }

    const user = this.inMemoryUsers.get(normalizedEmail);

    if (!user) {
      this.recordFailedAttempt(normalizedEmail);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Account Lifecycle Checks
    if (user.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    if (user.status === AccountStatus.DELETED || !user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_DELETED',
        message: 'This account has been deleted or deactivated.',
      });
    }

    const isMatch = await HashUtil.verifyPassword(dto.password, user.passwordHash);
    if (!isMatch) {
      const currentCount = this.recordFailedAttempt(normalizedEmail);
      if (currentCount >= AuthService.MAX_FAILED_ATTEMPTS) {
        throw new ForbiddenException({
          code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to 5 consecutive failed login attempts. Try again in 15 minutes.',
        });
      }
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Successful login - clear failed attempts
    this.failedAttempts.delete(normalizedEmail);
    user.lastLoginAt = new Date();

    const authUser: IAuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
    };

    const sessionId = HashUtil.generateUuid();
    const tokens = await this.generateTokens(authUser, sessionId);
    const refreshTokenHash = this.sha256(tokens.refreshToken);

    const session: StoredSession = {
      id: sessionId,
      userId: user.id,
      deviceId: meta?.deviceId,
      platform: meta?.platform || 'web',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      refreshTokenHash,
    };
    this.activeSessions.set(sessionId, session);

    const sanitizedSession: SanitizedSession = {
      id: session.id,
      userId: session.userId,
      deviceId: session.deviceId,
      platform: session.platform,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastActiveAt: session.lastActiveAt,
      createdAt: session.createdAt,
    };

    return { user: authUser, tokens, session: sanitizedSession };
  }

  /**
   * Session Restoration / Token Refresh with Active Session Touch
   */
  async refresh(refreshToken: string): Promise<IAuthTokens> {
    const tokenHash = this.sha256(refreshToken);

    // Check if session has been revoked
    if (this.revokedTokenHashes.has(tokenHash)) {
      throw new UnauthorizedException({
        code: 'SESSION_REVOKED',
        message: 'Session token has been revoked. Please log in again.',
      });
    }

    try {
      const secret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'alpha_dev_refresh_secret_change_in_production_min_32_chars';
      const payload = this.jwtService.verify(refreshToken, { secret });

      const user = Array.from(this.inMemoryUsers.values()).find((u) => u.id === payload.sub);
      if (!user || user.status === AccountStatus.SUSPENDED || user.status === AccountStatus.DELETED) {
        throw new UnauthorizedException({
          code: 'USER_INACTIVE',
          message: 'User account is not in an active state',
        });
      }

      const authUser: IAuthUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        organizationId: payload.orgId,
      };

      // Revoke old refresh token (token rotation)
      this.revokedTokenHashes.add(tokenHash);

      // Locate active session
      let existingSession: StoredSession | undefined;
      for (const s of this.activeSessions.values()) {
        if (s.refreshTokenHash === tokenHash) {
          existingSession = s;
          break;
        }
      }

      // Generate fresh token pair
      const newTokens = await this.generateTokens(authUser, existingSession?.id);
      const newHash = this.sha256(newTokens.refreshToken);

      if (existingSession) {
        existingSession.refreshTokenHash = newHash;
        existingSession.lastActiveAt = new Date();
      }

      return newTokens;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is expired, malformed, or invalid',
      });
    }
  }

  /**
   * Session Invalidation / Logout
   */
  async logout(dto: LogoutDto, userId: string): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.sha256(dto.refreshToken);
    this.revokedTokenHashes.add(tokenHash);

    // Remove active session
    for (const [id, s] of this.activeSessions.entries()) {
      if (s.refreshTokenHash === tokenHash && s.userId === userId) {
        this.activeSessions.delete(id);
        break;
      }
    }

    this.logger.log(`Session revoked for user [${userId}]`);
    return { success: true, message: 'Successfully logged out' };
  }

  /**
   * Password Recovery Request
   * Returns a generic message to prevent account enumeration
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string; debugResetToken?: string }> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = this.inMemoryUsers.get(normalizedEmail);

    const genericResponse = {
      success: true,
      message: 'If an account exists with this email, password recovery instructions have been sent.',
    };

    if (!user || user.status === AccountStatus.DELETED) {
      return genericResponse;
    }

    const rawToken = HashUtil.generateSecureToken(32);
    const tokenHash = this.sha256(rawToken);

    this.passwordResetTokens.set(tokenHash, {
      id: HashUtil.generateUuid(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour TTL
      createdAt: new Date(),
    });

    this.logger.log(`Password reset requested for user [${user.id}]`);

    return {
      ...genericResponse,
      debugResetToken: rawToken,
    };
  }

  /**
   * Password Reset Confirmation
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.sha256(dto.token);
    const record = this.passwordResetTokens.get(tokenHash);

    if (!record) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'Invalid or expired password reset token',
      });
    }

    if (record.usedAt) {
      throw new BadRequestException({
        code: 'TOKEN_ALREADY_USED',
        message: 'This password reset token has already been used',
      });
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'TOKEN_EXPIRED',
        message: 'This password reset token has expired',
      });
    }

    const user = Array.from(this.inMemoryUsers.values()).find((u) => u.id === record.userId);
    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: 'Associated user account not found',
      });
    }

    user.passwordHash = await HashUtil.hashPassword(dto.newPassword);
    user.updatedAt = new Date();
    record.usedAt = new Date();

    this.logger.log(`Password successfully reset for user [${user.id}]`);
    return { success: true, message: 'Password has been successfully updated. Please log in.' };
  }

  /**
   * Email Verification Confirmation
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.sha256(dto.token);
    const record = this.emailVerificationTokens.get(tokenHash);

    if (!record) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'Invalid or expired verification token',
      });
    }

    if (record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'TOKEN_EXPIRED',
        message: 'Verification token is expired or has already been used',
      });
    }

    const user = Array.from(this.inMemoryUsers.values()).find((u) => u.id === record.userId);
    if (user) {
      user.isEmailVerified = true;
      user.updatedAt = new Date();
    }

    record.usedAt = new Date();
    return { success: true, message: 'Email address has been successfully verified' };
  }

  /**
   * Social Authentication Abstraction (Google / Apple)
   */
  async socialAuth(dto: SocialAuthDto): Promise<{ user: IAuthUser; tokens: IAuthTokens }> {
    const isAppleConfigured = !!this.configService.get('APPLE_SERVICE_ID');

    const rawToken = dto.idToken || dto.token;
    if (!rawToken) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Identity token is required for social authentication.',
      });
    }

    if (dto.provider === SocialProvider.GOOGLE) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(rawToken)}`);
        if (!verifyRes.ok) {
          throw new UnauthorizedException({
            code: 'INVALID_GOOGLE_TOKEN',
            message: 'Failed to verify Google identity token with Google OAuth servers.',
          });
        }

        const payload = (await verifyRes.json()) as {
          email?: string;
          name?: string;
          given_name?: string;
          email_verified?: string | boolean;
        };

        const email = (payload.email || '').toLowerCase().trim();
        const fullName = payload.name || payload.given_name || 'Athlete';

        if (!email) {
          throw new BadRequestException({
            code: 'NO_EMAIL',
            message: 'Google identity token does not contain a verified email address.',
          });
        }

        let user = this.inMemoryUsers.get(email);
        if (!user) {
          const userId = HashUtil.generateUuid();
          user = {
            id: userId,
            email,
            passwordHash: '',
            fullName,
            role: UserRole.ATHLETE,
            status: AccountStatus.ACTIVE,
            isActive: true,
            isEmailVerified: true,
            lastLoginAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          this.inMemoryUsers.set(email, user);
          this.logger.log(`Created new Google athlete profile: [${userId}] ${email}`);
        } else {
          user.lastLoginAt = new Date();
          if (!user.fullName || user.fullName === 'Athlete') {
            user.fullName = fullName;
          }
        }

        const authUser: IAuthUser = {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
        };

        const sessionId = HashUtil.generateUuid();
        const tokens = await this.generateTokens(authUser, sessionId);
        const refreshTokenHash = this.sha256(tokens.refreshToken);

        this.activeSessions.set(sessionId, {
          id: sessionId,
          userId: user.id,
          platform: 'google_token',
          lastActiveAt: new Date(),
          createdAt: new Date(),
          refreshTokenHash,
        });

        return { user: authUser, tokens };
      } catch (err: any) {
        if (err instanceof BadRequestException || err instanceof UnauthorizedException) {
          throw err;
        }
        this.logger.error(`Google token verification error: ${err?.message || err}`);
        throw new BadRequestException({
          code: 'GOOGLE_AUTH_FAILED',
          message: err?.message || 'Google token validation failed',
        });
      }
    }

    if (dto.provider === SocialProvider.APPLE && !isAppleConfigured) {
      throw new BadRequestException({
        code: 'PROVIDER_NOT_CONFIGURED',
        message: 'Apple Sign-In is not configured in this environment.',
      });
    }

    throw new BadRequestException({
      code: 'PROVIDER_ERROR',
      message: `Failed to verify token with ${dto.provider}`,
    });
  }

  /**
   * Handle Google OAuth Web / Mobile Authorization Code Exchange
   */
  async handleGoogleOAuthCallback(code: string): Promise<{ user: IAuthUser; tokens: IAuthTokens }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri =
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      'https://gymrecordapp.onrender.com/api/v1/auth/google/callback';

    if (!clientId || !clientSecret) {
      this.logger.error('Google OAuth credentials not configured on server (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)');
      throw new BadRequestException('Google Sign-In is not configured on the server');
    }

    // 1. Exchange authorization code with Google for tokens
    const bodyParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      this.logger.error(`Google token exchange failed: ${errText}`);
      throw new BadRequestException('Failed to exchange authorization code with Google');
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string; id_token?: string };
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new BadRequestException('Google did not return an access token');
    }

    // 2. Fetch user profile from Google UserInfo endpoint
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      throw new BadRequestException('Failed to retrieve user profile from Google');
    }

    const profile = (await profileRes.json()) as {
      email?: string;
      name?: string;
      given_name?: string;
    };
    const email = (profile.email || '').toLowerCase().trim();
    const fullName = profile.name || profile.given_name || 'Athlete';

    if (!email) {
      throw new BadRequestException('Google account has no associated email address');
    }

    // 3. Find or register user
    let user = this.inMemoryUsers.get(email);
    if (!user) {
      const userId = HashUtil.generateUuid();
      user = {
        id: userId,
        email,
        passwordHash: '',
        fullName,
        role: UserRole.ATHLETE,
        status: AccountStatus.ACTIVE,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.inMemoryUsers.set(email, user);
      this.logger.log(`Created new Google athlete profile: [${userId}] ${email}`);
    } else {
      user.lastLoginAt = new Date();
      if (!user.fullName || user.fullName === 'Athlete') {
        user.fullName = fullName;
      }
    }

    const authUser: IAuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
    };

    const sessionId = HashUtil.generateUuid();
    const tokens = await this.generateTokens(authUser, sessionId);
    const refreshTokenHash = this.sha256(tokens.refreshToken);

    this.activeSessions.set(sessionId, {
      id: sessionId,
      userId: user.id,
      platform: 'google_oauth_redirect',
      lastActiveAt: new Date(),
      createdAt: new Date(),
      refreshTokenHash,
    });

    return { user: authUser, tokens };
  }

  async getActiveSessions(userId: string): Promise<SanitizedSession[]> {
    return Array.from(this.activeSessions.values())
      .filter((s) => s.userId === userId)
      .map(({ refreshTokenHash: _, ...rest }) => rest)
      .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
  }

  async revokeSession(userId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new BadRequestException({
        code: 'SESSION_NOT_FOUND',
        message: 'Active session not found or does not belong to user',
      });
    }

    this.revokedTokenHashes.add(session.refreshTokenHash);
    this.activeSessions.delete(sessionId);
    this.logger.log(`Session [${sessionId}] revoked by user [${userId}]`);
    return { success: true, message: 'Session successfully revoked' };
  }

  async revokeAllOtherSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<{ success: boolean; revokedCount: number }> {
    let count = 0;
    for (const [id, session] of this.activeSessions.entries()) {
      if (session.userId === userId && id !== currentSessionId) {
        this.revokedTokenHashes.add(session.refreshTokenHash);
        this.activeSessions.delete(id);
        count++;
      }
    }
    this.logger.log(`Revoked ${count} other sessions for user [${userId}]`);
    return { success: true, revokedCount: count };
  }

  private recordFailedAttempt(email: string): number {
    const now = new Date();
    const record = this.failedAttempts.get(email) || { count: 0, firstAttemptAt: now };
    record.count += 1;
    if (record.count >= AuthService.MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = new Date(Date.now() + AuthService.LOCKOUT_DURATION_MS);
      this.logger.warn(`Account locked for email [${email}] after ${record.count} consecutive failed attempts`);
    }
    this.failedAttempts.set(email, record);
    return record.count;
  }

  private sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async generateTokens(user: IAuthUser, sessionId?: string): Promise<IAuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.organizationId,
      sessionId,
    };

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'alpha_dev_access_secret_change_in_production_min_32_chars';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'alpha_dev_refresh_secret_change_in_production_min_32_chars';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, jti: HashUtil.generateUuid() },
        {
          secret: accessSecret,
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { ...payload, jti: HashUtil.generateUuid() },
        {
          secret: refreshSecret,
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }

  // Testing helpers
  public seedUser(user: StoredUser) {
    this.inMemoryUsers.set(user.email.toLowerCase().trim(), user);
  }

  public clearUsers() {
    this.inMemoryUsers.clear();
    this.passwordResetTokens.clear();
    this.emailVerificationTokens.clear();
    this.revokedTokenHashes.clear();
    this.failedAttempts.clear();
    this.activeSessions.clear();
  }
}
