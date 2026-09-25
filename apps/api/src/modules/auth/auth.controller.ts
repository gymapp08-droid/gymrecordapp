import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Headers,
  Req,
  Res,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
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
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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

  @Get('google')
  async googleRedirect(@Res() res: Response) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri =
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      'https://gymrecordapp.onrender.com/api/v1/auth/google/callback';

    if (!clientId) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Google Sign-In is not configured on this server (missing GOOGLE_CLIENT_ID).');
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;

    return res.redirect(googleAuthUrl);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error || !code) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(`Authentication cancelled or failed: ${error || 'Missing authorization code'}`);
    }

    try {
      const result = await this.authService.handleGoogleOAuthCallback(code);
      const { user, tokens } = result;

      const mobileDeepLink = `alpha://auth/callback?token=${encodeURIComponent(
        tokens.accessToken,
      )}&refreshToken=${encodeURIComponent(tokens.refreshToken)}&user=${encodeURIComponent(
        JSON.stringify(user),
      )}`;

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ALPHA OS Authentication</title>
          <style>
            * { box-sizing: border-box; }
            body {
              background: #05070B;
              color: #FFFFFF;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 24px;
              text-align: center;
            }
            .card {
              background: rgba(15, 23, 42, 0.75);
              border: 1px solid rgba(0, 240, 255, 0.25);
              border-radius: 20px;
              padding: 36px 28px;
              max-width: 420px;
              width: 100%;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.1);
            }
            .badge {
              display: inline-block;
              background: rgba(0, 240, 255, 0.12);
              border: 1px solid #00F0FF;
              color: #00F0FF;
              padding: 6px 14px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 22px;
              margin: 0 0 12px;
              font-weight: 800;
              letter-spacing: 0.5px;
            }
            p {
              color: #94A3B8;
              font-size: 14px;
              line-height: 1.5;
              margin: 0 0 28px;
            }
            .btn {
              display: block;
              background: #00F0FF;
              color: #05070B;
              text-decoration: none;
              padding: 14px 24px;
              border-radius: 12px;
              font-weight: 800;
              font-size: 15px;
              letter-spacing: 0.5px;
              box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);
              transition: transform 0.15s, opacity 0.15s;
            }
            .btn:active {
              transform: scale(0.98);
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">ALPHA OS CONNECTED</div>
            <h1>Welcome, ${user.fullName || 'Athlete'}</h1>
            <p>Authentication successful! Redirecting you into your ALPHA training app...</p>
            <a class="btn" href="${mobileDeepLink}">Open ALPHA App</a>
          </div>
          <script>
            window.location.href = "${mobileDeepLink}";
          </script>
        </body>
        </html>
      `;

      return res.status(HttpStatus.OK).header('Content-Type', 'text/html').send(html);
    } catch (err: any) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Authentication error: ${err?.message || 'Internal error'}`);
    }
  }
}
