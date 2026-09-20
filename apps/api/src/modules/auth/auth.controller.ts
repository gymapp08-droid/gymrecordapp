import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Headers,
  Req,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RegisterDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SocialAuthDto,
  VerifyEmailDto,
} from '@alpha/validation';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req?: Request,
    @Headers('x-device-id') deviceId?: string,
    @Headers('x-platform') platform?: string,
  ) {
    const ip = req?.ip || (req?.headers?.['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = (req?.headers?.['user-agent'] as string) || 'Alpha App';
    return this.authService.login(dto, {
      deviceId,
      platform: platform || 'web',
      ipAddress: ip,
      userAgent,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Body() dto: LogoutDto, @CurrentUser() user: IAuthUser) {
    return this.authService.logout(dto, user.id);
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: IAuthUser) {
    return this.authService.getActiveSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: IAuthUser,
  ) {
    return this.authService.revokeSession(user.id, sessionId);
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async revokeAllOtherSessions(
    @CurrentUser() user: IAuthUser,
    @Headers('x-session-id') currentSessionId?: string,
  ) {
    return this.authService.revokeAllOtherSessions(user.id, currentSessionId);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('social')
  @HttpCode(HttpStatus.OK)
  async socialAuth(@Body() dto: SocialAuthDto) {
    return this.authService.socialAuth(dto);
  }
}
