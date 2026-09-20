import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { KpiCatalogService } from '../services/kpi-catalog.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { KPICategory } from '@alpha/types';

@Controller('kpis')
@UseGuards(JwtAuthGuard)
export class KpisController {
  constructor(private readonly catalogService: KpiCatalogService) {}

  @Get()
  async getAllKpis(@Query('category') category?: KPICategory) {
    const kpis = this.catalogService.getAllDefinitions(category);
    return {
      count: kpis.length,
      kpis,
    };
  }

  @Get(':code')
  async getKpiByCode(@Param('code') code: string) {
    return this.catalogService.getDefinition(code);
  }
}
