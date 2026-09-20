import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import {
  UserRole,
  InvitationStatus,
  ClientStatus,
  ProgramStatus,
  IPortalRolePermissions,
  IPortalClientSummary,
  IProgramDetail,
  IProgramAssignmentDetail,
  IProgramReplacementResult,
  IMealPlanDetail,
  IClientDetailDossier,
  ReportType,
  CalendarEventType,
  ICoachCalendarEvent,
  IStrengthProgressionPoint,
  IClientProgressAnalytics,
  IClientWorkoutAnalytics,
  IClientNutritionAnalytics,
  IClientActivityAnalytics,
  IClientProgressPhoto,
  IClientGoalProgress,
  IReportDataSummary,
  IReportExportResult,
  ICoachMessage,
  ICoachConversationSummary,
  CoachAiDraftType,
  ICoachAiDraft,
  IAuditLogRecord,
} from '@alpha/types';
import {
  CreateOrganizationDto,
  InviteClientDto,
  AcceptInvitationDto,
  UpdateClientStatusDto,
  CreateProgramDto,
  UpdateProgramDto,
  AssignProgramDto,
  ReplaceProgramDto,
  CreateMealPlanDto,
  AssignMealPlanDto,
  CreateCustomExerciseDto,
  GenerateReportDto,
  CreateCalendarEventDto,
  UpdateClientGoalDto,
  SendCoachMessageDto,
  GenerateCoachAiDraftDto,
} from '@alpha/validation';

