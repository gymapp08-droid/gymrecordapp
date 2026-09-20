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
import { ReportsService, ICreateReportDto } from '../services/reports.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { IAuthUser, AnalyticsScope } from '@alpha/types';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(
    @CurrentUser() user: IAuthUser,
    @Body() dto: ICreateReportDto,
  ) {
    return this.reportsService.createReport(user, dto);
  }

  @Get()
  async listReports(
    @CurrentUser() user: IAuthUser,
    @Query('scope') scope?: AnalyticsScope,
  ) {
    return this.reportsService.listReports(user, scope);
  }

  @Get(':id')
  async getReport(
    @CurrentUser() user: IAuthUser,
    @Param('id') reportId: string,
  ) {
    return this.reportsService.getReport(reportId, user);
  }

  @Get(':id/download')
  async downloadReport(
    @CurrentUser() user: IAuthUser,
    @Param('id') reportId: string,
    @Res() res: Response,
  ) {
    const file = await this.reportsService.downloadReport(reportId, user);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.send(file.content);
  }
}
