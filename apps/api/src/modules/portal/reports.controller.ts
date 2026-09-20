import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IAuthUser } from '@alpha/types';
import { GenerateReportDto } from '@alpha/validation';

@Controller('portal/reports')
@UseGuards(JwtAuthGuard)
export class PortalReportsController {
  constructor(private readonly portalService: PortalService) {}

  @Post('generate')
  async generateReport(
    @CurrentUser() user: IAuthUser,
    @Body() dto: GenerateReportDto,
  ) {
    return this.portalService.generateReport(user.id, user.role, dto, user.organizationId);
  }

  @Get(':id/export')
  async exportReport(
    @CurrentUser() user: IAuthUser,
    @Param('id') reportId: string,
    @Query('format') format: 'CSV' | 'JSON' = 'CSV',
    @Res() res: Response,
  ) {
    const result = await this.portalService.exportReport(
      user.id,
      user.role,
      reportId,
      format,
      user.organizationId,
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.content);
  }
}
