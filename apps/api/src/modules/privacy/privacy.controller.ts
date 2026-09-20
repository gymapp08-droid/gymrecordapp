import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  IAuthUser,
  IDataPortabilityBundle,
  IAnonymizationResult,
  IUserConsentPreferences,
  IConsentStatus,
  IConsentRecord,
  ISecurityAuditEvent,
} from '@alpha/types';
import {
  UpdateConsentPreferencesDto,
  AnonymizeUserRequestDto,
  GrantConsentDto,
  WithdrawConsentDto,
} from '@alpha/validation';
import { PrivacyService } from './privacy.service';
import { AuditVerificationResult } from '@alpha/utils';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('export')
  async exportData(@CurrentUser() user: IAuthUser): Promise<IDataPortabilityBundle> {
    return this.privacyService.generateDataPortabilityBundle(user.id);
  }

  @Post('anonymize')
  async anonymizeAccount(
    @CurrentUser() user: IAuthUser,
    @Body() dto: AnonymizeUserRequestDto,
  ): Promise<IAnonymizationResult> {
    return this.privacyService.anonymizeUserData(user.id, dto.confirmPhrase, dto.reason);
  }

  @Get('consent')
  async getConsent(@CurrentUser() user: IAuthUser): Promise<IUserConsentPreferences> {
    return this.privacyService.getConsent(user.id);
  }

  @Put('consent')
  async updateConsent(
    @CurrentUser() user: IAuthUser,
    @Body() dto: UpdateConsentPreferencesDto,
  ): Promise<IUserConsentPreferences> {
    return this.privacyService.updateConsent(user.id, dto);
  }

  @Get('consent/status')
  async getConsentStatus(@CurrentUser() user: IAuthUser): Promise<IConsentStatus> {
    return this.privacyService.getConsentStatus(user.id);
  }

  @Post('consent/grant')
  async grantConsent(
    @CurrentUser() user: IAuthUser,
    @Body() dto: GrantConsentDto,
    @Req() req?: Request,
  ): Promise<IConsentRecord> {
    const ip = req?.ip || (req?.headers?.['x-forwarded-for'] as string);
    const userAgent = req?.headers?.['user-agent'] as string;
    return this.privacyService.grantConsent(user.id, dto, { ipAddress: ip, userAgent });
  }

  @Post('consent/withdraw')
  async withdrawConsent(
    @CurrentUser() user: IAuthUser,
    @Body() dto: WithdrawConsentDto,
    @Req() req?: Request,
  ): Promise<IConsentRecord> {
    const ip = req?.ip || (req?.headers?.['x-forwarded-for'] as string);
    const userAgent = req?.headers?.['user-agent'] as string;
    return this.privacyService.withdrawConsent(user.id, dto, { ipAddress: ip, userAgent });
  }

  @Get('access-log')
  async getHealthAccessLog(@CurrentUser() user: IAuthUser): Promise<ISecurityAuditEvent[]> {
    return this.privacyService.getHealthDataAccessLog(user.id);
  }

  @Get('audit-trail')
  async getAuditTrail(@CurrentUser() user: IAuthUser): Promise<ISecurityAuditEvent[]> {
    return this.privacyService.getAuditTrail(user.id);
  }

  @Get('audit-trail/verify')
  async verifyAuditChain(): Promise<AuditVerificationResult> {
    return this.privacyService.verifyAuditLogIntegrity();
  }
}