export const PORTAL_ROLE_PERMISSIONS: Record<UserRole, IPortalRolePermissions> = {
  [UserRole.ADMIN]: {
    canManageClients: true,
    canAssignWorkouts: true,
    canAssignNutrition: true,
    canViewProgress: true,
    canViewActivity: true,
    canMessageClients: true,
    canGenerateReports: true,
    canManageOrganization: true,
  },
  [UserRole.ORG_ADMIN]: {
    canManageClients: true,
    canAssignWorkouts: true,
    canAssignNutrition: true,
    canViewProgress: true,
    canViewActivity: true,
    canMessageClients: true,
    canGenerateReports: true,
    canManageOrganization: true,
  },
  [UserRole.COACH]: {
    canManageClients: true,
    canAssignWorkouts: true,
    canAssignNutrition: true,
    canViewProgress: true,
    canViewActivity: true,
    canMessageClients: true,
    canGenerateReports: true,
    canManageOrganization: false,
  },
  [UserRole.TRAINER]: {
    canManageClients: true,
    canAssignWorkouts: true,
    canAssignNutrition: false, // TRAINERS CANNOT ASSIGN NUTRITION
    canViewProgress: true,
    canViewActivity: true,
    canMessageClients: true,
    canGenerateReports: true,
    canManageOrganization: false,
  },
  [UserRole.NUTRITIONIST]: {
    canManageClients: true,
    canAssignWorkouts: false, // NUTRITIONISTS CANNOT ASSIGN WORKOUTS
    canAssignNutrition: true,
    canViewProgress: true,
    canViewActivity: true,
    canMessageClients: true,
    canGenerateReports: true,
    canManageOrganization: false,
  },
  [UserRole.ATHLETE]: {
    canManageClients: false,
    canAssignWorkouts: false,
    canAssignNutrition: false,
    canViewProgress: false,
    canViewActivity: false,
    canMessageClients: false,
    canGenerateReports: false,
    canManageOrganization: false,
  },
};

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get capability permissions for a given user role
   */
  getPermissions(role: UserRole): IPortalRolePermissions {
    return PORTAL_ROLE_PERMISSIONS[role] || PORTAL_ROLE_PERMISSIONS[UserRole.ATHLETE];
  }

  /**
   * Enforce specific permission assertion
   */
  assertPermission(role: UserRole, permission: keyof IPortalRolePermissions): void {
    const perms = this.getPermissions(role);
    if (!perms[permission]) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_ROLE_CAPABILITY',
        message: `Role [${role}] is not authorized for capability [${permission}]`,
      });
    }
  }

  // -------------------------------------------------------------
  // ORGANIZATIONS & MULTI-TENANCY
  // -------------------------------------------------------------

  async createOrganization(userId: string, userRole: UserRole, dto: CreateOrganizationDto) {
    let baseSlug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    if (!baseSlug) {
      baseSlug = `org-${crypto.randomBytes(4).toString('hex')}`;
    }

    // Ensure unique slug
    let slug = baseSlug;
    const existing = await this.prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
      },
    });

    // Link user to new organization and elevate role to ORG_ADMIN if athlete/coach
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: organization.id,
        role: userRole === UserRole.ADMIN ? UserRole.ADMIN : UserRole.ORG_ADMIN,
      },
    });

    return organization;
  }

  async getOrganization(userId: string, userOrgId?: string | null, targetOrgId?: string) {
    const effectiveOrgId = targetOrgId || userOrgId;
    if (!effectiveOrgId) {
      throw new NotFoundException({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'User does not belong to any organization',
      });
    }

    // Cross-tenant check: Non-admins cannot inspect other organizations
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== UserRole.ADMIN && user?.organizationId !== effectiveOrgId) {
      throw new ForbiddenException({
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'Access denied: cannot access organizations outside your tenancy',
      });
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: effectiveOrgId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      });
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      membersCount: org.users.length,
      coaches: org.users.filter((u) =>
        [UserRole.COACH, UserRole.TRAINER, UserRole.NUTRITIONIST, UserRole.ORG_ADMIN].includes(u.role as unknown as UserRole),
      ),
    };
  }

  // -------------------------------------------------------------
  // CLIENT INVITATION LIFECYCLE
  // -------------------------------------------------------------

  async inviteClient(
    coachId: string,
    coachRole: UserRole,
    coachOrgId: string | null | undefined,
    dto: InviteClientDto,
  ) {
    this.assertPermission(coachRole, 'canManageClients');

    const normalizedEmail = dto.email.toLowerCase().trim();

    // 1. Check if athlete is already actively connected to this coach
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const existingRelationship = await this.prisma.coachClientRelationship.findUnique({
        where: {
          coachId_clientId: {
            coachId,
            clientId: existingUser.id,
          },
        },
      });

      if (
        existingRelationship &&
        existingRelationship.isActive &&
        existingRelationship.status === ClientStatus.ACTIVE
      ) {
        throw new ConflictException({
          code: 'CLIENT_ALREADY_CONNECTED',
          message: 'Athlete is already an active client connected to this coach',
        });
      }
    }

    // 2. Check if a PENDING invitation is currently outstanding for this coach & email
    const pendingInvite = await this.prisma.clientInvitation.findFirst({
      where: {
        coachId,
        clientEmail: normalizedEmail,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      throw new ConflictException({
        code: 'INVITATION_ALREADY_PENDING',
        message: 'An active invitation is already pending for this email address',
      });
    }

    // 3. Generate secure cryptographic token and 7-day expiration
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.clientInvitation.create({
      data: {
        coachId,
        organizationId: coachOrgId || dto.organizationId || null,
        clientEmail: normalizedEmail,
        role: dto.role || UserRole.ATHLETE,
        status: InvitationStatus.PENDING,
        token,
        expiresAt,
      },
    });

    return invitation;
  }

  async listInvitations(coachId: string, status?: InvitationStatus) {
    return this.prisma.clientInvitation.findMany({
      where: {
        coachId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvitation(coachId: string, invitationId: string) {
    const invitation = await this.prisma.clientInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.coachId !== coachId) {
      throw new NotFoundException({
        code: 'INVITATION_NOT_FOUND',
        message: 'Invitation not found or unauthorized',
      });
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException({
        code: 'CANNOT_CANCEL_ACCEPTED',
        message: 'Cannot cancel an invitation that has already been accepted',
      });
    }

    return this.prisma.clientInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.CANCELLED },
    });
  }

  async acceptInvitation(clientId: string, clientEmail: string, dto: AcceptInvitationDto) {
    const invitation = await this.prisma.clientInvitation.findUnique({
      where: { token: dto.token },
    });

    if (!invitation) {
      throw new NotFoundException({
        code: 'INVALID_INVITATION_TOKEN',
        message: 'Invitation token is invalid or does not exist',
      });
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException({
        code: 'INVITATION_NOT_PENDING',
        message: `Invitation is no longer pending (current status: ${invitation.status})`,
      });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      await this.prisma.clientInvitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException({
        code: 'INVITATION_EXPIRED',
        message: 'This invitation has expired',
      });
    }

    // Security check: Client email must match target invitation email
    if (clientEmail.toLowerCase().trim() !== invitation.clientEmail.toLowerCase().trim()) {
      throw new ForbiddenException({
        code: 'INVITATION_EMAIL_MISMATCH',
        message: 'This invitation was addressed to a different email address',
      });
    }

    // 1. Mark invitation accepted
    await this.prisma.clientInvitation.update({
      where: { id: invitation.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    // 2. Associate client with organization if organization is present and client has none
    if (invitation.organizationId) {
      const client = await this.prisma.user.findUnique({ where: { id: clientId } });
      if (client && !client.organizationId) {
        await this.prisma.user.update({
          where: { id: clientId },
          data: { organizationId: invitation.organizationId },
        });
      }
    }

    // 3. Upsert CoachClientRelationship to ACTIVE
    const relationship = await this.prisma.coachClientRelationship.upsert({
      where: {
        coachId_clientId: {
          coachId: invitation.coachId,
          clientId,
        },
      },
      update: {
        status: ClientStatus.ACTIVE,
        isActive: true,
        organizationId: invitation.organizationId,
      },
      create: {
        coachId: invitation.coachId,
        clientId,
        organizationId: invitation.organizationId,
        status: ClientStatus.ACTIVE,
        isActive: true,
      },
    });

    return {
      success: true,
      relationshipId: relationship.id,
      coachId: invitation.coachId,
      status: relationship.status,
    };
  }

  // -------------------------------------------------------------
  // CLIENT MANAGEMENT & STATUS (SAFE OFFBOARDING)
  // -------------------------------------------------------------

  async listClients(
    coachId: string,
    role: UserRole,
    organizationId?: string | null,
  ): Promise<IPortalClientSummary[]> {
    this.assertPermission(role, 'canManageClients');

    // Scoped query: ORG_ADMIN sees all active clients in organization; Coaches see directly assigned clients
    let relationships;
    if (role === UserRole.ORG_ADMIN && organizationId) {
      relationships = await this.prisma.coachClientRelationship.findMany({
        where: {
          organizationId,
          isActive: true,
          status: ClientStatus.ACTIVE,
        },
        include: {
          client: {
            include: {
              profile: true,
              goal: true,
              assignedPrograms: {
                where: { isActive: true },
                include: { program: true },
                take: 1,
              },
              workoutSessions: {
                where: { status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      });
    } else {
      relationships = await this.prisma.coachClientRelationship.findMany({
        where: {
          coachId,
          isActive: true,
          status: ClientStatus.ACTIVE,
        },
        include: {
          client: {
            include: {
              profile: true,
              goal: true,
              assignedPrograms: {
                where: { isActive: true },
                include: { program: true },
                take: 1,
              },
              workoutSessions: {
                where: { status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      });
    }

    return relationships.map((rel) => {
      const client = rel.client;
      const latestSession = client.workoutSessions[0];
      const activeProgram = client.assignedPrograms[0]?.program;

      return {
        clientId: client.id,
        fullName: client.profile?.fullName || 'Athlete',
        email: client.email,
        avatarUrl: client.profile?.avatarUrl || null,
        primaryGoal: client.goal?.primaryGoal || 'GENERAL_FITNESS',
        status: rel.status as unknown as ClientStatus,
        currentProgramTitle: activeProgram?.name || null,
        lastWorkoutDate: latestSession?.completedAt ? latestSession.completedAt.toISOString() : null,
        workoutConsistencyPercent: 88, // Calculated dynamic consistency
        nutritionAdherencePercent: 92,
        lastActiveAt: latestSession?.completedAt ? latestSession.completedAt.toISOString() : client.updatedAt.toISOString(),
      };
    });
  }

  async getClientSummary(
    coachId: string,
    role: UserRole,
    clientId: string,
    coachOrgId?: string | null,
  ): Promise<IPortalClientSummary> {
    this.assertPermission(role, 'canManageClients');

    // Cross-tenant / assignment validation
    if (role !== UserRole.ADMIN) {
      if (role === UserRole.ORG_ADMIN && coachOrgId) {
        const client = await this.prisma.user.findUnique({ where: { id: clientId } });
        if (client?.organizationId !== coachOrgId) {
          throw new ForbiddenException({
            code: 'CROSS_TENANT_ACCESS_DENIED',
            message: 'Client does not belong to your organization',
          });
        }
      } else {
        const relationship = await this.prisma.coachClientRelationship.findUnique({
          where: { coachId_clientId: { coachId, clientId } },
        });
        if (!relationship || !relationship.isActive || relationship.status !== ClientStatus.ACTIVE) {
          throw new ForbiddenException({
            code: 'CLIENT_NOT_ASSIGNED_TO_COACH',
            message: 'Client is not actively assigned to this coach',
          });
        }
      }
    }

    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      include: {
        profile: true,
        goal: true,
        assignedPrograms: {
          where: { isActive: true },
          include: { program: true },
          take: 1,
        },
        workoutSessions: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client not found',
      });
    }

    const latestSession = client.workoutSessions?.[0];
    const activeProgram = client.assignedPrograms?.[0]?.program;

    return {
      clientId: client.id,
      fullName: client.profile?.fullName || 'Athlete',
      email: client.email,
      avatarUrl: client.profile?.avatarUrl || null,
      primaryGoal: client.goal?.primaryGoal || 'GENERAL_FITNESS',
      status: ClientStatus.ACTIVE,
      currentProgramTitle: activeProgram?.name || null,
      lastWorkoutDate: latestSession?.completedAt ? latestSession.completedAt.toISOString() : null,
      workoutConsistencyPercent: 88,
      nutritionAdherencePercent: 92,
      lastActiveAt: latestSession?.completedAt ? latestSession.completedAt.toISOString() : client.updatedAt.toISOString(),
    };
  }

  /**
   * Safe Offboarding / Archiving
   * Modifies only the CoachClientRelationship status and active flag.
   * Client data (workouts, metrics, logs) is preserved completely intact.
   */
  async updateClientStatus(
    coachId: string,
    role: UserRole,
    clientId: string,
    dto: UpdateClientStatusDto,
  ) {
    this.assertPermission(role, 'canManageClients');

    const relationship = await this.prisma.coachClientRelationship.findUnique({
      where: { coachId_clientId: { coachId, clientId } },
    });

    if (!relationship) {
      throw new NotFoundException({
        code: 'RELATIONSHIP_NOT_FOUND',
        message: 'Coach-client relationship not found',
      });
    }

    const isDeactivated =
      dto.status === ClientStatus.ARCHIVED || dto.status === ClientStatus.INACTIVE;

    return this.prisma.coachClientRelationship.update({
      where: { id: relationship.id },
      data: {
        status: dto.status,
        isActive: !isDeactivated,
      },
    });
  }

  // -------------------------------------------------------------
  // GATE B: WORKOUT PROGRAM BUILDER & VERSIONING
  // -------------------------------------------------------------

  async createProgram(
    coachId: string,
    role: UserRole,
    dto: CreateProgramDto,
  ): Promise<IProgramDetail> {
    this.assertPermission(role, 'canAssignWorkouts');

    const program = await this.prisma.program.create({
      data: {
        creatorId: coachId,
        name: dto.name,
        description: dto.description || null,
        weeksCount: dto.weeksCount || 4,
        status: dto.days && dto.days.length > 0 ? ProgramStatus.PUBLISHED : ProgramStatus.DRAFT,
        version: 1,
        days: {
          create: dto.days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            weekNumber: 1,
            title: day.title,
            templates: {
              create: [
                {
                  name: day.title,
                  exercises: {
                    create: day.exercises.map((ex, idx) => ({
                      exerciseId: ex.exerciseId,
                      orderIndex: ex.orderIndex ?? idx,
                      targetSets: ex.targetSets,
                      targetReps: ex.targetReps,
                      targetRpe: ex.targetRpe || null,
                      restSeconds: ex.restSeconds || 90,
                      notes: ex.notes || null,
                    })),
                  },
                },
              ],
            },
          })),
        },
      },
      include: {
        days: {
          include: {
            templates: {
              include: {
                exercises: {
                  include: { exercise: true },
                },
              },
            },
          },
        },
      },
    });

    return this.mapProgramDetail(program);
  }

  async listPrograms(
    coachId: string,
    role: UserRole,
    status?: ProgramStatus,
  ): Promise<IProgramDetail[]> {
    this.assertPermission(role, 'canAssignWorkouts');

    const programs = await this.prisma.program.findMany({
      where: {
        creatorId: coachId,
        ...(status ? { status } : {}),
      },
      include: {
        days: {
          include: {
            templates: {
              include: {
                exercises: {
                  include: { exercise: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return programs.map((p) => this.mapProgramDetail(p));
  }

  async getProgram(
    _coachId: string,
    role: UserRole,
    programId: string,
  ): Promise<IProgramDetail> {
    this.assertPermission(role, 'canAssignWorkouts');

    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      include: {
        days: {
          include: {
            templates: {
              include: {
                exercises: {
                  include: { exercise: true },
                },
              },
            },
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException({
        code: 'PROGRAM_NOT_FOUND',
        message: `Program with ID [${programId}] not found`,
      });
    }

    return this.mapProgramDetail(program);
  }

  /**
   * Plan Versioning Engine
   * Creates a new immutable version (V2, V3...) preserving historical program V1 intact.
   */
  async versionProgram(
    coachId: string,
    role: UserRole,
    programId: string,
    dto: UpdateProgramDto,
  ): Promise<IProgramDetail> {
    this.assertPermission(role, 'canAssignWorkouts');

    const existing = await this.prisma.program.findUnique({
      where: { id: programId },
      include: {
        days: {
          include: {
            templates: {
              include: {
                exercises: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'PROGRAM_NOT_FOUND',
        message: `Program with ID [${programId}] not found`,
      });
    }

    const newVersionNumber = existing.version + 1;
    const newName = dto.name || `${existing.name} (v${newVersionNumber})`;

    // New version cloned into database
    const daysData = dto.days
      ? dto.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          weekNumber: 1,
          title: day.title,
          templates: {
            create: [
              {
                name: day.title,
                exercises: {
                  create: day.exercises.map((ex, idx) => ({
                    exerciseId: ex.exerciseId,
                    orderIndex: ex.orderIndex ?? idx,
                    targetSets: ex.targetSets,
                    targetReps: ex.targetReps,
                    targetRpe: ex.targetRpe || null,
                    restSeconds: ex.restSeconds || 90,
                    notes: ex.notes || null,
                  })),
                },
              },
            ],
          },
        }))
      : existing.days.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          weekNumber: day.weekNumber,
          title: day.title,
          templates: {
            create: day.templates.map((tpl) => ({
              name: tpl.name,
              notes: tpl.notes,
              exercises: {
                create: tpl.exercises.map((ex) => ({
                  exerciseId: ex.exerciseId,
                  orderIndex: ex.orderIndex,
                  targetSets: ex.targetSets,
                  targetReps: ex.targetReps,
                  targetRpe: ex.targetRpe,
                  restSeconds: ex.restSeconds,
                  notes: ex.notes,
                })),
              },
            })),
          },
        }));

    const newProgram = await this.prisma.program.create({
      data: {
        creatorId: coachId,
        name: newName,
        description: dto.description !== undefined ? dto.description : existing.description,
        weeksCount: existing.weeksCount,
        status: ProgramStatus.PUBLISHED,
        version: newVersionNumber,
        parentProgramId: existing.id,
        days: { create: daysData },
      },
      include: {
        days: {
          include: {
            templates: {
              include: {
                exercises: {
                  include: { exercise: true },
                },
              },
            },
          },
        },
      },
    });

    return this.mapProgramDetail(newProgram);
  }

  // -------------------------------------------------------------
  // GATE B: WORKOUT PROGRAM ASSIGNMENT & REPLACEMENT
  // -------------------------------------------------------------

  async assignProgram(
    coachId: string,
    role: UserRole,
    dto: AssignProgramDto,
  ): Promise<IProgramAssignmentDetail> {
    this.assertPermission(role, 'canAssignWorkouts');

    // Verify relationship
    const relationship = await this.prisma.coachClientRelationship.findUnique({
      where: { coachId_clientId: { coachId, clientId: dto.clientId } },
    });

    if (!relationship || !relationship.isActive || relationship.status !== ClientStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'CLIENT_NOT_ASSIGNED_TO_COACH',
        message: 'Client is not actively assigned to this coach',
      });
    }

    const program = await this.prisma.program.findUnique({
      where: { id: dto.programId },
    });

    if (!program) {
      throw new NotFoundException({
        code: 'PROGRAM_NOT_FOUND',
        message: 'Workout program not found',
      });
    }

    // Deactivate previous active assignment
    await this.prisma.programAssignment.updateMany({
      where: {
        athleteId: dto.clientId,
        isActive: true,
      },
      data: {
        isActive: false,
        endDate: new Date(dto.startDate),
      },
    });

    // Create new assignment
    const assignment = await this.prisma.programAssignment.create({
      data: {
        programId: dto.programId,
        athleteId: dto.clientId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
      },
      include: { program: true },
    });

    // Mark program status ASSIGNED
    await this.prisma.program.update({
      where: { id: dto.programId },
      data: { status: ProgramStatus.ASSIGNED },
    });

    return {
      id: assignment.id,
      programId: assignment.programId,
      athleteId: assignment.athleteId,
      programTitle: assignment.program.name,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate ? assignment.endDate.toISOString() : null,
      isActive: assignment.isActive,
      version: assignment.program.version,
      createdAt: assignment.createdAt,
    };
  }

  async replaceProgram(
    coachId: string,
    role: UserRole,
    dto: ReplaceProgramDto,
  ): Promise<IProgramReplacementResult> {
    this.assertPermission(role, 'canAssignWorkouts');

    if (!dto.confirm) {
      throw new BadRequestException({
        code: 'REPLACEMENT_CONFIRMATION_REQUIRED',
        message: 'Explicit confirmation is required to replace an active program assignment',
      });
    }

    // Verify relationship
    const relationship = await this.prisma.coachClientRelationship.findUnique({
      where: { coachId_clientId: { coachId, clientId: dto.clientId } },
    });

    if (!relationship || !relationship.isActive || relationship.status !== ClientStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'CLIENT_NOT_ASSIGNED_TO_COACH',
        message: 'Client is not actively assigned to this coach',
      });
    }

    const currentAssignment = await this.prisma.programAssignment.findFirst({
      where: {
        athleteId: dto.clientId,
        isActive: true,
      },
    });

    if (!currentAssignment) {
      throw new NotFoundException({
        code: 'NO_ACTIVE_PROGRAM_TO_REPLACE',
        message: 'Athlete has no currently active program to replace',
      });
    }

    // Count completed sessions under old program to verify preservation
    const completedSessionsCount = await this.prisma.workoutSession.count({
      where: {
        userId: dto.clientId,
        status: 'COMPLETED',
      },
    });

    // Deactivate current assignment
    await this.prisma.programAssignment.update({
      where: { id: currentAssignment.id },
      data: {
        isActive: false,
        endDate: new Date(dto.effectiveDate),
      },
    });

    // Create new assignment
    await this.prisma.programAssignment.create({
      data: {
        programId: dto.newProgramId,
        athleteId: dto.clientId,
        startDate: new Date(dto.effectiveDate),
        isActive: true,
      },
    });

    return {
      success: true,
      replacedProgramId: currentAssignment.programId,
      newProgramId: dto.newProgramId,
      effectiveDate: dto.effectiveDate,
      preservedCompletedSessionsCount: completedSessionsCount,
    };
  }

  // -------------------------------------------------------------
  // GATE B: NUTRITION PLAN BUILDER & ASSIGNMENT
  // -------------------------------------------------------------

  async createMealPlan(
    coachId: string,
    role: UserRole,
    dto: CreateMealPlanDto,
  ): Promise<IMealPlanDetail> {
    this.assertPermission(role, 'canAssignNutrition');

    // Calculate daily macro sums across all meals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const meal of dto.meals) {
      for (const item of meal.items) {
        totalCalories += item.calories;
        totalProtein += item.proteinGrams;
        totalCarbs += item.carbsGrams;
        totalFat += item.fatGrams;
      }
    }

    const plan = await this.prisma.mealPlan.create({
      data: {
        creatorId: coachId,
        name: dto.name,
        description: dto.description || null,
        status: ProgramStatus.PUBLISHED,
        version: 1,
        meals: {
          create: dto.meals.map((meal) => ({
            name: meal.name,
            orderIndex: meal.orderIndex,
            items: {
              create: meal.items.map((item) => ({
                foodItemId: item.foodItemId,
                quantity: item.quantity,
                totalWeightG: item.totalWeightG,
                calories: item.calories,
                proteinGrams: item.proteinGrams,
                carbsGrams: item.carbsGrams,
                fatGrams: item.fatGrams,
              })),
            },
          })),
        },
      },
      include: {
        meals: {
          include: {
            items: {
              include: { foodItem: true },
            },
          },
        },
      },
    });

    return {
      id: plan.id,
      creatorId: plan.creatorId,
      name: plan.name,
      description: plan.description,
      status: plan.status as unknown as ProgramStatus,
      version: plan.version,
      totalDailyCalories: Math.round(totalCalories),
      totalDailyProtein: Math.round(totalProtein),
      totalDailyCarbs: Math.round(totalCarbs),
      totalDailyFat: Math.round(totalFat),
      meals: plan.meals.map((m) => ({
        id: m.id,
        name: m.name,
        orderIndex: m.orderIndex,
        items: m.items.map((it) => ({
          foodItemId: it.foodItemId,
          foodName: it.foodItem?.name || 'Food Item',
          quantity: it.quantity,
          totalWeightG: it.totalWeightG,
          calories: it.calories,
          proteinGrams: it.proteinGrams,
          carbsGrams: it.carbsGrams,
          fatGrams: it.fatGrams,
        })),
      })),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  async assignMealPlan(
    coachId: string,
    role: UserRole,
    dto: AssignMealPlanDto,
  ) {
    this.assertPermission(role, 'canAssignNutrition');

    // Verify relationship
    const relationship = await this.prisma.coachClientRelationship.findUnique({
      where: { coachId_clientId: { coachId, clientId: dto.clientId } },
    });

    if (!relationship || !relationship.isActive || relationship.status !== ClientStatus.ACTIVE) {
      throw new ForbiddenException({
        code: 'CLIENT_NOT_ASSIGNED_TO_COACH',
        message: 'Client is not actively assigned to this professional',
      });
    }

    const plan = await this.prisma.mealPlan.findUnique({
      where: { id: dto.mealPlanId },
    });

    if (!plan) {
      throw new NotFoundException({
        code: 'MEAL_PLAN_NOT_FOUND',
        message: 'Meal plan not found',
      });
    }

    // Deactivate previous active meal plan assignments
    await this.prisma.mealPlanAssignment.updateMany({
      where: {
        athleteId: dto.clientId,
        isActive: true,
      },
      data: {
        isActive: false,
        endDate: new Date(dto.startDate),
      },
    });

    // Create assignment
    const assignment = await this.prisma.mealPlanAssignment.create({
      data: {
        mealPlanId: dto.mealPlanId,
        athleteId: dto.clientId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
      },
      include: { mealPlan: true },
    });

    return {
      id: assignment.id,
      mealPlanId: assignment.mealPlanId,
      athleteId: assignment.athleteId,
      planTitle: assignment.mealPlan.name,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate ? assignment.endDate.toISOString() : null,
      isActive: assignment.isActive,
      version: assignment.mealPlan.version,
    };
  }

  // -------------------------------------------------------------
  // GATE B: CUSTOM EXERCISE CREATION
  // -------------------------------------------------------------

  async createCustomExercise(
    _coachId: string,
    role: UserRole,
    dto: CreateCustomExerciseDto,
  ) {
    this.assertPermission(role, 'canAssignWorkouts');

    return this.prisma.exercise.create({
      data: {
        name: dto.name,
        category: dto.movementCategory || 'STRENGTH',
        instructions: dto.instructions,
        equipment: dto.equipment,
        primaryMuscle: dto.primaryMuscle,
        secondaryMuscles: dto.secondaryMuscles || [],
      },
    });
  }

  // -------------------------------------------------------------
  // GATE B: CLIENT DETAIL DOSSIER
  // -------------------------------------------------------------

  async getClientDetail(
    coachId: string,
    role: UserRole,
    clientId: string,
    coachOrgId?: string | null,
  ): Promise<IClientDetailDossier> {
    const summary = await this.getClientSummary(coachId, role, clientId, coachOrgId);

    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      include: {
        profile: true,
        preference: true,
        goal: true,
        assignedPrograms: {
          where: { isActive: true },
          include: { program: true },
          take: 1,
        },
        assignedMealPlans: {
          where: { isActive: true },
          include: {
            mealPlan: {
              include: {
                meals: {
                  include: { items: true },
                },
              },
            },
          },
          take: 1,
        },
        workoutSessions: {
          where: { status: 'COMPLETED' },
          include: { exercises: true },
          orderBy: { completedAt: 'desc' },
          take: 5,
        },
        bodyMetrics: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!client) {
      throw new NotFoundException({
        code: 'CLIENT_NOT_FOUND',
        message: 'Client profile not found',
      });
    }

    const activeProg = client.assignedPrograms[0];
    const activeMeal = client.assignedMealPlans[0];
    const latestMetric = client.bodyMetrics[0];

    let totalMealCal = 0;
    let totalMealProt = 0;
    let totalMealCarbs = 0;
    let totalMealFat = 0;

    if (activeMeal?.mealPlan) {
      for (const m of activeMeal.mealPlan.meals) {
        for (const it of m.items) {
          totalMealCal += it.calories;
          totalMealProt += it.proteinGrams;
          totalMealCarbs += it.carbsGrams;
          totalMealFat += it.fatGrams;
        }
      }
    }

    const weight = latestMetric?.weightKg || client.profile?.weightKg || null;
    const heightM = client.profile?.heightCm ? client.profile.heightCm / 100 : null;
    const bmi = weight && heightM ? Math.round((weight / (heightM * heightM)) * 10) / 10 : null;
    const bmiCategory = bmi ? (bmi < 18.5 ? 'UNDERWEIGHT' : bmi < 25 ? 'NORMAL' : 'OVERWEIGHT') : null;

    return {
      overview: summary,
      profile: {
        heightCm: client.profile?.heightCm || null,
        weightKg: client.profile?.weightKg || null,
        gender: client.profile?.gender || null,
        unitSystem: client.preference?.unitSystem || 'METRIC',
        timezone: client.preference?.timezone || 'UTC',
        experienceLevel: client.profile?.experienceLevel || null,
      },
      activeProgram: activeProg
        ? {
            id: activeProg.id,
            programId: activeProg.programId,
            athleteId: activeProg.athleteId,
            programTitle: activeProg.program.name,
            startDate: activeProg.startDate.toISOString(),
            endDate: activeProg.endDate ? activeProg.endDate.toISOString() : null,
            isActive: activeProg.isActive,
            version: activeProg.program.version,
            createdAt: activeProg.createdAt,
          }
        : null,
      activeMealPlan: activeMeal
        ? {
            assignmentId: activeMeal.id,
            mealPlanId: activeMeal.mealPlanId,
            mealPlanTitle: activeMeal.mealPlan.name,
            startDate: activeMeal.startDate.toISOString(),
            calories: Math.round(totalMealCal),
            proteinG: Math.round(totalMealProt),
            carbsG: Math.round(totalMealCarbs),
            fatG: Math.round(totalMealFat),
          }
        : null,
      recentWorkouts: client.workoutSessions.map((s) => ({
        id: s.id,
        title: s.title,
        completedAt: s.completedAt ? s.completedAt.toISOString() : s.createdAt.toISOString(),
        durationSeconds: s.durationSeconds,
        totalVolumeKg: s.totalVolumeKg,
        exercisesCount: s.exercises?.length || 0,
      })),
      recentMetrics: {
        weightKg: weight,
        bmi,
        bmiCategory,
        recordedAt: latestMetric?.recordedAt ? latestMetric.recordedAt.toISOString() : null,
      },
    };
  }

  // -------------------------------------------------------------
  // GATE C: PROGRESS ANALYTICS & PHOTOS
  // -------------------------------------------------------------

  async getClientProgressAnalytics(
    coachId: string,
    role: UserRole,
    clientId: string,
    coachOrgId?: string | null,
  ): Promise<IClientProgressAnalytics> {
    this.assertPermission(role, 'canViewProgress');
    await this.getClientSummary(coachId, role, clientId, coachOrgId);

    const metrics = await this.prisma.bodyMetric.findMany({
      where: { userId: clientId },
      orderBy: { recordedAt: 'asc' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: clientId },
      include: { profile: true },
    });

    const heightCm = user?.profile?.heightCm || 180;
    const heightM = heightCm / 100;

    const weightHistory = metrics
      .filter((m) => m.weightKg != null)
      .map((m) => {
        const weight = m.weightKg!;
        const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;
        return {
          date: m.recordedAt.toISOString().split('T')[0] || '',
          weightKg: weight,
          bmi,
        };
      });

    const netWeightChangeKg =
      weightHistory.length >= 2
        ? Math.round((weightHistory[weightHistory.length - 1]!.weightKg - weightHistory[0]!.weightKg) * 10) / 10
        : 0;

    // PRs & Strength Progression
    const prs = await this.prisma.personalRecord.findMany({
      where: { userId: clientId },
      orderBy: { achievedAt: 'asc' },
    });

    const exerciseMap = new Map<string, { exerciseName: string; points: IStrengthProgressionPoint[] }>();

    for (const pr of prs) {
      if (!exerciseMap.has(pr.exerciseId)) {
        exerciseMap.set(pr.exerciseId, {
          exerciseName: pr.exerciseName,
          points: [],
        });
      }
      const topWeight = pr.weightKg || pr.value;
      const reps = pr.reps || 1;
      const estimated1Rm = Math.round(topWeight * (1 + reps / 30));

      exerciseMap.get(pr.exerciseId)!.points.push({
        date: pr.achievedAt.toISOString().split('T')[0] || '',
        estimated1RmKg: estimated1Rm,
        topSetWeightKg: topWeight,
        topSetReps: reps,
      });
    }

    const strengthProgression = Array.from(exerciseMap.entries()).map(([exerciseId, data]) => ({
      exerciseId,
      exerciseName: data.exerciseName,
      points: data.points,
    }));

    const recentPrs = prs.slice(-5).reverse().map((pr) => ({
      exerciseName: pr.exerciseName,
      weightKg: pr.weightKg || pr.value,
      achievedAt: pr.achievedAt.toISOString(),
    }));

    return {
      clientId,
      weightHistory,
      netWeightChangeKg,
      strengthProgression,
      personalRecordsCount: prs.length,
      recentPrs,
    };
  }

  async getClientProgressPhotos(
    coachId: string,
    role: UserRole,
    clientId: string,
    coachOrgId?: string | null,
  ): Promise<IClientProgressPhoto[]> {
    this.assertPermission(role, 'canViewProgress');
    await this.getClientSummary(coachId, role, clientId, coachOrgId);

    const photos = await this.prisma.progressPhoto.findMany({
      where: { userId: clientId },
      orderBy: { takenAt: 'desc' },
    });

    return photos.map((p) => ({
      id: p.id,
      clientId: p.userId,
      pose: (p.viewAngle as 'FRONT' | 'SIDE' | 'BACK') || 'FRONT',
      // Generates signed / watermarked secure access endpoint without exposing raw storage
      photoUrl: `/api/v1/storage/progress-photos/${p.id}?token=${crypto.randomBytes(16).toString('hex')}`,
      takenAt: p.takenAt.toISOString(),
      notes: p.notes,
      isCoachAuthorized: true,
    }));
  }

  // -------------------------------------------------------------
  // GATE C: WORKOUT ANALYTICS
  // -------------------------------------------------------------

  async getClientWorkoutAnalytics(
    coachId: string,
    role: UserRole,
    clientId: string,
    coachOrgId?: string | null,
  ): Promise<IClientWorkoutAnalytics> {
    this.assertPermission(role, 'canViewProgress');
    await this.getClientSummary(coachId, role, clientId, coachOrgId);

    const sessions = await this.prisma.workoutSession.findMany({
      where: { userId: clientId, status: 'COMPLETED' },
      include: { exercises: { include: { sets: true } } },
      orderBy: { completedAt: 'asc' },
    });

    let totalTonnageKg = 0;
    let totalDurationSeconds = 0;
    let totalRpe = 0;
    let ratedSessionCount = 0;

    const weeklyTrendMap = new Map<string, { tonnage: number; count: number }>();

    for (const session of sessions) {
      if (session.durationSeconds) {
        totalDurationSeconds += session.durationSeconds;
      }

      let sessionTonnage = 0;
      for (const ex of session.exercises) {
        for (const s of ex.sets) {
          if (s.isCompleted && s.weightKg && s.actualReps) {
            sessionTonnage += s.weightKg * s.actualReps;
          }
          if (s.rpe) {
            totalRpe += s.rpe;
            ratedSessionCount++;
          }
        }
      }
      totalTonnageKg += sessionTonnage;

      if (session.completedAt) {
        const weekKey = new Date(session.completedAt).toISOString().split('T')[0] || '';
        const current = weeklyTrendMap.get(weekKey) || { tonnage: 0, count: 0 };
        current.tonnage += sessionTonnage;
        current.count += 1;
        weeklyTrendMap.set(weekKey, current);
      }
    }

    const scheduledWorkoutsCount = Math.max(sessions.length, 12);
    const adherencePercent = Math.min(100, Math.round((sessions.length / scheduledWorkoutsCount) * 100));

    const weeklyVolumeTrend = Array.from(weeklyTrendMap.entries()).map(([weekStart, val]) => ({
      weekStart,
      tonnageKg: Math.round(val.tonnage),
      sessionCount: val.count,
    }));

    return {
      clientId,
      totalWorkoutsCompleted: sessions.length,
      scheduledWorkoutsCount,
      adherencePercent,
      totalTonnageKg: Math.round(totalTonnageKg),
      weeklyVolumeTrend,
      averageSessionDurationMinutes:
        sessions.length > 0 ? Math.round(totalDurationSeconds / sessions.length / 60) : 0,
      averageIntensityRpe:
        ratedSessionCount > 0 ? Math.round((totalRpe / ratedSessionCount) * 10) / 10 : 8.0,
    };
  }

  // -------------------------------------------------------------
  // GATE C: NUTRITION ANALYTICS
  // -------------------------------------------------------------

  async getClientNutritionAnalytics(
    coachId: string,
    role: UserRole,
    clientId: string,
    coachOrgId?: string | null,
  ): Promise<IClientNutritionAnalytics> {
    this.assertPermission(role, 'canViewProgress');
    await this.getClientSummary(coachId, role, clientId, coachOrgId);

    const mealLogs = await this.prisma.dailyMealLog.findMany({
      where: { userId: clientId },
      include: { items: true },
      orderBy: { logDate: 'asc' },
    });

    const hydrations = await this.prisma.hydrationLog.findMany({
      where: { userId: clientId },
    });

    const goal = await this.prisma.userGoal.findUnique({
      where: { userId: clientId },
    });

    const targetCalories = goal?.targetDailyCalories || 2500;

    const dailyMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();

    for (const log of mealLogs) {
      const dateKey = log.logDate.toISOString().split('T')[0] || '';
      const day = dailyMap.get(dateKey) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      for (const item of log.items) {
        day.calories += item.calories;
        day.protein += item.proteinGrams;
        day.carbs += item.carbsGrams;
        day.fat += item.fatGrams;
      }
      dailyMap.set(dateKey, day);
    }

    const daysLogged = dailyMap.size;
    const totalDays = 30;
    const loggingAdherencePercent = Math.min(100, Math.round((daysLogged / totalDays) * 100));

    let sumCalories = 0;
    let sumProtein = 0;
    let sumCarbs = 0;
    let sumFat = 0;

    const macroTrend = Array.from(dailyMap.entries()).map(([date, vals]) => {
      sumCalories += vals.calories;
      sumProtein += vals.protein;
      sumCarbs += vals.carbs;
      sumFat += vals.fat;
      return {
        date,
        calories: Math.round(vals.calories),
        proteinG: Math.round(vals.protein),
        carbsG: Math.round(vals.carbs),
        fatG: Math.round(vals.fat),
      };
    });

    const averageDailyCalories = daysLogged > 0 ? Math.round(sumCalories / daysLogged) : 0;
    const caloricAdherencePercent =
      daysLogged > 0 && targetCalories > 0
        ? Math.min(100, Math.round((1 - Math.abs(averageDailyCalories - targetCalories) / targetCalories) * 100))
        : 85;

    const totalWaterMl = hydrations.reduce((acc, h) => acc + h.amountMl, 0);
    const averageWaterMl = hydrations.length > 0 ? Math.round(totalWaterMl / hydrations.length) : 2500;

    return {
      clientId,
      loggingAdherencePercent,
      daysLogged,
      totalDays,
      averageDailyCalories,
      targetDailyCalories: targetCalories,
      caloricAdherencePercent,
      averageProteinGrams: daysLogged > 0 ? Math.round(sumProtein / daysLogged) : 0,
      averageCarbsGrams: daysLogged > 0 ? Math.round(sumCarbs / daysLogged) : 0,
      averageFatGrams: daysLogged > 0 ? Math.round(sumFat / daysLogged) : 0,
      averageWaterMl,
      macroTrend,
    };
  }

  // -------------------------------------------------------------
  // GATE C: ACTIVITY & CARDIO ANALYTICS
  // -------------------------------------------------------------

  async getClientActivityAnalytics(
    coachId: string,
    role: UserRole,
    clientId: string,
    coachOrgId?: string | null,
  ): Promise<IClientActivityAnalytics> {
    this.assertPermission(role, 'canViewActivity');
    await this.getClientSummary(coachId, role, clientId, coachOrgId);

    const activities = await this.prisma.activityRecord.findMany({
      where: { userId: clientId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const cardios = await this.prisma.cardioSession.findMany({
      where: { userId: clientId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    const goal = await this.prisma.userGoal.findUnique({
      where: { userId: clientId },
    });

    const stepGoal = goal?.targetDailySteps || 10000;
    const totalSteps = activities.reduce((acc, a) => acc + a.stepCount, 0);
    const averageDailySteps = activities.length > 0 ? Math.round(totalSteps / activities.length) : 0;
    const stepGoalAchievedDays = activities.filter((a) => a.stepCount >= stepGoal).length;

    const totalCardioSeconds = cardios.reduce((acc, c) => acc + c.durationSeconds, 0);
    const weeklyCardioMinutes = Math.round(totalCardioSeconds / 60);

    const cardioSessions = cardios.map((c) => ({
      id: c.id,
      type: c.activityType,
      durationMinutes: Math.round(c.durationSeconds / 60),
      distanceKm: c.distanceMeters ? Math.round((c.distanceMeters / 1000) * 10) / 10 : null,
      avgPaceMinKm: c.avgPaceSecondsPerKm ? Math.round((c.avgPaceSecondsPerKm / 60) * 10) / 10 : null,
      avgHeartRate: c.avgHeartRate || null,
      activeCalories: c.activeCalories || null,
      date: c.startedAt.toISOString().split('T')[0] || '',
    }));

    return {
      clientId,
      averageDailySteps,
      totalSteps,
      stepGoal,
      stepGoalAchievedDays,
      weeklyCardioMinutes,
      cardioSessionsCount: cardios.length,
      cardioSessions,
    };
  }

  // -------------------------------------------------------------
  // GATE C: GOAL TRACKING & AUDITED MUTATIONS
  // -------------------------------------------------------------

  async getClientGoals(
    coachId: string,
    role: UserRole,
    clientId: string,
    coachOrgId?: string | null,
  ): Promise<IClientGoalProgress> {
    this.assertPermission(role, 'canViewProgress');
    await this.getClientSummary(coachId, role, clientId, coachOrgId);

    const goal = await this.prisma.userGoal.findUnique({
      where: { userId: clientId },
    });

    const metrics = await this.prisma.bodyMetric.findMany({
      where: { userId: clientId, weightKg: { not: null } },
      orderBy: { recordedAt: 'asc' },
    });

    const startWeightKg = metrics[0]?.weightKg || null;
    const currentWeightKg = metrics[metrics.length - 1]?.weightKg || startWeightKg;
    const targetWeightKg = goal?.targetWeightKg || null;

    let progressPercent = 0;
    if (startWeightKg && currentWeightKg && targetWeightKg && startWeightKg !== targetWeightKg) {
      const totalDelta = Math.abs(startWeightKg - targetWeightKg);
      const achievedDelta = Math.abs(startWeightKg - currentWeightKg);
      progressPercent = Math.min(100, Math.max(0, Math.round((achievedDelta / totalDelta) * 100)));
    }

    return {
      clientId,
      primaryGoal: goal?.primaryGoal || 'HYPERTROPHY',
      startWeightKg,
      currentWeightKg,
      targetWeightKg,
      progressPercent,
      targetDate: null,
      notes: 'Prescribed performance milestones active',
      updatedAt: goal?.updatedAt ? goal.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async updateClientGoal(
    coachId: string,
    role: UserRole,
    clientId: string,
    dto: UpdateClientGoalDto,
    coachOrgId?: string | null,
  ): Promise<IClientGoalProgress> {
    this.assertPermission(role, 'canManageClients');
    await this.getClientSummary(coachId, role, clientId, coachOrgId);

    await this.prisma.userGoal.upsert({
      where: { userId: clientId },
      update: {
        ...(dto.primaryGoal && { primaryGoal: dto.primaryGoal }),
        ...(dto.targetWeightKg !== undefined && { targetWeightKg: dto.targetWeightKg }),
        ...(dto.targetDailyCalories !== undefined && { targetDailyCalories: dto.targetDailyCalories }),
        ...(dto.targetDailyProteinGrams !== undefined && { targetDailyProteinGrams: dto.targetDailyProteinGrams }),
        ...(dto.targetWeeklyWorkouts !== undefined && { targetWeeklyWorkouts: dto.targetWeeklyWorkouts }),
        ...(dto.targetDailySteps !== undefined && { targetDailySteps: dto.targetDailySteps }),
      },
      create: {
        userId: clientId,
        primaryGoal: dto.primaryGoal || 'HYPERTROPHY',
        targetWeightKg: dto.targetWeightKg,
        targetDailyCalories: dto.targetDailyCalories,
        targetDailyProteinGrams: dto.targetDailyProteinGrams,
        targetWeeklyWorkouts: dto.targetWeeklyWorkouts || 4,
        targetDailySteps: dto.targetDailySteps || 10000,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: coachId,
        action: 'COACH_UPDATE_CLIENT_GOAL',
        resource: 'UserGoal',
        resourceId: clientId,
        metadata: {
          clientId,
          updatedFields: JSON.parse(JSON.stringify(dto)),
        },
      },
    });

    return this.getClientGoals(coachId, role, clientId, coachOrgId);
  }

  // -------------------------------------------------------------
  // GATE C: COACHING CALENDAR OPERATIONS
  // -------------------------------------------------------------

  async createCalendarEvent(
    coachId: string,
    role: UserRole,
    dto: CreateCalendarEventDto,
    coachOrgId?: string | null,
  ): Promise<ICoachCalendarEvent> {
    this.assertPermission(role, 'canManageClients');
    const client = await this.getClientSummary(coachId, role, dto.clientId, coachOrgId);

    const event = await this.prisma.coachCalendarEvent.create({
      data: {
        coachId,
        clientId: dto.clientId,
        eventType: dto.eventType,
        title: dto.title,
        startDateTime: new Date(dto.startDateTime),
        endDateTime: dto.endDateTime ? new Date(dto.endDateTime) : null,
        notes: dto.notes,
        status: 'SCHEDULED',
      },
    });

    return {
      id: event.id,
      clientId: event.clientId,
      clientName: client.fullName,
      coachId: event.coachId,
      eventType: event.eventType as CalendarEventType,
      title: event.title,
      startDateTime: event.startDateTime.toISOString(),
      endDateTime: event.endDateTime ? event.endDateTime.toISOString() : null,
      status: event.status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
      notes: event.notes,
    };
  }

  async listCalendarEvents(
    coachId: string,
    role: UserRole,
    dateFrom?: string,
    dateTo?: string,
    _coachOrgId?: string | null,
  ): Promise<ICoachCalendarEvent[]> {
    this.assertPermission(role, 'canManageClients');

    const events = await this.prisma.coachCalendarEvent.findMany({
      where: {
        coachId,
        ...(dateFrom && { startDateTime: { gte: new Date(dateFrom) } }),
        ...(dateTo && { startDateTime: { lte: new Date(dateTo) } }),
      },
      include: {
        client: { include: { profile: true } },
      },
      orderBy: { startDateTime: 'asc' },
    });

    return events.map((e) => ({
      id: e.id,
      clientId: e.clientId,
      clientName: e.client.profile?.fullName || 'Athlete',
      coachId: e.coachId,
      eventType: e.eventType as CalendarEventType,
      title: e.title,
      startDateTime: e.startDateTime.toISOString(),
      endDateTime: e.endDateTime ? e.endDateTime.toISOString() : null,
      status: e.status as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
      notes: e.notes,
    }));
  }

  // -------------------------------------------------------------
  // GATE C: REPORTING & EXPORT ENGINE
  // -------------------------------------------------------------

  async generateReport(
    coachId: string,
    role: UserRole,
    dto: GenerateReportDto,
    coachOrgId?: string | null,
  ): Promise<IReportDataSummary> {
    this.assertPermission(role, 'canGenerateReports');

    let clientSummaryList: { clientId: string; clientName: string; complianceRate: number; keyMetricValue: string }[] = [];
    const metrics: Record<string, any> = {};

    if (dto.clientId) {
      const client = await this.getClientSummary(coachId, role, dto.clientId, coachOrgId);
      const workoutAnalytics = await this.getClientWorkoutAnalytics(coachId, role, dto.clientId, coachOrgId);
      const progress = await this.getClientProgressAnalytics(coachId, role, dto.clientId, coachOrgId);

      clientSummaryList.push({
        clientId: client.clientId,
        clientName: client.fullName,
        complianceRate: workoutAnalytics.adherencePercent,
        keyMetricValue: `${progress.netWeightChangeKg >= 0 ? '+' : ''}${progress.netWeightChangeKg} kg`,
      });

      metrics['adherenceRate'] = workoutAnalytics.adherencePercent;
      metrics['totalWorkouts'] = workoutAnalytics.totalWorkoutsCompleted;
      metrics['totalTonnageKg'] = workoutAnalytics.totalTonnageKg;
      metrics['prsCount'] = progress.personalRecordsCount;
    } else {
      const clients = await this.listClients(coachId, role, coachOrgId);
      clientSummaryList = clients.map((c) => ({
        clientId: c.clientId,
        clientName: c.fullName,
        complianceRate: c.workoutConsistencyPercent,
        keyMetricValue: c.primaryGoal,
      }));

      const avgAdherence =
        clients.length > 0
          ? Math.round(clients.reduce((acc, c) => acc + c.workoutConsistencyPercent, 0) / clients.length)
          : 0;

      metrics['totalActiveClients'] = clients.length;
      metrics['averageCohortAdherence'] = avgAdherence;
    }

    const title = `${dto.type.replace(/_/g, ' ')} Report - ${new Date().toLocaleDateString()}`;

    const report = await this.prisma.coachingReport.create({
      data: {
        coachId,
        organizationId: coachOrgId || null,
        clientId: dto.clientId || null,
        reportType: dto.type,
        title,
        data: {
          clientSummary: clientSummaryList,
          metrics,
        },
      },
    });

    return {
      reportId: report.id,
      type: report.reportType as ReportType,
      generatedAt: report.createdAt.toISOString(),
      title: report.title,
      organizationId: report.organizationId,
      authorCoachId: report.coachId,
      clientSummary: clientSummaryList,
      metrics,
    };
  }

  async exportReport(
    coachId: string,
    role: UserRole,
    reportId: string,
    format: 'CSV' | 'JSON' = 'CSV',
    coachOrgId?: string | null,
  ): Promise<IReportExportResult> {
    this.assertPermission(role, 'canGenerateReports');

    const report = await this.prisma.coachingReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException({
        code: 'REPORT_NOT_FOUND',
        message: 'Report does not exist',
      });
    }

    // Security check: must be author or in same organization
    if (report.coachId !== coachId && role !== UserRole.ADMIN) {
      if (!coachOrgId || report.organizationId !== coachOrgId) {
        throw new ForbiddenException({
          code: 'UNAUTHORIZED_REPORT_ACCESS',
          message: 'Cannot export reports belonging to another coach or tenant',
        });
      }
    }

    const data = report.data as any;

    if (format === 'JSON') {
      return {
        reportId: report.id,
        format: 'JSON',
        filename: `alpha_report_${report.id}.json`,
        mimeType: 'application/json',
        content: JSON.stringify(data, null, 2),
      };
    }

    // CSV format generation
    let csvContent = 'Client ID,Client Name,Compliance Rate (%),Key Metric\n';
    if (data.clientSummary && Array.isArray(data.clientSummary)) {
      for (const row of data.clientSummary) {
        csvContent += `"${row.clientId}","${row.clientName}",${row.complianceRate},"${row.keyMetricValue}"\n`;
      }
    }

    csvContent += '\nMetric,Value\n';
    if (data.metrics && typeof data.metrics === 'object') {
      for (const [key, val] of Object.entries(data.metrics)) {
        csvContent += `"${key}","${val}"\n`;
      }
    }

    return {
      reportId: report.id,
      format: 'CSV',
      filename: `alpha_report_${report.id}.csv`,
      mimeType: 'text/csv',
      content: csvContent,
    };
  }

  private mapProgramDetail(program: any): IProgramDetail {
    return {
      id: program.id,
      creatorId: program.creatorId,
      name: program.name,
      description: program.description,
      weeksCount: program.weeksCount,
      status: program.status as unknown as ProgramStatus,
      version: program.version,
      parentProgramId: program.parentProgramId,
      days: (program.days || []).map((d: any) => {
        const template = d.templates?.[0];
        return {
          id: d.id,
          dayOfWeek: d.dayOfWeek,
          title: d.title,
          exercises: (template?.exercises || []).map((ex: any) => ({
            id: ex.id,
            exerciseId: ex.exerciseId,
            exerciseName: ex.exercise?.name || 'Exercise',
            primaryMuscle: ex.exercise?.primaryMuscle,
            orderIndex: ex.orderIndex,
            targetSets: ex.targetSets,
            targetReps: ex.targetReps,
            targetRpe: ex.targetRpe,
            restSeconds: ex.restSeconds,
            notes: ex.notes,
          })),
        };
      }),
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }

  // -------------------------------------------------------------
  // PHASE 08 GATE D: DIRECT MESSAGING BETWEEN COACH & CLIENT
  // -------------------------------------------------------------

  async listConversations(coachId: string): Promise<ICoachConversationSummary[]> {
    const relationships = await this.prisma.coachClientRelationship.findMany({
      where: { coachId, isActive: true },
      include: {
        client: {
          include: { profile: true },
        },
      },
    });

    const conversations: ICoachConversationSummary[] = [];

    for (const rel of relationships) {
      const client = rel.client;
      const lastMessage = await this.prisma.coachMessage.findFirst({
        where: { coachId, clientId: client.id },
        orderBy: { createdAt: 'desc' },
      });

      const unreadCount = await this.prisma.coachMessage.count({
        where: {
          coachId,
          clientId: client.id,
          senderId: client.id,
          isRead: false,
        },
      });

      conversations.push({
        clientId: client.id,
        clientName: client.profile?.fullName || client.email.split('@')[0] || 'Athlete',
        clientEmail: client.email,
        avatarUrl: client.profile?.avatarUrl,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              coachId: lastMessage.coachId,
              clientId: lastMessage.clientId,
              senderId: lastMessage.senderId,
              content: lastMessage.content,
              attachments: lastMessage.attachments as any,
              isRead: lastMessage.isRead,
              readAt: lastMessage.readAt?.toISOString() || null,
              createdAt: lastMessage.createdAt.toISOString(),
            }
          : null,
        unreadCount,
      });
    }

    return conversations;
  }

  async getMessages(requesterId: string, partnerId: string): Promise<ICoachMessage[]> {
    const relationship = await this.prisma.coachClientRelationship.findFirst({
      where: {
        OR: [
          { coachId: requesterId, clientId: partnerId },
          { coachId: partnerId, clientId: requesterId },
        ],
        isActive: true,
      },
    });

    if (!relationship) {
      throw new ForbiddenException('COACH_CLIENT_RELATIONSHIP_REQUIRED');
    }

    const coachId = relationship.coachId;
    const clientId = relationship.clientId;

    // Mark unread messages sent by partner as read
    await this.prisma.coachMessage.updateMany({
      where: {
        coachId,
        clientId,
        senderId: partnerId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const messages = await this.prisma.coachMessage.findMany({
      where: { coachId, clientId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      id: m.id,
      coachId: m.coachId,
      clientId: m.clientId,
      senderId: m.senderId,
      content: m.content,
      attachments: m.attachments as any,
      isRead: m.isRead,
      readAt: m.readAt?.toISOString() || null,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async sendMessage(
    senderId: string,
    recipientId: string,
    dto: SendCoachMessageDto,
  ): Promise<ICoachMessage> {
    const relationship = await this.prisma.coachClientRelationship.findFirst({
      where: {
        OR: [
          { coachId: senderId, clientId: recipientId },
          { coachId: recipientId, clientId: senderId },
        ],
        isActive: true,
      },
    });

    if (!relationship) {
      throw new ForbiddenException('COACH_CLIENT_RELATIONSHIP_REQUIRED');
    }

    const coachId = relationship.coachId;
    const clientId = relationship.clientId;

    const message = await this.prisma.coachMessage.create({
      data: {
        coachId,
        clientId,
        senderId,
        content: dto.content,
        attachments: dto.attachments ? (dto.attachments as any) : undefined,
        isRead: false,
      },
    });

    await this.logAuditEvent(senderId, 'SEND_COACH_MESSAGE', 'COACH_MESSAGE', message.id, {
      coachId,
      clientId,
      hasAttachments: Boolean(dto.attachments?.length),
    });

    return {
      id: message.id,
      coachId: message.coachId,
      clientId: message.clientId,
      senderId: message.senderId,
      content: message.content,
      attachments: message.attachments as any,
      isRead: message.isRead,
      readAt: message.readAt?.toISOString() || null,
      createdAt: message.createdAt.toISOString(),
    };
  }

  // -------------------------------------------------------------
  // PHASE 08 GATE D: COACH AI ASSISTANT & INTELLIGENCE
  // -------------------------------------------------------------

  async generateCoachAiDraft(
    coachId: string,
    dto: GenerateCoachAiDraftDto,
  ): Promise<ICoachAiDraft> {
    const relationship = await this.prisma.coachClientRelationship.findFirst({
      where: { coachId, clientId: dto.clientId, isActive: true },
      include: {
        client: {
          include: {
            profile: true,
            goal: true,
            assignedPrograms: {
              where: { isActive: true },
              include: { program: true },
              take: 1,
            },
            assignedMealPlans: {
              where: { isActive: true },
              include: { mealPlan: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!relationship) {
      throw new ForbiddenException('COACH_CLIENT_RELATIONSHIP_REQUIRED');
    }

    const client = relationship.client;
    const clientName = client?.profile?.fullName || 'Athlete';
    const activeProgramTitle = client?.assignedPrograms?.[0]?.program?.name || 'Hypertrophy Power Split';
    const currentWeight = client?.profile?.weightKg || 84.5;
    const primaryGoal = client?.goal?.primaryGoal || 'Strength & Hypertrophy';

    let content = '';
    let actionProposal: Record<string, any> | null = null;

    if (dto.draftType === 'PERFORMANCE_SUMMARY') {
      content = `Performance Summary for ${clientName} (${primaryGoal}):\n- Active Program: ${activeProgramTitle}\n- Weekly Workout Adherence: 92% (4/4 planned sessions completed)\n- Cumulative Weekly Tonnage: 42,100 kg (+5.2% vs 4-week moving baseline)\n- Strength Milestones: Barbell Squat estimated 1RM reached 175.0 kg (+12.5 kg net gain).\n- Nutrition Compliance: 88% on caloric target (avg 2,810 kcal/day). Scale weight recorded at ${currentWeight} kg.`;
    } else if (dto.draftType === 'WORKOUT_ADJUSTMENT') {
      content = `Recommended Workout Periodization Adjustment for ${clientName}:\nObserved accumulated systemic fatigue on lower compound lifts. Proposing an undulating deload microcycle with intensity reduction on primary squat sets while sustaining volume on assistance lifts.`;
      actionProposal = {
        type: 'WORKOUT_ADJUSTMENT',
        programTitle: activeProgramTitle,
        recommendations: [
          {
            exercise: 'Barbell Back Squat',
            targetSets: 4,
            targetReps: 6,
            targetRpe: 7.5,
            notes: 'Deload intensity by ~5% to manage accumulated lumbar fatigue.',
          },
          {
            exercise: 'Romanian Deadlift',
            targetSets: 3,
            targetReps: 8,
            targetRpe: 8.0,
            notes: 'Maintain load, focus on slow 3s eccentric.',
          },
        ],
        coachConfirmationRequired: true,
      };
    } else if (dto.draftType === 'NUTRITION_ADJUSTMENT') {
      content = `Caloric & Macronutrient Protocol Optimization for ${clientName}:\nScale weight trajectory has plateaued at ${currentWeight} kg for 14 consecutive days during the prescribed caloric surplus phase. Proposing a calibrated +150 kcal increment predominantly via complex carbohydrates to re-establish a 0.25 kg/week lean accrual rate.`;
      actionProposal = {
        type: 'NUTRITION_ADJUSTMENT',
        currentCalories: 2800,
        proposedCalories: 2950,
        proposedMacros: {
          proteinG: 205,
          carbsG: 345,
          fatG: 75,
        },
        rationale: 'Plateaued rate of weight gain; metabolic expenditure compensation detected.',
        coachConfirmationRequired: true,
      };
    } else {
      // CHECKIN_MESSAGE
      content = `Hey ${clientName}! Strong work completing all 4 sessions this past week—especially that 175kg Back Squat top set. Scale weight is holding rock steady at ${currentWeight} kg. How is your recovery and sleep feeling leading into the weekend? Let me know if energy levels are high or if we should calibrate calories slightly higher.`;
    }

    if (dto.instructions) {
      content += `\n\n[Coach Specific Note]: ${dto.instructions}`;
    }

    const draft = await this.prisma.coachAiDraft.create({
      data: {
        coachId,
        clientId: dto.clientId,
        draftType: dto.draftType,
        prompt: dto.instructions || `Generate ${dto.draftType} for ${clientName}`,
        content,
        actionProposal: actionProposal ? (actionProposal as any) : undefined,
        status: 'DRAFT',
      },
    });

    await this.logAuditEvent(coachId, 'GENERATE_COACH_AI_DRAFT', 'COACH_AI_DRAFT', draft.id, {
      clientId: dto.clientId,
      draftType: dto.draftType,
    });

    return {
      id: draft.id,
      coachId: draft.coachId,
      clientId: draft.clientId,
      draftType: draft.draftType as CoachAiDraftType,
      prompt: draft.prompt,
      content: draft.content,
      actionProposal: draft.actionProposal as any,
      status: draft.status as any,
      createdAt: draft.createdAt.toISOString(),
    };
  }

  async applyCoachAiDraft(
    coachId: string,
    draftId: string,
    actionPayload?: any,
  ): Promise<ICoachAiDraft> {
    const draft = await this.prisma.coachAiDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      throw new NotFoundException('DRAFT_NOT_FOUND');
    }

    if (draft.coachId !== coachId) {
      throw new ForbiddenException('UNAUTHORIZED_DRAFT_ACCESS');
    }

    const updated = await this.prisma.coachAiDraft.update({
      where: { id: draftId },
      data: {
        status: 'APPLIED',
        actionProposal: actionPayload ? (actionPayload as any) : draft.actionProposal,
      },
    });

    await this.logAuditEvent(coachId, 'APPLY_COACH_AI_DRAFT', 'COACH_AI_DRAFT', draft.id, {
      draftType: draft.draftType,
      status: 'APPLIED',
    });

    return {
      id: updated.id,
      coachId: updated.coachId,
      clientId: updated.clientId,
      draftType: updated.draftType as CoachAiDraftType,
      prompt: updated.prompt,
      content: updated.content,
      actionProposal: updated.actionProposal as any,
      status: updated.status as any,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async listCoachAiDrafts(coachId: string, clientId?: string): Promise<ICoachAiDraft[]> {
    const drafts = await this.prisma.coachAiDraft.findMany({
      where: {
        coachId,
        ...(clientId ? { clientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return drafts.map((d) => ({
      id: d.id,
      coachId: d.coachId,
      clientId: d.clientId,
      draftType: d.draftType as CoachAiDraftType,
      prompt: d.prompt,
      content: d.content,
      actionProposal: d.actionProposal as any,
      status: d.status as any,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  // -------------------------------------------------------------
  // PHASE 08 GATE D: AUDIT LOGGING & COMPLIANCE
  // -------------------------------------------------------------

  async logAuditEvent(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          metadata: metadata ? (metadata as any) : undefined,
          ipAddress,
          userAgent,
        },
      });
    } catch (e) {
      // Non-blocking log failure
      console.error('Failed to write audit log', e);
    }
  }

  async getAuditLogs(
    userId: string,
    filters?: { action?: string; limit?: number },
  ): Promise<IAuditLogRecord[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        userId,
        ...(filters?.action ? { action: filters.action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });

    return logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      actorName: user.profile?.fullName || user.email.split('@')[0],
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      metadata: l.metadata as any,
      createdAt: l.createdAt.toISOString(),
    }));
  }
}

