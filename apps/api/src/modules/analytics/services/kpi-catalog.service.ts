import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { KPI_CATALOG } from '../constants/kpi-catalog';
import { IKPIDefinition, KPICategory } from '@alpha/types';

@Injectable()
export class KpiCatalogService {
  private readonly logger = new Logger(KpiCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all defined KPIs from the centralized catalog
   */
  getAllDefinitions(category?: KPICategory): IKPIDefinition[] {
    const list = Object.values(KPI_CATALOG);
    if (category) {
      return list.filter((kpi) => kpi.category === category);
    }
    return list;
  }

  /**
   * Retrieves a specific KPI definition by its unique code
   */
  getDefinition(code: string): IKPIDefinition {
    const def = KPI_CATALOG[code.toUpperCase()];
    if (!def) {
      throw new NotFoundException(`KPI definition with code [${code}] not found in catalog`);
    }
    return def;
  }

  /**
   * Verifies KPI version compatibility
   */
  verifyVersion(code: string, expectedVersion: number): boolean {
    const def = this.getDefinition(code);
    return def.version === expectedVersion;
  }

  /**
   * Synchronizes the in-memory catalog definitions into the authoritative database table
   */
  async syncCatalogToDatabase(): Promise<number> {
    let syncedCount = 0;
    for (const kpi of Object.values(KPI_CATALOG)) {
      await this.prisma.kPIDefinition.upsert({
        where: { code: kpi.code },
        create: {
          code: kpi.code,
          name: kpi.name,
          category: kpi.category,
          description: kpi.description,
          calculationFormula: kpi.calculationFormula,
          unit: kpi.unit,
          version: kpi.version,
          isActive: kpi.isActive,
          metadata: {
            qualifyingCriteria: kpi.qualifyingCriteria,
            sourceTables: kpi.sourceTables,
          },
        },
        update: {
          name: kpi.name,
          category: kpi.category,
          description: kpi.description,
          calculationFormula: kpi.calculationFormula,
          unit: kpi.unit,
          version: kpi.version,
          isActive: kpi.isActive,
          metadata: {
            qualifyingCriteria: kpi.qualifyingCriteria,
            sourceTables: kpi.sourceTables,
          },
        },
      });
      syncedCount++;
    }
    this.logger.log(`Synchronized ${syncedCount} KPI definitions to database.`);
    return syncedCount;
  }
}
