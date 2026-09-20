import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';

@Controller('portal')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly portalService: PortalService) {}

  @Get('audit-logs')
  async getAuditLogs(
    @CurrentUser() user: IAuthUser,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
  ) {
    return this.portalService.getAuditLogs(user.id, {
      action,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
