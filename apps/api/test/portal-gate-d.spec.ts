import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PortalService } from '../src/modules/portal/portal.service';
import { PrismaService } from '../src/modules/database/prisma.service';
import { UserRole, ClientStatus } from '@alpha/types';

describe('Phase 08 Gate D — Messaging, Coach AI Assistant & Audit Logging', () => {
  let portalService: PortalService;

  // In-memory mock database state
  let users: any[] = [];
  let relationships: any[] = [];
  let coachMessages: any[] = [];
  let coachAiDrafts: any[] = [];
  let auditLogs: any[] = [];

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const user = users.find((u) => u.id === where.id || u.email === where.email);
        if (!user) return null;
        return {
          ...user,
          profile: user.profile,
          goal: { primaryGoal: 'Hypertrophy & Strength' },
          assignedPrograms: [
            {
              id: 'assign_1',
              isActive: true,
              program: { id: 'prog_1', name: 'Hypertrophy Power Split' },
            },
          ],
          assignedMealPlans: [],
        };
      }),
    },
    coachClientRelationship: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const rel = relationships.find((r) => {
          if (where.OR) {
            const matchesOr = where.OR.some(
              (cond: any) =>
                cond.coachId === r.coachId && cond.clientId === r.clientId,
            );
            if (!matchesOr) return false;
          }
          if (where.coachId && r.coachId !== where.coachId) return false;
          if (where.clientId && r.clientId !== where.clientId) return false;
          if (where.isActive !== undefined && r.isActive !== where.isActive) return false;
          return true;
        });
        if (!rel) return null;
        const clientUser = users.find((u) => u.id === rel.clientId);
        return {
          ...rel,
          client: {
            ...clientUser,
            profile: clientUser?.profile,
            goal: { primaryGoal: 'Hypertrophy & Strength' },
            assignedPrograms: [
              {
                id: 'assign_1',
                isActive: true,
                program: { id: 'prog_1', name: 'Hypertrophy Power Split' },
              },
            ],
            assignedMealPlans: [],
          },
        };
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return relationships
          .filter((r) => {
            if (where.coachId && r.coachId !== where.coachId) return false;
            if (where.isActive !== undefined && r.isActive !== where.isActive) return false;
            return true;
          })
          .map((r) => {
            const clientUser = users.find((u) => u.id === r.clientId);
            return {
              ...r,
              client: {
                ...clientUser,
                profile: clientUser?.profile,
              },
            };
          });
      }),
    },
    coachMessage: {
      create: jest.fn().mockImplementation(({ data }) => {
        const msg = {
          id: `msg_${Date.now()}_${Math.random()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        coachMessages.push(msg);
        return msg;
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return coachMessages.filter(
          (m) => m.coachId === where.coachId && m.clientId === where.clientId,
        );
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const msgs = coachMessages
          .filter((m) => m.coachId === where.coachId && m.clientId === where.clientId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return msgs[0] || null;
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        coachMessages.forEach((m) => {
          if (
            m.coachId === where.coachId &&
            m.clientId === where.clientId &&
            m.senderId === where.senderId &&
            (!where.isRead !== undefined ? m.isRead === where.isRead : true)
          ) {
            Object.assign(m, data);
            count++;
          }
        });
        return { count };
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        return coachMessages.filter((m) => {
          if (where.coachId && m.coachId !== where.coachId) return false;
          if (where.clientId && m.clientId !== where.clientId) return false;
          if (where.senderId && m.senderId !== where.senderId) return false;
          if (where.isRead !== undefined && m.isRead !== where.isRead) return false;
          return true;
        }).length;
      }),
    },
    coachAiDraft: {
      create: jest.fn().mockImplementation(({ data }) => {
        const draft = {
          id: `draft_${Date.now()}_${Math.random()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        coachAiDrafts.push(draft);
        return draft;
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return coachAiDrafts.find((d) => d.id === where.id) || null;
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return coachAiDrafts
          .filter((d) => {
            if (where.coachId && d.coachId !== where.coachId) return false;
            if (where.clientId && d.clientId !== where.clientId) return false;
            return true;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const draft = coachAiDrafts.find((d) => d.id === where.id);
        if (draft) {
          Object.assign(draft, data, { updatedAt: new Date() });
        }
        return draft;
      }),
    },
    auditLog: {
      create: jest.fn().mockImplementation(({ data }) => {
        const log = {
          id: `audit_${Date.now()}_${Math.random()}`,
          ...data,
          createdAt: new Date(),
        };
        auditLogs.push(log);
        return log;
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return auditLogs
          .filter((l) => {
            if (where.userId && l.userId !== where.userId) return false;
            if (where.action && l.action !== where.action) return false;
            return true;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }),
    },
  };

  beforeEach(async () => {
    // Reset collections
    users = [
      {
        id: 'coach_1',
        email: 'coach.marcus@apex.com',
        role: UserRole.COACH,
        organizationId: 'org_apex',
        profile: { fullName: 'Coach Marcus', avatarUrl: null, weightKg: 85 },
      },
      {
        id: 'coach_other',
        email: 'coach.rival@rivalgym.com',
        role: UserRole.COACH,
        organizationId: 'org_rival',
        profile: { fullName: 'Coach Rival', avatarUrl: null, weightKg: 90 },
      },
      {
        id: 'client_1',
        email: 'athlete.vance@alpha.fit',
        role: UserRole.ATHLETE,
        organizationId: 'org_apex',
        profile: { fullName: 'Marcus Vance', avatarUrl: null, weightKg: 84.5 },
      },
      {
        id: 'client_unassigned',
        email: 'athlete.stranger@other.com',
        role: UserRole.ATHLETE,
        organizationId: 'org_apex',
        profile: { fullName: 'Stranger Athlete', avatarUrl: null, weightKg: 77.0 },
      },
      {
        id: 'client_rival',
        email: 'athlete.rival@rivalgym.com',
        role: UserRole.ATHLETE,
        organizationId: 'org_rival',
        profile: { fullName: 'Rival Athlete', avatarUrl: null, weightKg: 80.0 },
      },
    ];

    relationships = [
      {
        id: 'rel_1',
        coachId: 'coach_1',
        clientId: 'client_1',
        organizationId: 'org_apex',
        status: ClientStatus.ACTIVE,
        isActive: true,
      },
      {
        id: 'rel_rival',
        coachId: 'coach_other',
        clientId: 'client_rival',
        organizationId: 'org_rival',
        status: ClientStatus.ACTIVE,
        isActive: true,
      },
    ];

    coachMessages = [
      {
        id: 'msg_seed_1',
        coachId: 'coach_1',
        clientId: 'client_1',
        senderId: 'client_1',
        content: 'Hey coach, finished the squat day! RPE felt like an 8.',
        attachments: [],
        isRead: false,
        readAt: null,
        createdAt: new Date('2026-03-18T10:00:00Z'),
        updatedAt: new Date('2026-03-18T10:00:00Z'),
      },
    ];

    coachAiDrafts = [];
    auditLogs = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    portalService = module.get<PortalService>(PortalService);
  });

  // ---------------------------------------------------------------------------
  // 1. DIRECT MESSAGING TESTS
  // ---------------------------------------------------------------------------
  describe('Direct Messaging Between Coach & Client', () => {
    it('1. should list conversations with assigned clients, last message, and unread counts', async () => {
      const conversations = await portalService.listConversations('coach_1');

      expect(conversations).toHaveLength(1);
      const conv = conversations[0]!;
      expect(conv.clientId).toBe('client_1');
      expect(conv.clientName).toBe('Marcus Vance');
      expect(conv.unreadCount).toBe(1);
      expect(conv.lastMessage?.content).toContain('finished the squat day');
    });

    it('2. should allow coach to send message to assigned client', async () => {
      const sent = await portalService.sendMessage('coach_1', 'client_1', {
        content: 'Awesome job on the squats! We will keep that load next week.',
      });

      expect(sent).toBeDefined();
      expect(sent.senderId).toBe('coach_1');
      expect(sent.content).toContain('Awesome job');
      expect(sent.isRead).toBe(false);
    });

    it('3. should allow client to send message to assigned coach', async () => {
      const sent = await portalService.sendMessage('client_1', 'coach_1', {
        content: 'Sounds good, starting meal prep now.',
      });

      expect(sent).toBeDefined();
      expect(sent.senderId).toBe('client_1');
      expect(sent.content).toContain('starting meal prep');
    });

    it('4. should retrieve message thread and mark messages as read for recipient', async () => {
      // Coach retrieves thread where client had sent an unread message
      const thread = await portalService.getMessages('coach_1', 'client_1');

      expect(thread.length).toBeGreaterThanOrEqual(1);

      // Verify unread count is now 0 after reading
      const conversations = await portalService.listConversations('coach_1');
      expect(conversations[0]!.unreadCount).toBe(0);
    });

    it('5. should reject sending message to unassigned client (403 COACH_CLIENT_RELATIONSHIP_REQUIRED)', async () => {
      await expect(
        portalService.sendMessage('coach_1', 'client_unassigned', {
          content: 'Hello unassigned client',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('6. should reject retrieving messages for unassigned client (403)', async () => {
      await expect(
        portalService.getMessages('coach_1', 'client_unassigned'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. COACH AI ASSISTANT TESTS
  // ---------------------------------------------------------------------------
  describe('Coach AI Assistant & Coaching Intelligence', () => {
    it('7. should generate a coach AI performance summary draft for assigned client', async () => {
      const draft = await portalService.generateCoachAiDraft('coach_1', {
        clientId: 'client_1',
        draftType: 'PERFORMANCE_SUMMARY',
        instructions: 'Highlight 1RM squat improvement',
      });

      expect(draft).toBeDefined();
      expect(draft.draftType).toBe('PERFORMANCE_SUMMARY');
      expect(draft.content).toContain('Marcus Vance');
      expect(draft.content).toContain('Weekly Workout Adherence');
      expect(draft.status).toBe('DRAFT');
    });

    it('8. should generate a coach AI workout adjustment draft with structured action proposal', async () => {
      const draft = await portalService.generateCoachAiDraft('coach_1', {
        clientId: 'client_1',
        draftType: 'WORKOUT_ADJUSTMENT',
      });

      expect(draft.draftType).toBe('WORKOUT_ADJUSTMENT');
      expect(draft.actionProposal).toBeDefined();
      expect(draft.actionProposal?.type).toBe('WORKOUT_ADJUSTMENT');
      expect(draft.actionProposal?.recommendations).toHaveLength(2);
      expect(draft.actionProposal?.coachConfirmationRequired).toBe(true);
    });

    it('9. should generate a coach AI nutrition adjustment draft with caloric and macro proposals', async () => {
      const draft = await portalService.generateCoachAiDraft('coach_1', {
        clientId: 'client_1',
        draftType: 'NUTRITION_ADJUSTMENT',
      });

      expect(draft.draftType).toBe('NUTRITION_ADJUSTMENT');
      expect(draft.actionProposal).toBeDefined();
      expect(draft.actionProposal?.type).toBe('NUTRITION_ADJUSTMENT');
      expect(draft.actionProposal?.proposedCalories).toBe(2950);
      expect(draft.actionProposal?.proposedMacros.proteinG).toBe(205);
    });

    it('10. should generate a coach AI checkin message draft', async () => {
      const draft = await portalService.generateCoachAiDraft('coach_1', {
        clientId: 'client_1',
        draftType: 'CHECKIN_MESSAGE',
      });

      expect(draft.draftType).toBe('CHECKIN_MESSAGE');
      expect(draft.content).toContain('Marcus');
      expect(draft.content).toContain('sleep');
    });

    it('11. should reject generating coach AI draft for unassigned client (403)', async () => {
      await expect(
        portalService.generateCoachAiDraft('coach_1', {
          clientId: 'client_unassigned',
          draftType: 'PERFORMANCE_SUMMARY',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('12. should allow coach to apply/confirm coach AI draft, transitioning status to APPLIED', async () => {
      const draft = await portalService.generateCoachAiDraft('coach_1', {
        clientId: 'client_1',
        draftType: 'WORKOUT_ADJUSTMENT',
      });

      const applied = await portalService.applyCoachAiDraft('coach_1', draft.id);

      expect(applied.status).toBe('APPLIED');
    });

    it('13. should prevent unauthorized coach from applying another coach draft (403)', async () => {
      const draft = await portalService.generateCoachAiDraft('coach_1', {
        clientId: 'client_1',
        draftType: 'WORKOUT_ADJUSTMENT',
      });

      await expect(
        portalService.applyCoachAiDraft('coach_other', draft.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. SECURITY, AUDIT & TENANT ISOLATION TESTS
  // ---------------------------------------------------------------------------
  describe('Security, Audit & Cross-Tenant Access', () => {
    it('14. should record audit logs for coach operations (messages, drafts, programs, offboarding)', async () => {
      await portalService.sendMessage('coach_1', 'client_1', {
        content: 'Checking in on recovery.',
      });

      await portalService.generateCoachAiDraft('coach_1', {
        clientId: 'client_1',
        draftType: 'PERFORMANCE_SUMMARY',
      });

      const logs = await portalService.getAuditLogs('coach_1');

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.some((l) => l.action === 'SEND_COACH_MESSAGE')).toBe(true);
      expect(logs.some((l) => l.action === 'GENERATE_COACH_AI_DRAFT')).toBe(true);
    });

    it('15. should enforce multi-tenant isolation across organizations in messaging and AI drafts', async () => {
      // Coach 1 (Apex) attempts to message Rival Athlete (Rival Gym)
      await expect(
        portalService.sendMessage('coach_1', 'client_rival', {
          content: 'Cross-tenant message attempt',
        }),
      ).rejects.toThrow(ForbiddenException);

      // Coach 1 attempts to draft AI intelligence for Rival Athlete
      await expect(
        portalService.generateCoachAiDraft('coach_1', {
          clientId: 'client_rival',
          draftType: 'PERFORMANCE_SUMMARY',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
