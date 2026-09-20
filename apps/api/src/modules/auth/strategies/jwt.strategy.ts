import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { IJwtPayload, IAuthUser, AccountStatus } from '@alpha/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'alpha_dev_access_secret_change_in_production_min_32_chars',
    });
  }

  async validate(payload: IJwtPayload): Promise<IAuthUser> {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN_PAYLOAD',
        message: 'JWT token payload is malformed or invalid',
      });
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: payload.orgId,
    };
  }
}
