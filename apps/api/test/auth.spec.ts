import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '@alpha/types';

describe('AuthService (Authentication Unit Tests)', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({
          secret: 'test_jwt_secret_min_32_characters_long_key',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [AuthService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authService.clearUsers();
  });

  it('should register a new athlete with hashed password and return valid tokens', async () => {
    const result = await authService.register({
      email: 'athlete@alpha.os',
      password: 'StrongPassword123!',
      fullName: 'Alex Stone',
      role: UserRole.ATHLETE,
    });

    expect(result).toBeDefined();
    expect(result.user.email).toBe('athlete@alpha.os');
    expect(result.user.role).toBe(UserRole.ATHLETE);
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.tokens.tokenType).toBe('Bearer');
  });

  it('should reject duplicate email registration with ConflictException', async () => {
    await authService.register({
      email: 'dup@alpha.os',
      password: 'Password123!',
      fullName: 'First Register',
    });

    await expect(
      authService.register({
        email: 'dup@alpha.os',
        password: 'Password123!',
        fullName: 'Second Register',
      }),
    ).rejects.toThrow();
  });

  it('should authenticate user with valid credentials', async () => {
    await authService.register({
      email: 'login@alpha.os',
      password: 'Password123!',
      fullName: 'Login Tester',
    });

    const loginRes = await authService.login({
      email: 'login@alpha.os',
      password: 'Password123!',
    });

    expect(loginRes.tokens.accessToken).toBeDefined();
    expect(loginRes.user.email).toBe('login@alpha.os');
  });

  it('should reject login with wrong password', async () => {
    await authService.register({
      email: 'wrongpw@alpha.os',
      password: 'CorrectPassword123!',
      fullName: 'Wrong PW Tester',
    });

    await expect(
      authService.login({
        email: 'wrongpw@alpha.os',
        password: 'IncorrectPassword!',
      }),
    ).rejects.toThrow();
  });
});
