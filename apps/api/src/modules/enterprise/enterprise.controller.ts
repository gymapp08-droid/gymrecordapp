import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser, IEnterpriseOrgSettings } from '@alpha/types';
import { UpdateOrgSettingsDto } from '@alpha/validation';
import { EnterpriseService } from './enterprise.service';
import { RbacUtil } from '@alpha/utils';

@Controller('enterprise/organizations')
@UseGuards(JwtAuthGuard)
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Get(':orgId/settings')
  async getSettings(
    @Param('orgId') orgId: string,
    @CurrentUser() user: IAuthUser,
  ): Promise<IEnterpriseOrgSettings> {
    if (!RbacUtil.canAccessTenant(user.organizationId, orgId, user.role)) {
      throw new ForbiddenException({
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'You do not have access to this enterprise organization',
      });
    }

    return this.enterpriseService.getOrgSettings(orgId);
  }

  @Put(':orgId/settings')
  async updateSettings(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOrgSettingsDto,
    @CurrentUser() user: IAuthUser,
  ): Promise<IEnterpriseOrgSettings> {
    if (!RbacUtil.canAccessTenant(user.organizationId, orgId, user.role)) {
      throw new ForbiddenException({
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'You do not have access to this enterprise organization',
      });
    }

    return this.enterpriseService.updateOrgSettings(orgId, dto, user.role);
  }

  @Get(':orgId/seats')
  async getSeatStatus(
    @Param('orgId') orgId: string,
    @CurrentUser() user: IAuthUser,
  ) {
    if (!RbacUtil.canAccessTenant(user.organizationId, orgId, user.role)) {
      throw new ForbiddenException({
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'You do not have access to this enterprise organization',
      });
    }

    return this.enterpriseService.checkSeatAvailability(orgId);
  }
}
