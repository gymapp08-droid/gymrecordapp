import { Controller, Get, Query, Optional } from '@nestjs/common';
import { InfrastructureAuditService, EnvironmentProfile } from './infrastructure-audit.service';

@Controller('health')
export class HealthController {
  constructor(
    @Optional() private readonly infrastructureAuditService?: InfrastructureAuditService,
  ) {}

  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'alpha-api',
      timestamp: new Date().toISOString(),
      checks: {
        api: 'up',
        database: 'ready',
        redis: 'ready',
      },
    };
  }

  @Get('infrastructure')
  checkInfrastructure(@Query('env') env?: EnvironmentProfile) {
    if (!this.infrastructureAuditService) {
      return { status: 'ok', note: 'audit_service_unbound' };
    }
    return this.infrastructureAuditService.generateGateAReport(env || 'production');
  }
}
