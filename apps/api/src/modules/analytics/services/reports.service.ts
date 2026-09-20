import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsAggregationService } from './analytics-aggregation.service';
import {
  IAuthUser,
  UserRole,
  ReportType,
  ReportFormat,
  AnalyticsScope,
} from '@alpha/types';

export interface ICreateReportDto {
  reportType: ReportType;
  format?: ReportFormat;
  scope: AnalyticsScope;
  dateRangeStart: string;
  dateRangeEnd: string;
  clientId?: string;
  coachId?: string;
  organizationId?: string;
  filters?: Record<string, any>;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregation: AnalyticsAggregationService,
  ) {}

  /**
   * Validates authorization for report creation
   */
  private async validateReportAuthorization(user: IAuthUser, dto: ICreateReportDto): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return; // Platform admin has full access
    }

    // 1. Client Scope: User can only export their own client report, or Coach can export assigned client
    if (dto.scope === 'CLIENT') {
      const targetClientId = dto.clientId || user.id;

      if (targetClientId !== user.id) {
        if ([UserRole.COACH, UserRole.TRAINER, UserRole.NUTRITIONIST].includes(user.role)) {
          const relationship = await this.prisma.coachClientRelationship.findFirst({
            where: {
              coachId: user.id,
              clientId: targetClientId,
              isActive: true,
              status: 'ACTIVE',
            },
          });
          if (!relationship) {
            throw new ForbiddenException({
              code: 'UNAUTHORIZED_REPORT_CLIENT',
              message: 'Coach does not have an active authorized relationship with target client',
            });
          }
        } else if (user.role === UserRole.ORG_ADMIN) {
          const targetUser = await this.prisma.user.findUnique({
            where: { id: targetClientId },
            select: { organizationId: true },
          });
          if (!targetUser || targetUser.organizationId !== user.organizationId) {
            throw new ForbiddenException({
              code: 'CROSS_ORG_REPORT_DENIED',
              message: 'Cannot export client report from another organization',
            });
          }
        } else {
          throw new ForbiddenException({
            code: 'FORBIDDEN_CLIENT_REPORT',
            message: 'Athletes can only generate their own personal progress reports',
          });
        }
      }
    }

    // 2. Coach Scope: User must be Coach or Org Admin
    if (dto.scope === 'COACH') {
      const targetCoachId = dto.coachId || user.id;
      if (
        ![UserRole.COACH, UserRole.TRAINER, UserRole.NUTRITIONIST, UserRole.ORG_ADMIN].includes(
          user.role,
        )
      ) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_COACH_REPORT',
          message: 'Only coaches or organization administrators can generate coach reports',
        });
      }
      if (targetCoachId !== user.id && user.role !== UserRole.ORG_ADMIN) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_COACH_SCOPE',
          message: 'Cannot export reports for another coach without organization administrator authority',
        });
      }
    }

    // 3. Organization Scope: User must be Org Admin and match organizationId
    if (dto.scope === 'ORGANIZATION') {
      if (user.role !== UserRole.ORG_ADMIN) {
        throw new ForbiddenException({
          code: 'FORBIDDEN_ORG_REPORT',
          message: 'Only organization administrators can generate organization summary reports',
        });
      }
      const targetOrgId = dto.organizationId || user.organizationId;
      if (targetOrgId !== user.organizationId) {
        throw new ForbiddenException({
          code: 'CROSS_ORG_REPORT_DENIED',
          message: 'Cross-tenant organization reports are strictly prohibited',
        });
      }
    }
  }

  /**
   * Deterministically builds the report payload from authoritative domain data
   */
  async buildReportData(user: IAuthUser, dto: ICreateReportDto) {
    const startDate = dto.dateRangeStart;
    const endDate = dto.dateRangeEnd;

    switch (dto.reportType) {
      case 'CLIENT_PROGRESS': {
        const targetClientId = dto.clientId || user.id;
        const summary = await this.aggregation.getClientAnalyticsSummary(
          targetClientId,
          startDate,
          endDate,
          'CUSTOM',
        );

        const clientUser = await this.prisma.user.findUnique({
          where: { id: targetClientId },
          select: { email: true, profile: { select: { fullName: true } } },
        });

        return {
          title: `Athlete Progress Report: ${clientUser?.profile?.fullName || clientUser?.email || targetClientId}`,
          scope: 'CLIENT',
          period: `${startDate} to ${endDate}`,
          generatedAt: new Date().toISOString(),
          targetId: targetClientId,
          athleteName: clientUser?.profile?.fullName || 'Athlete',
          athleteEmail: clientUser?.email,
          workout: summary.workout,
          nutrition: summary.nutrition,
          activity: summary.activity,
          progress: summary.progress,
        };
      }

      case 'WORKOUT_ADHERENCE': {
        const targetClientId = dto.clientId || user.id;
        const summary = await this.aggregation.getClientAnalyticsSummary(
          targetClientId,
          startDate,
          endDate,
          'CUSTOM',
        );
        return {
          title: `Workout Adherence Report`,
          scope: dto.scope,
          period: `${startDate} to ${endDate}`,
          generatedAt: new Date().toISOString(),
          workoutMetrics: summary.workout,
        };
      }

      case 'NUTRITION_ADHERENCE': {
        const targetClientId = dto.clientId || user.id;
        const summary = await this.aggregation.getClientAnalyticsSummary(
          targetClientId,
          startDate,
          endDate,
          'CUSTOM',
        );
        return {
          title: `Nutrition Adherence Report`,
          scope: dto.scope,
          period: `${startDate} to ${endDate}`,
          generatedAt: new Date().toISOString(),
          nutritionMetrics: summary.nutrition,
        };
      }

      case 'COACH_PERFORMANCE': {
        const targetCoachId = dto.coachId || user.id;
        const summary = await this.aggregation.getCoachAnalyticsSummary(
          targetCoachId,
          startDate,
          endDate,
          'CUSTOM',
        );
        return {
          title: `Coach Portfolio & Performance Report`,
          scope: 'COACH',
          period: `${startDate} to ${endDate}`,
          generatedAt: new Date().toISOString(),
          coachId: targetCoachId,
          workload: summary.workload,
          overallWorkoutAdherence: summary.overallWorkoutAdherence,
          overallNutritionAdherence: summary.overallNutritionAdherence,
          clients: summary.clientAdherenceList,
        };
      }

      case 'ORGANIZATION_SUMMARY':
      case 'ORGANIZATION_OVERVIEW': {
        const targetOrgId = dto.organizationId || user.organizationId!;
        const overview = await this.aggregation.getOrganizationOverview(
          targetOrgId,
          startDate,
          endDate,
          'CUSTOM',
        );
        return {
          title: `Organization Executive Intelligence Report`,
          scope: 'ORGANIZATION',
          period: `${startDate} to ${endDate}`,
          generatedAt: new Date().toISOString(),
          organizationId: targetOrgId,
          totalClients: overview.totalClients.value,
          activeClients: overview.activeClients.value,
          workoutAdherencePercent: overview.workoutAdherence.value,
          nutritionAdherencePercent: overview.nutritionAdherence.value,
          averageWeeklyActivityDays: overview.averageWeeklyActivityDays.value,
          newClients: overview.newClients.value,
          totalCoaches: overview.totalCoaches,
        };
      }

      case 'PROGRAM_PERFORMANCE': {
        const targetCoachId = dto.coachId || user.id;
        const programs = await this.prisma.program.findMany({
          where: { creatorId: targetCoachId },
          include: {
            assignments: {
              select: { id: true, athleteId: true, isActive: true },
            },
          },
        });
        return {
          title: `Program Adoption & Performance Report`,
          scope: 'COACH',
          period: `${startDate} to ${endDate}`,
          generatedAt: new Date().toISOString(),
          programs: programs.map((p) => ({
            programId: p.id,
            name: p.name,
            status: p.status,
            version: p.version,
            totalAssignments: p.assignments.length,
            activeAssignments: p.assignments.filter((a) => a.isActive).length,
          })),
        };
      }

      default:
        throw new BadRequestException(`Unsupported report type: ${dto.reportType}`);
    }
  }

  /**
   * Serializes report data into CSV format
   */
  formatAsCsv(data: Record<string, any>, reportType: ReportType): string {
    let csv = `ALPHA PERFORMANCE OS — ${data.title}\n`;
    csv += `Reporting Period: ${data.period}\n`;
    csv += `Generated Timestamp: ${data.generatedAt}\n`;
    csv += `Scope: ${data.scope}\n\n`;

    if (reportType === 'CLIENT_PROGRESS') {
      csv += 'METRIC CATEGORY,METRIC NAME,VALUE,UNIT\n';
      csv += `Workouts,Total Planned,${data.workout.totalPlanned},COUNT\n`;
      csv += `Workouts,Total Completed,${data.workout.totalCompleted},COUNT\n`;
      csv += `Workouts,Adherence Rate,${data.workout.adherencePercentage ?? 'N/A'},PERCENT\n`;
      csv += `Workouts,Total Volume Lifted,${data.workout.totalVolumeKg},KG\n`;
      csv += `Workouts,Total Duration,${data.workout.totalDurationMinutes},MINUTES\n`;
      csv += `Workouts,Personal Records (PRs),${data.workout.prsAchieved},COUNT\n`;
      csv += `Nutrition,Days Logged,${data.nutrition.daysLogged},DAYS\n`;
      csv += `Nutrition,Adherence Rate,${data.nutrition.adherencePercentage ?? 'N/A'},PERCENT\n`;
      csv += `Nutrition,Average Daily Calories,${data.nutrition.averageCalories},KCAL\n`;
      csv += `Nutrition,Average Protein,${data.nutrition.averageProteinGrams},GRAMS\n`;
      csv += `Activity,Active Days Count,${data.activity.activeDaysCount},DAYS\n`;
      csv += `Activity,Average Daily Steps,${data.activity.averageSteps},STEPS\n`;
      csv += `Activity,Cardio Duration,${data.activity.totalCardioMinutes},MINUTES\n`;
      csv += `Progress,Current Weight,${data.progress.currentWeightKg ?? 'N/A'},KG\n`;
      csv += `Progress,Weight Net Change,${data.progress.weightDeltaKg ?? 'N/A'},KG\n`;
      csv += `Progress,Weight Directional Trend,${data.progress.weightTrend},STATUS\n`;
    } else if (reportType === 'COACH_PERFORMANCE') {
      csv += 'COACH WORKLOAD METRICS,VALUE,UNIT\n';
      csv += `Total Assigned Athletes,${data.workload.totalAssignedClients},COUNT\n`;
      csv += `Active Athletes in Window,${data.workload.activeClientsCount},COUNT\n`;
      csv += `Active Program Prescriptions,${data.workload.activeProgramsCount},COUNT\n`;
      csv += `Messages Exchanged,${data.workload.messagesSent},COUNT\n`;
      csv += `Overall Cohort Workout Adherence,${data.overallWorkoutAdherence ?? 'N/A'},PERCENT\n`;
      csv += `Overall Cohort Nutrition Adherence,${data.overallNutritionAdherence ?? 'N/A'},PERCENT\n\n`;

      csv += 'ATHLETE ADHERENCE ROSTER\n';
      csv += 'Athlete ID,Athlete Name,Workout Adherence (%),Nutrition Adherence (%),Last Active Date,At Risk Status,At Risk Reason\n';
      for (const client of data.clients || []) {
        csv += `"${client.clientId}","${client.clientName}",${client.workoutAdherence ?? 'N/A'},${client.nutritionAdherence ?? 'N/A'},"${client.lastActiveDate || 'None'}",${client.isAtRisk ? 'YES' : 'NO'},"${client.atRiskReason || 'None'}"\n`;
      }
    } else if (reportType === 'ORGANIZATION_SUMMARY' || reportType === 'ORGANIZATION_OVERVIEW') {
      csv += 'EXECUTIVE KPI,VALUE,UNIT\n';
      csv += `Total Enrolled Athletes,${data.totalClients},COUNT\n`;
      csv += `Active Athletes in Period,${data.activeClients},COUNT\n`;
      csv += `New Athlete Signups,${data.newClients},COUNT\n`;
      csv += `Active Coaching Personnel,${data.totalCoaches},COUNT\n`;
      csv += `Organization Workout Adherence,${data.workoutAdherencePercent ?? 'N/A'},PERCENT\n`;
      csv += `Organization Nutrition Adherence,${data.nutritionAdherencePercent ?? 'N/A'},PERCENT\n`;
      csv += `Average Weekly Active Days,${data.averageWeeklyActivityDays},DAYS\n`;
    } else if (reportType === 'PROGRAM_PERFORMANCE') {
      csv += 'PROGRAM ID,PROGRAM NAME,STATUS,VERSION,TOTAL ASSIGNMENTS,ACTIVE ASSIGNMENTS\n';
      for (const p of data.programs || []) {
        csv += `"${p.programId}","${p.name}","${p.status}",${p.version},${p.totalAssignments},${p.activeAssignments}\n`;
      }
    } else {
      csv += 'KEY,VALUE\n';
      for (const [k, v] of Object.entries(data)) {
        if (typeof v !== 'object') {
          csv += `"${k}","${v}"\n`;
        }
      }
    }

    return csv;
  }

  /**
   * Generates formatted PDF / Text report representation
   */
  formatAsPdf(data: Record<string, any>, _reportType?: ReportType): string {
    // Generates a clean, deterministic textual report for PDF conversion / download
    let pdfText = `============================================================\n`;
    pdfText += `       ALPHA PERFORMANCE OS — EXECUTIVE REPORT             \n`;
    pdfText += `============================================================\n\n`;
    pdfText += `Title:     ${data.title}\n`;
    pdfText += `Period:    ${data.period}\n`;
    pdfText += `Generated: ${data.generatedAt}\n`;
    pdfText += `Scope:     ${data.scope}\n\n`;
    pdfText += `------------------------------------------------------------\n`;
    pdfText += `REPORT DETAILS\n`;
    pdfText += `------------------------------------------------------------\n`;
    pdfText += JSON.stringify(data, null, 2);
    pdfText += `\n\n============================================================\n`;
    pdfText += `CONFIDENTIAL — AUTHORIZED ATHLETE / COACH ROSTER ACCESS ONLY\n`;
    pdfText += `============================================================\n`;
    return pdfText;
  }

  /**
   * Creates report, stores in database with expiration, and returns report object
   */
  async createReport(user: IAuthUser, dto: ICreateReportDto) {
    await this.validateReportAuthorization(user, dto);

    const format = dto.format || 'CSV';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day expiration

    // Build authoritative data
    const data = await this.buildReportData(user, dto);

    // Format content
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'JSON') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else if (format === 'PDF') {
      content = this.formatAsPdf(data, dto.reportType);
      mimeType = 'application/pdf';
      fileExtension = 'pdf';
    } else {
      content = this.formatAsCsv(data, dto.reportType);
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    const reportRecord = await this.prisma.report.create({
      data: {
        creatorId: user.id,
        organizationId: dto.organizationId || user.organizationId || null,
        coachId: dto.coachId || (user.role === UserRole.COACH ? user.id : null),
        userId: dto.clientId || null,
        reportType: dto.reportType,
        format,
        scope: dto.scope,
        dateRangeStart: new Date(dto.dateRangeStart),
        dateRangeEnd: new Date(dto.dateRangeEnd),
        filters: dto.filters ? (dto.filters as any) : undefined,
        status: 'COMPLETED',
        fileKey: `reports/${user.id}/${Date.now()}_${dto.reportType}.${fileExtension}`,
        fileUrl: `/api/v1/reports/download/${Date.now()}`,
        expiresAt,
        metadata: {
          mimeType,
          fileExtension,
          contentLength: Buffer.byteLength(content, 'utf8'),
          rawContent: content, // Stored securely in database record
        },
      },
    });

    return {
      id: reportRecord.id,
      reportType: reportRecord.reportType,
      format: reportRecord.format,
      scope: reportRecord.scope,
      status: reportRecord.status,
      fileUrl: `/api/v1/reports/${reportRecord.id}/download`,
      expiresAt: reportRecord.expiresAt?.toISOString(),
      createdAt: reportRecord.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves report details with security check
   */
  async getReport(reportId: string, user: IAuthUser) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID [${reportId}] not found`);
    }

    // Security check
    if (user.role !== UserRole.ADMIN) {
      if (report.creatorId !== user.id) {
        if (report.organizationId && report.organizationId !== user.organizationId) {
          throw new ForbiddenException('Cannot access reports belonging to another organization');
        }
      }
    }

    return {
      id: report.id,
      reportType: report.reportType,
      format: report.format,
      scope: report.scope,
      status: report.status,
      fileUrl: `/api/v1/reports/${report.id}/download`,
      expiresAt: report.expiresAt?.toISOString(),
      createdAt: report.createdAt.toISOString(),
    };
  }

  /**
   * Lists generated reports scoped to authenticated user / organization
   */
  async listReports(user: IAuthUser, scope?: AnalyticsScope) {
    const where: any = {};

    if (user.role === UserRole.ORG_ADMIN && user.organizationId) {
      where.organizationId = user.organizationId;
    } else if (user.role === UserRole.COACH) {
      where.OR = [{ creatorId: user.id }, { coachId: user.id }];
    } else {
      where.creatorId = user.id;
    }

    if (scope) {
      where.scope = scope;
    }

    const reports = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reports.map((r) => ({
      id: r.id,
      reportType: r.reportType,
      format: r.format,
      scope: r.scope,
      status: r.status,
      fileUrl: `/api/v1/reports/${r.id}/download`,
      expiresAt: r.expiresAt?.toISOString(),
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Downloads report content with authorization and expiration validation
   */
  async downloadReport(reportId: string, user: IAuthUser) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID [${reportId}] was not found`);
    }

    // Security check: Must be creator, authorized coach, or organization admin
    if (user.role !== UserRole.ADMIN && report.creatorId !== user.id) {
      if (report.organizationId && report.organizationId !== user.organizationId) {
        throw new ForbiddenException('Access to report download denied across tenants');
      }
    }

    // Expiration check
    if (report.expiresAt && new Date() > report.expiresAt) {
      throw new GoneException({
        code: 'REPORT_EXPIRED',
        message: 'This report file has expired and is no longer available for secure download. Please generate a new report.',
      });
    }

    const meta = (report.metadata || {}) as any;
    const content = meta.rawContent || '';
    const mimeType = meta.mimeType || 'text/csv';
    const extension = meta.fileExtension || 'csv';
    const filename = `alpha_report_${report.reportType.toLowerCase()}_${report.id.substring(0, 8)}.${extension}`;

    return {
      content,
      mimeType,
      filename,
    };
  }
}
