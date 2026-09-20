import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { InfrastructureAuditService } from './infrastructure-audit.service';

@Module({
  controllers: [HealthController],
  providers: [InfrastructureAuditService],
  exports: [InfrastructureAuditService],
})
export class HealthModule {}
