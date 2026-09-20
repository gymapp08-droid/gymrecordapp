import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PortalService } from '../src/modules/portal/portal.service';
import { CoachClientGuard } from '../src/modules/portal/guards/coach-client.guard';
import { PrismaService } from '../src/modules/database/prisma.service';
import {
  UserRole,
  ClientStatus,
  InvitationStatus,
  IAuthUser,
  AccountStatus,
} from '@alpha/types';

describe('Phase 08 Gate A — Portal RBAC, Organizations, Invitations & Tenant Isolation', () => {
  let portalService: PortalService;
  let coachClientGuard: CoachClientGuard;

  // In-memory mock database state
  let organizations: any[] = [];
  let users: any[] = [];
  let relationships: any[] = [];
  let invitations: any[] = [];

  const mockPrisma = {
    organization: {
      create: jest.fn().mockImplementation(({ data }) => {
        const org = { id: `org_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        organizations.push(org);
        return Promise.resolve(org);
      }),
      findUnique: jest.fn().mockImplementation(({ where, include }) => {
        const org = organizations.find((o) => (where.id && o.id === where.id) || (where.slug && o.slug === where.slug));
        if (!org) return Promise.resolve(null);
        if (include?.users) {
          const orgUsers = users.filter((u) => u.organizationId === org.id);
          return Promise.resolve({ ...org, users: orgUsers });
        }
        return Promise.resolve(org);
      }),
    },
    user: {
      create: jest.fn().mockImplementation(({ data }) => {
        const u = { id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        users.push(u);
        return Promise.resolve(u);
      }),
      findUnique: jest.fn().mockImplementation(({ where, include }) => {
        const u = users.find((x) => (where.id && x.id === where.id) || (where.email && x.email === where.email));
        if (!u) return Promise.resolve(null);
        if (include) {
          return Promise.resolve({
            ...u,
            profile: u.profile || { fullName: 'Test User' },
            goal: u.goal || { primaryGoal: 'HYPERTROPHY' },
            assignedPrograms: u.assignedPrograms || [],
            workoutSessions: u.workoutSessions || [],
          });
        }
        return Promise.resolve(u);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = users.findIndex((u) => u.id === where.id);
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...data, updatedAt: new Date() };
          return Promise.resolve(users[idx]);
        }
        return Promise.resolve(null);
      }),
    },
    coachClientRelationship: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.coachId_clientId) {
          const rel = relationships.find(
            (r) => r.coachId === where.coachId_clientId.coachId && r.clientId === where.coachId_clientId.clientId,
          );
          return Promise.resolve(rel || null);
        }
        if (where.id) {
          const rel = relationships.find((r) => r.id === where.id);
          return Promise.resolve(rel || null);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where, include }) => {
        let list = relationships;
        if (where?.coachId) list = list.filter((r) => r.coachId === where.coachId);
        if (where?.organizationId) list = list.filter((r) => r.organizationId === where.organizationId);
        if (where?.isActive !== undefined) list = list.filter((r) => r.isActive === where.isActive);
        if (where?.status) list = list.filter((r) => r.status === where.status);

        if (include?.client) {
          return Promise.resolve(
            list.map((r) => {
              const cl = users.find((u) => u.id === r.clientId) || { id: r.clientId, email: 'client@alpha.os' };
              return {
                ...r,
                client: {
                  ...cl,
                  profile: cl.profile || { fullName: 'Athlete One' },
                  goal: cl.goal || { primaryGoal: 'HYPERTROPHY' },
                  assignedPrograms: [],
                  workoutSessions: [],
                  updatedAt: new Date(),
                },
              };
            }),
          );
        }
        return Promise.resolve(list);
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        const idx = relationships.findIndex(
          (r) => r.coachId === where.coachId_clientId.coachId && r.clientId === where.coachId_clientId.clientId,
        );
        if (idx >= 0) {
          relationships[idx] = { ...relationships[idx], ...update, updatedAt: new Date() };
          return Promise.resolve(relationships[idx]);
        }
        const newRel = {
          id: `rel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...create,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        relationships.push(newRel);
        return Promise.resolve(newRel);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = relationships.findIndex((r) => r.id === where.id);
        if (idx >= 0) {
          relationships[idx] = { ...relationships[idx], ...data, updatedAt: new Date() };
          return Promise.resolve(relationships[idx]);
        }
        return Promise.resolve(null);
      }),
    },
    clientInvitation: {
      create: jest.fn().mockImplementation(({ data }) => {
        const inv = { id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        invitations.push(inv);
        return Promise.resolve(inv);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const inv = invitations.find((i) => (where.id && i.id === where.id) || (where.token && i.token === where.token));
        return Promise.resolve(inv || null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const inv = invitations.find((i) => {
          let match = true;
          if (where.coachId && i.coachId !== where.coachId) match = false;
          if (where.clientEmail && i.clientEmail !== where.clientEmail) match = false;
          if (where.status && i.status !== where.status) match = false;
          if (where.expiresAt?.gt && !(new Date(i.expiresAt) > where.expiresAt.gt)) match = false;
          return match;
        });
        return Promise.resolve(inv || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = invitations;
        if (where?.coachId) list = list.filter((i) => i.coachId === where.coachId);
        if (where?.status) list = list.filter((i) => i.status === where.status);
        return Promise.resolve(list);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const idx = invitations.findIndex((i) => i.id === where.id);
        if (idx >= 0) {
          invitations[idx] = { ...invitations[idx], ...data, updatedAt: new Date() };
          return Promise.resolve(invitations[idx]);
        }
        return Promise.resolve(null);
      }),
    },
  };

  beforeEach(async () => {
    organizations = [];
    users = [];
    relationships = [];
    invitations = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalService,
        CoachClientGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    portalService = module.get<PortalService>(PortalService);
    coachClientGuard = module.get<CoachClientGuard>(CoachClientGuard);
  });

  function createMockContext(user: IAuthUser, params: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          body: {},
          query: {},
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  // -------------------------------------------------------------
  // SUITE 1: RBAC PERMISSION MATRIX ENFORCEMENT
  // -------------------------------------------------------------
  describe('1. RBAC & Capability Matrix Enforcement', () => {
    it('COACH role should have full coaching capabilities except organization management', () => {
      const perms = portalService.getPermissions(UserRole.COACH);
      expect(perms.canManageClients).toBe(true);
      expect(perms.canAssignWorkouts).toBe(true);
      expect(perms.canAssignNutrition).toBe(true);
      expect(perms.canViewProgress).toBe(true);
      expect(perms.canViewActivity).toBe(true);
      expect(perms.canMessageClients).toBe(true);
      expect(perms.canGenerateReports).toBe(true);
      expect(perms.canManageOrganization).toBe(false);
    });

    it('TRAINER role can assign workouts but CANNOT assign nutrition plans', () => {
      const perms = portalService.getPermissions(UserRole.TRAINER);
      expect(perms.canAssignWorkouts).toBe(true);
      expect(perms.canAssignNutrition).toBe(false);

      expect(() => portalService.assertPermission(UserRole.TRAINER, 'canAssignWorkouts')).not.toThrow();
      expect(() => portalService.assertPermission(UserRole.TRAINER, 'canAssignNutrition')).toThrow(ForbiddenException);
    });

    it('NUTRITIONIST role can assign nutrition but CANNOT assign workout plans', () => {
      const perms = portalService.getPermissions(UserRole.NUTRITIONIST);
      expect(perms.canAssignWorkouts).toBe(false);
      expect(perms.canAssignNutrition).toBe(true);

      expect(() => portalService.assertPermission(UserRole.NUTRITIONIST, 'canAssignNutrition')).not.toThrow();
      expect(() => portalService.assertPermission(UserRole.NUTRITIONIST, 'canAssignWorkouts')).toThrow(ForbiddenException);
    });

    it('ORG_ADMIN and ADMIN roles have full capabilities including organization management', () => {
      const orgAdminPerms = portalService.getPermissions(UserRole.ORG_ADMIN);
      expect(orgAdminPerms.canManageOrganization).toBe(true);
      expect(orgAdminPerms.canManageClients).toBe(true);

      const adminPerms = portalService.getPermissions(UserRole.ADMIN);
      expect(adminPerms.canManageOrganization).toBe(true);
      expect(adminPerms.canAssignWorkouts).toBe(true);
      expect(adminPerms.canAssignNutrition).toBe(true);
    });

    it('ATHLETE role has ZERO portal capabilities', () => {
      const perms = portalService.getPermissions(UserRole.ATHLETE);
      expect(perms.canManageClients).toBe(false);
      expect(perms.canAssignWorkouts).toBe(false);
      expect(perms.canAssignNutrition).toBe(false);
      expect(() => portalService.assertPermission(UserRole.ATHLETE, 'canManageClients')).toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------
  // SUITE 2: ORGANIZATIONS & MULTI-TENANT ISOLATION
  // -------------------------------------------------------------
  describe('2. Multi-Tenant Organization Isolation', () => {
    it('creates an organization, sets slug, and associates user as ORG_ADMIN', async () => {
      const coachUser = {
        id: 'user_coach_1',
        email: 'coach1@alpha.os',
        role: UserRole.COACH,
        organizationId: null,
      };
      users.push(coachUser);

      const org = await portalService.createOrganization(coachUser.id, coachUser.role, {
        name: 'Apex Performance Gym',
      });

      expect(org).toBeDefined();
      expect(org.name).toBe('Apex Performance Gym');
      expect(org.slug).toBe('apex-performance-gym');

      const updatedUser = users.find((u) => u.id === coachUser.id);
      expect(updatedUser.organizationId).toBe(org.id);
      expect(updatedUser.role).toBe(UserRole.ORG_ADMIN);
    });

    it('MANDATORY: User in Org A attempting to access Org B throws CROSS_TENANT_ACCESS_DENIED', async () => {
      const orgA = { id: 'org_alpha', name: 'Alpha Gym', slug: 'alpha-gym', createdAt: new Date() };
      const orgB = { id: 'org_beta', name: 'Beta Gym', slug: 'beta-gym', createdAt: new Date() };
      organizations.push(orgA, orgB);

      const coachA: IAuthUser = {
        id: 'coach_A',
        email: 'coachA@alpha.os',
        role: UserRole.COACH,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
        organizationId: orgA.id,
      };
      users.push(coachA);

      await expect(portalService.getOrganization(coachA.id, coachA.organizationId, orgB.id)).rejects.toThrow(
        ForbiddenException,
      );

      try {
        await portalService.getOrganization(coachA.id, coachA.organizationId, orgB.id);
      } catch (err: any) {
        expect(err.getResponse().code).toBe('CROSS_TENANT_ACCESS_DENIED');
      }
    });

    it('Platform ADMIN can access any organization across tenancy', async () => {
      const orgA = { id: 'org_alpha', name: 'Alpha Gym', slug: 'alpha-gym', createdAt: new Date() };
      organizations.push(orgA);

      const adminUser: IAuthUser = {
        id: 'platform_admin',
        email: 'admin@alpha.os',
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
      };
      users.push(adminUser);

      const result = await portalService.getOrganization(adminUser.id, null, orgA.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(orgA.id);
    });
  });

  // -------------------------------------------------------------
  // SUITE 3: COACH-CLIENT AUTHORITATIVE ACCESS GATE (CoachClientGuard)
  // -------------------------------------------------------------
  describe('3. Coach-Client Authoritative Access Gate (Strict Isolation)', () => {
    const coach1: IAuthUser = {
      id: 'coach_1_id',
      email: 'coach1@alpha.os',
      role: UserRole.COACH,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: 'org_1',
    };

    const coach2: IAuthUser = {
      id: 'coach_2_id',
      email: 'coach2@alpha.os',
      role: UserRole.COACH,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: 'org_2',
    };

    const clientAssigned: IAuthUser = {
      id: 'client_assigned_id',
      email: 'client_assigned@alpha.os',
      role: UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: 'org_1',
    };

    const clientUnassigned: IAuthUser = {
      id: 'client_unassigned_id',
      email: 'client_unassigned@alpha.os',
      role: UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: 'org_1',
    };

    const clientOtherOrg: IAuthUser = {
      id: 'client_other_org_id',
      email: 'client_other@alpha.os',
      role: UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: 'org_2',
    };

    beforeEach(() => {
      users.push(coach1, coach2, clientAssigned, clientUnassigned, clientOtherOrg);

      // Active relationship between coach1 and clientAssigned
      relationships.push({
        id: 'rel_1',
        coachId: coach1.id,
        clientId: clientAssigned.id,
        organizationId: 'org_1',
        status: ClientStatus.ACTIVE,
        isActive: true,
      });
    });

    it('MANDATORY: Coach accessing actively assigned client => ALLOWED', async () => {
      const ctx = createMockContext(coach1, { id: clientAssigned.id });
      const allowed = await coachClientGuard.canActivate(ctx);
      expect(allowed).toBe(true);
    });

    it('MANDATORY: Coach accessing unassigned client => DENIED (CLIENT_NOT_ASSIGNED_TO_COACH)', async () => {
      const ctx = createMockContext(coach1, { id: clientUnassigned.id });
      await expect(coachClientGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);

      try {
        await coachClientGuard.canActivate(ctx);
      } catch (err: any) {
        expect(err.getResponse().code).toBe('CLIENT_NOT_ASSIGNED_TO_COACH');
      }
    });

    it('MANDATORY: Coach in Org 1 accessing Client in Org 2 => DENIED (CROSS_TENANT_ACCESS_DENIED)', async () => {
      const ctx = createMockContext(coach1, { id: clientOtherOrg.id });
      await expect(coachClientGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);

      try {
        await coachClientGuard.canActivate(ctx);
      } catch (err: any) {
        expect(err.getResponse().code).toBe('CROSS_TENANT_ACCESS_DENIED');
      }
    });

    it('Coach accessing client with ARCHIVED / INACTIVE relationship => DENIED (CLIENT_NOT_ASSIGNED_TO_COACH)', async () => {
      // Create archived relationship
      relationships.push({
        id: 'rel_archived',
        coachId: coach1.id,
        clientId: clientUnassigned.id,
        organizationId: 'org_1',
        status: ClientStatus.ARCHIVED,
        isActive: false,
      });

      const ctx = createMockContext(coach1, { id: clientUnassigned.id });
      await expect(coachClientGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('ORG_ADMIN can access any client belonging to the same organization', async () => {
      const orgAdmin: IAuthUser = {
        id: 'org_admin_1',
        email: 'orgadmin@alpha.os',
        role: UserRole.ORG_ADMIN,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
        organizationId: 'org_1',
      };
      users.push(orgAdmin);

      // Access unassigned client within same org_1
      const ctx = createMockContext(orgAdmin, { id: clientUnassigned.id });
      const allowed = await coachClientGuard.canActivate(ctx);
      expect(allowed).toBe(true);
    });

    it('Platform ADMIN can access any client across organizations', async () => {
      const platformAdmin: IAuthUser = {
        id: 'sys_admin',
        email: 'admin@alpha.os',
        role: UserRole.ADMIN,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
      };
      users.push(platformAdmin);

      const ctx = createMockContext(platformAdmin, { id: clientOtherOrg.id });
      const allowed = await coachClientGuard.canActivate(ctx);
      expect(allowed).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // SUITE 4: INVITATION LIFECYCLE (Invite -> Accept -> Connect)
  // -------------------------------------------------------------
  describe('4. Client Invitation Lifecycle', () => {
    const coach: IAuthUser = {
      id: 'coach_inviter',
      email: 'coach@alpha.os',
      role: UserRole.COACH,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: 'org_prime',
    };

    const targetEmail = 'newathlete@alpha.os';

    it('Coach can generate a secure client invitation with 7-day expiration', async () => {
      const invite = await portalService.inviteClient(coach.id, coach.role, coach.organizationId, {
        email: targetEmail,
      });

      expect(invite).toBeDefined();
      expect(invite.coachId).toBe(coach.id);
      expect(invite.clientEmail).toBe(targetEmail);
      expect(invite.status).toBe(InvitationStatus.PENDING);
      expect(invite.token).toBeDefined();
      expect(invite.token.length).toBe(64); // 32 bytes hex
      expect(new Date(invite.expiresAt).getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    });

    it('Rejects duplicate pending invitation for the same coach and email', async () => {
      await portalService.inviteClient(coach.id, coach.role, coach.organizationId, {
        email: targetEmail,
      });

      await expect(
        portalService.inviteClient(coach.id, coach.role, coach.organizationId, { email: targetEmail }),
      ).rejects.toThrow(ConflictException);
    });

    it('Rejects invitation if client already has an active relationship with this coach', async () => {
      const existingClient = {
        id: 'client_already_active',
        email: 'connected@alpha.os',
        role: UserRole.ATHLETE,
      };
      users.push(existingClient);

      relationships.push({
        id: 'rel_active',
        coachId: coach.id,
        clientId: existingClient.id,
        status: ClientStatus.ACTIVE,
        isActive: true,
      });

      await expect(
        portalService.inviteClient(coach.id, coach.role, coach.organizationId, { email: existingClient.email }),
      ).rejects.toThrow(ConflictException);
    });

    it('Athlete successfully accepts invitation: activates CoachClientRelationship', async () => {
      const invite = await portalService.inviteClient(coach.id, coach.role, coach.organizationId, {
        email: 'athlete_accepts@alpha.os',
      });

      const athleteUser = {
        id: 'athlete_new_id',
        email: 'athlete_accepts@alpha.os',
        role: UserRole.ATHLETE,
        organizationId: null,
      };
      users.push(athleteUser);

      const result = await portalService.acceptInvitation(athleteUser.id, athleteUser.email, {
        token: invite.token,
      });

      expect(result.success).toBe(true);
      expect(result.coachId).toBe(coach.id);
      expect(result.status).toBe(ClientStatus.ACTIVE);

      // Invitation is marked ACCEPTED
      const updatedInvite = invitations.find((i) => i.id === invite.id);
      expect(updatedInvite.status).toBe(InvitationStatus.ACCEPTED);
      expect(updatedInvite.acceptedAt).toBeDefined();

      // Relationship is established and active
      const rel = relationships.find((r) => r.coachId === coach.id && r.clientId === athleteUser.id);
      expect(rel).toBeDefined();
      expect(rel.isActive).toBe(true);
      expect(rel.status).toBe(ClientStatus.ACTIVE);
      expect(rel.organizationId).toBe(coach.organizationId);
    });

    it('Rejects acceptance when client email does not match invitation email (Security Protection)', async () => {
      const invite = await portalService.inviteClient(coach.id, coach.role, coach.organizationId, {
        email: 'intended_recipient@alpha.os',
      });

      const imposter = {
        id: 'imposter_id',
        email: 'imposter@alpha.os',
        role: UserRole.ATHLETE,
      };
      users.push(imposter);

      await expect(
        portalService.acceptInvitation(imposter.id, imposter.email, { token: invite.token }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Rejects expired invitation and transitions status to EXPIRED', async () => {
      const expiredInvite = {
        id: 'inv_expired',
        coachId: coach.id,
        clientEmail: 'expired_client@alpha.os',
        role: UserRole.ATHLETE,
        status: InvitationStatus.PENDING,
        token: 'expired_token_123',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      };
      invitations.push(expiredInvite);

      const athlete = {
        id: 'athlete_exp',
        email: 'expired_client@alpha.os',
        role: UserRole.ATHLETE,
      };
      users.push(athlete);

      await expect(
        portalService.acceptInvitation(athlete.id, athlete.email, { token: expiredInvite.token }),
      ).rejects.toThrow(BadRequestException);

      const updated = invitations.find((i) => i.id === expiredInvite.id);
      expect(updated.status).toBe(InvitationStatus.EXPIRED);
    });

    it('Coach can cancel a pending invitation; cancelled invitation cannot be accepted', async () => {
      const invite = await portalService.inviteClient(coach.id, coach.role, coach.organizationId, {
        email: 'cancel_me@alpha.os',
      });

      await portalService.cancelInvitation(coach.id, invite.id);

      const updated = invitations.find((i) => i.id === invite.id);
      expect(updated.status).toBe(InvitationStatus.CANCELLED);

      const athlete = { id: 'athlete_canc', email: 'cancel_me@alpha.os', role: UserRole.ATHLETE };
      users.push(athlete);

      await expect(
        portalService.acceptInvitation(athlete.id, athlete.email, { token: invite.token }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------------------------------------------------
  // SUITE 5: SAFE OFFBOARDING & CLIENT ARCHIVING
  // -------------------------------------------------------------
  describe('5. Safe Client Offboarding & Archiving', () => {
    const coach: IAuthUser = {
      id: 'coach_archive_tester',
      email: 'coach@alpha.os',
      role: UserRole.COACH,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: 'org_1',
    };

    const client: IAuthUser = {
      id: 'client_to_archive',
      email: 'athlete_archive@alpha.os',
      role: UserRole.ATHLETE,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
      organizationId: 'org_1',
    };

    beforeEach(() => {
      users.push(coach, client);
      relationships.push({
        id: 'rel_archive_test',
        coachId: coach.id,
        clientId: client.id,
        organizationId: 'org_1',
        status: ClientStatus.ACTIVE,
        isActive: true,
      });
    });

    it('MANDATORY: Archiving client deactivates relationship without deleting client data', async () => {
      const updatedRel = await portalService.updateClientStatus(coach.id, coach.role, client.id, {
        status: ClientStatus.ARCHIVED,
      });

      expect(updatedRel.status).toBe(ClientStatus.ARCHIVED);
      expect(updatedRel.isActive).toBe(false);

      // Verify client user account still exists completely intact
      const clientUser = users.find((u) => u.id === client.id);
      expect(clientUser).toBeDefined();
      expect(clientUser.email).toBe(client.email);

      // Verify coach can no longer access archived client via CoachClientGuard
      const ctx = createMockContext(coach, { id: client.id });
      await expect(coachClientGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('Reactivating an archived client sets status back to ACTIVE and isActive to true', async () => {
      // First archive
      await portalService.updateClientStatus(coach.id, coach.role, client.id, {
        status: ClientStatus.ARCHIVED,
      });

      // Then reactivate
      const reactivated = await portalService.updateClientStatus(coach.id, coach.role, client.id, {
        status: ClientStatus.ACTIVE,
      });

      expect(reactivated.status).toBe(ClientStatus.ACTIVE);
      expect(reactivated.isActive).toBe(true);

      // Coach can now access client again
      const ctx = createMockContext(coach, { id: client.id });
      const allowed = await coachClientGuard.canActivate(ctx);
      expect(allowed).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // SUITE 6: CLIENT SUMMARY & SCOPED LISTING
  // -------------------------------------------------------------
  describe('6. Scoped Client Listing & Profile Summary', () => {
    it('returns only assigned active clients for the requesting coach', async () => {
      const coachA: IAuthUser = {
        id: 'coach_listing_A',
        email: 'coachA@alpha.os',
        role: UserRole.COACH,
        status: AccountStatus.ACTIVE,
        isEmailVerified: true,
      };
      const client1 = { id: 'cl_1', email: 'cl1@alpha.os', role: UserRole.ATHLETE };
      const client2 = { id: 'cl_2', email: 'cl2@alpha.os', role: UserRole.ATHLETE };
      users.push(coachA, client1, client2);

      // Coach A only assigned client1
      relationships.push({
        id: 'rel_list_1',
        coachId: coachA.id,
        clientId: client1.id,
        status: ClientStatus.ACTIVE,
        isActive: true,
      });

      const clients = await portalService.listClients(coachA.id, coachA.role);
      expect(clients).toHaveLength(1);
      expect(clients[0]!.clientId).toBe(client1.id);
      expect(clients[0]!.status).toBe(ClientStatus.ACTIVE);
    });
  });
});
