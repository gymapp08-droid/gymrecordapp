import React, { useState } from 'react';
import {
  UserRole,
  ClientStatus,
  ProgramStatus,
  IPortalClientSummary,
  IProgramDetail,
  IClientDetailDossier,
  ICoachCalendarEvent,
  ReportType,
  IReportDataSummary,
  ICoachConversationSummary,
  ICoachMessage,
  CoachAiDraftType,
  ICoachAiDraft,
  IAuditLogRecord,
} from '@alpha/types';
import { STITCH_THEME } from '../styles/stitch-theme';
import { Sidebar, PortalTab } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import { ClientListTable } from '../components/ClientListTable';
import { ClientDetailView } from '../components/ClientDetailView';
import { ProgramBuilder } from '../components/ProgramBuilder';
import { NutritionPlanBuilder } from '../components/NutritionPlanBuilder';
import { ProgramAssignModal } from '../components/ProgramAssignModal';
import { ReplaceProgramModal } from '../components/ReplaceProgramModal';
import { InviteClientModal } from '../components/InviteClientModal';
import { SafeOffboardingModal } from '../components/SafeOffboardingModal';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { CalendarView } from '../components/CalendarView';
import { ReportsView } from '../components/ReportsView';
import { MessagesView } from '../components/MessagesView';
import { CoachAiDrawer } from '../components/CoachAiDrawer';
import { WeeklyCheckInsView } from '../components/WeeklyCheckInsView';
import { AdminDashboardView } from '../components/AdminDashboardView';
import { ExecutiveDashboardView } from '../components/ExecutiveDashboardView';
import { ExerciseManagementView } from '../components/ExerciseManagementView';
import { WorkoutManagementView } from '../components/WorkoutManagementView';
import { TrainerManagementView } from '../components/TrainerManagementView';
import { SystemSettingsView } from '../components/SystemSettingsView';
import { AuthGuard } from '../components/AuthGuard';
import { WebErrorBoundary } from '../components/WebErrorBoundary';
import { IAuthUser } from '@alpha/types';

// Initial seed programs
const INITIAL_PROGRAMS: IProgramDetail[] = [
  {
    id: 'prog_hypertrophy_v1',
    creatorId: 'user_coach_1',
    name: 'Hypertrophy Power Split V1',
    description: '4-Day undulating periodization for maximum muscle accrual and foundation strength.',
    weeksCount: 8,
    status: ProgramStatus.PUBLISHED,
    version: 1,
    createdAt: new Date('2026-01-10T00:00:00Z'),
    updatedAt: new Date('2026-01-10T00:00:00Z'),
    days: [
      {
        id: 'day_1',
        dayOfWeek: 1,
        title: 'Lower Body Focus A',
        exercises: [
          {
            id: 'pe_1',
            exerciseId: 'ex_squat',
            exerciseName: 'Barbell Back Squat',
            primaryMuscle: 'Quadriceps',
            orderIndex: 0,
            targetSets: 4,
            targetReps: 6,
            restSeconds: 150,
            targetRpe: 8,
            notes: 'High bar, controlled eccentric',
          },
          {
            id: 'pe_2',
            exerciseId: 'ex_rdl',
            exerciseName: 'Romanian Deadlift',
            primaryMuscle: 'Hamstrings',
            orderIndex: 1,
            targetSets: 3,
            targetReps: 8,
            restSeconds: 120,
            targetRpe: 8,
            notes: 'Hamstring stretch at bottom',
          },
        ],
      },
      {
        id: 'day_2',
        dayOfWeek: 2,
        title: 'Upper Body Power',
        exercises: [
          {
            id: 'pe_3',
            exerciseId: 'ex_bench',
            exerciseName: 'Barbell Bench Press',
            primaryMuscle: 'Chest',
            orderIndex: 0,
            targetSets: 4,
            targetReps: 5,
            restSeconds: 120,
            targetRpe: 8.5,
            notes: 'Arch tight, pause on chest',
          },
          {
            id: 'pe_4',
            exerciseId: 'ex_pullup',
            exerciseName: 'Weighted Pull-Up',
            primaryMuscle: 'Lats',
            orderIndex: 1,
            targetSets: 3,
            targetReps: 8,
            restSeconds: 90,
            targetRpe: 8,
            notes: 'Deadhang at bottom',
          },
        ],
      },
    ],
  },
  {
    id: 'prog_recomp_v2',
    creatorId: 'user_coach_1',
    name: 'Athletic Recomp & Conditioning V2',
    description: 'Metabolic hypertrophy with integrated zone 2 cardio progressions.',
    weeksCount: 6,
    status: ProgramStatus.PUBLISHED,
    version: 2,
    createdAt: new Date('2026-02-01T00:00:00Z'),
    updatedAt: new Date('2026-02-01T00:00:00Z'),
    days: [
      {
        id: 'day_r1',
        dayOfWeek: 1,
        title: 'Full Body Compound A',
        exercises: [
          {
            id: 'pe_r1',
            exerciseId: 'ex_trapbar',
            exerciseName: 'Trap Bar Deadlift',
            primaryMuscle: 'Full Body',
            orderIndex: 0,
            targetSets: 5,
            targetReps: 5,
            restSeconds: 120,
            targetRpe: 8,
            notes: 'Neutral spine, drive through floor',
          },
        ],
      },
    ],
  },
];

// Initial seed clients
const INITIAL_CLIENTS: IPortalClientSummary[] = [
  {
    clientId: 'ath_1',
    fullName: 'Marcus Vance',
    email: 'marcus.v@alpha.fit',
    avatarUrl: undefined,
    status: ClientStatus.ACTIVE,
    primaryGoal: 'Hypertrophy & Strength',
    currentProgramTitle: 'Hypertrophy Power Split V1',
    workoutConsistencyPercent: 92,
    nutritionAdherencePercent: 88,
    lastWorkoutDate: '2026-03-16T14:30:00Z',
    lastActiveAt: '2 hours ago',
  },
  {
    clientId: 'ath_2',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@alpha.fit',
    avatarUrl: undefined,
    status: ClientStatus.ACTIVE,
    primaryGoal: 'Body Recomposition',
    currentProgramTitle: 'Athletic Recomp & Conditioning V2',
    workoutConsistencyPercent: 88,
    nutritionAdherencePercent: 95,
    lastWorkoutDate: '2026-03-15T10:00:00Z',
    lastActiveAt: 'Yesterday',
  },
  {
    clientId: 'ath_3',
    fullName: 'David Kalu',
    email: 'd.kalu@athlete.org',
    avatarUrl: undefined,
    status: ClientStatus.INVITED,
    primaryGoal: 'Athletic Conditioning',
    currentProgramTitle: undefined,
    workoutConsistencyPercent: 0,
    nutritionAdherencePercent: null,
    lastWorkoutDate: null,
    lastActiveAt: 'Invited 2d ago',
  },
  {
    clientId: 'ath_4',
    fullName: 'Sarah Chen',
    email: 'sarah.chen@techgym.io',
    avatarUrl: undefined,
    status: ClientStatus.ACTIVE,
    primaryGoal: 'Strength & Powerlifting',
    currentProgramTitle: 'Hypertrophy Power Split V1',
    workoutConsistencyPercent: 96,
    nutritionAdherencePercent: 91,
    lastWorkoutDate: '2026-03-16T11:00:00Z',
    lastActiveAt: '3 hours ago',
  },
  {
    clientId: 'ath_5',
    fullName: 'Lucas Bennett',
    email: 'lucas.b@fitness.com',
    avatarUrl: undefined,
    status: ClientStatus.ARCHIVED,
    primaryGoal: 'Fat Loss',
    currentProgramTitle: undefined,
    workoutConsistencyPercent: 74,
    nutritionAdherencePercent: 65,
    lastWorkoutDate: '2026-02-28T09:00:00Z',
    lastActiveAt: '2 weeks ago',
  },
];

// Initial seed calendar events
const INITIAL_EVENTS: ICoachCalendarEvent[] = [
  {
    id: 'evt_1',
    coachId: 'user_coach_1',
    clientId: 'ath_1',
    clientName: 'Marcus Vance',
    eventType: 'PLANNED_WORKOUT',
    title: 'Lower Body Focus A',
    startDateTime: '2026-03-20T09:00:00Z',
    endDateTime: '2026-03-20T10:30:00Z',
    status: 'SCHEDULED',
    notes: 'Focus on squat depth and RDL hamstring stretch',
  },
  {
    id: 'evt_2',
    coachId: 'user_coach_1',
    clientId: 'ath_1',
    clientName: 'Marcus Vance',
    eventType: 'CHECKIN',
    title: 'Bi-Weekly Progress & Macro Review',
    startDateTime: '2026-03-21T15:00:00Z',
    endDateTime: '2026-03-21T15:30:00Z',
    status: 'SCHEDULED',
    notes: 'Review scale weight trend and upcoming caloric surplus adjustment',
  },
  {
    id: 'evt_3',
    coachId: 'user_coach_1',
    clientId: 'ath_2',
    clientName: 'Elena Rostova',
    eventType: 'COMPLETED_WORKOUT',
    title: 'Athletic Recomp & Conditioning V2',
    startDateTime: '2026-03-19T07:30:00Z',
    endDateTime: '2026-03-19T08:45:00Z',
    status: 'COMPLETED',
  },
  {
    id: 'evt_4',
    coachId: 'user_coach_1',
    clientId: 'ath_4',
    clientName: 'Sarah Chen',
    eventType: 'CARDIO_SESSION',
    title: 'Zone 2 Incline Walk (45 min)',
    startDateTime: '2026-03-22T08:00:00Z',
    endDateTime: '2026-03-22T08:45:00Z',
    status: 'SCHEDULED',
  },
];

// Initial direct messaging conversations
const INITIAL_CONVERSATIONS: ICoachConversationSummary[] = [
  {
    clientId: 'ath_1',
    clientName: 'Marcus Vance',
    clientEmail: 'marcus.v@alpha.fit',
    unreadCount: 1,
    lastMessage: {
      id: 'msg_1',
      coachId: 'user_coach_1',
      clientId: 'ath_1',
      senderId: 'ath_1',
      content: 'Hey coach, finished today’s lower body session! Hit 175kg on the squat.',
      isRead: false,
      createdAt: '2026-03-18T10:00:00Z',
    },
  },
  {
    clientId: 'ath_2',
    clientName: 'Elena Rostova',
    clientEmail: 'elena.rostova@alpha.fit',
    unreadCount: 0,
    lastMessage: {
      id: 'msg_2',
      coachId: 'user_coach_1',
      clientId: 'ath_2',
      senderId: 'user_coach_1',
      content: 'Great work on the conditioning split Elena. Keep hydrated!',
      isRead: true,
      createdAt: '2026-03-17T16:30:00Z',
    },
  },
];

const INITIAL_MESSAGES: Record<string, ICoachMessage[]> = {
  ath_1: [
    {
      id: 'm_1',
      coachId: 'user_coach_1',
      clientId: 'ath_1',
      senderId: 'user_coach_1',
      content: 'Marcus, how are your hamstrings feeling after the Romanian Deadlifts?',
      isRead: true,
      createdAt: '2026-03-17T11:00:00Z',
    },
    {
      id: 'm_2',
      coachId: 'user_coach_1',
      clientId: 'ath_1',
      senderId: 'ath_1',
      content: 'Hey coach, finished today’s lower body session! Hit 175kg on the squat.',
      isRead: false,
      createdAt: '2026-03-18T10:00:00Z',
    },
  ],
  ath_2: [
    {
      id: 'm_3',
      coachId: 'user_coach_1',
      clientId: 'ath_2',
      senderId: 'user_coach_1',
      content: 'Great work on the conditioning split Elena. Keep hydrated!',
      isRead: true,
      createdAt: '2026-03-17T16:30:00Z',
    },
  ],
};

const INITIAL_AUDIT_LOGS: IAuditLogRecord[] = [
  {
    id: 'aud_1',
    userId: 'user_coach_1',
    actorName: 'Coach Marcus',
    action: 'ASSIGN_PROGRAM',
    resource: 'PROGRAM',
    resourceId: 'prog_hypertrophy_v1',
    metadata: { client: 'Marcus Vance', version: 1 },
    ipAddress: '192.168.1.42',
    createdAt: '2026-03-18T09:15:00Z',
  },
  {
    id: 'aud_2',
    userId: 'user_coach_1',
    actorName: 'Coach Marcus',
    action: 'GENERATE_COACH_AI_DRAFT',
    resource: 'COACH_AI_DRAFT',
    resourceId: 'draft_902',
    metadata: { type: 'WORKOUT_ADJUSTMENT', athlete: 'Marcus Vance' },
    ipAddress: '192.168.1.42',
    createdAt: '2026-03-18T10:05:00Z',
  },
  {
    id: 'aud_3',
    userId: 'user_coach_1',
    actorName: 'Coach Marcus',
    action: 'SEND_COACH_MESSAGE',
    resource: 'COACH_MESSAGE',
    resourceId: 'msg_204',
    metadata: { recipient: 'Marcus Vance' },
    ipAddress: '192.168.1.42',
    createdAt: '2026-03-18T10:10:00Z',
  },
];

interface CoachPortalAppProps {
  authenticatedUser?: IAuthUser;
  onLogout?: () => void;
}

export const CoachPortalApp: React.FC<CoachPortalAppProps> = ({ authenticatedUser, onLogout }) => {
  // Navigation & Role Simulation State
  const [currentRole, setCurrentRole] = useState<UserRole>(
    (authenticatedUser?.role as UserRole) || UserRole.COACH,
  );
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [clients, setClients] = useState<IPortalClientSummary[]>(INITIAL_CLIENTS);
  const [programs, setPrograms] = useState<IProgramDetail[]>(INITIAL_PROGRAMS);
  const [events, setEvents] = useState<ICoachCalendarEvent[]>(INITIAL_EVENTS);
  const [conversations, setConversations] = useState<ICoachConversationSummary[]>(INITIAL_CONVERSATIONS);
  const [activeMsgClientId, setActiveMsgClientId] = useState<string | null>('ath_1');
  const [messages, setMessages] = useState<Record<string, ICoachMessage[]>>(INITIAL_MESSAGES);
  const [auditLogs, setAuditLogs] = useState<IAuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [assignProgramTarget, setAssignProgramTarget] = useState<IPortalClientSummary | null>(null);
  const [replaceProgramTarget, setReplaceProgramTarget] = useState<IPortalClientSummary | null>(null);
  const [coachAiTargetClient, setCoachAiTargetClient] = useState<IPortalClientSummary | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [offboardTarget, setOffboardTarget] = useState<{
    id: string;
    athleteId: string;
    name: string;
    email: string;
    activeProgramTitle?: string;
    activeMealPlanTitle?: string;
  } | null>(null);
  const [isBuildingProgram, setIsBuildingProgram] = useState(false);
  const [isBuildingMealPlan, setIsBuildingMealPlan] = useState(false);

  // Selected client object
  const selectedClient = clients.find((c) => c.clientId === selectedClientId);

  // Mock Dossier for selected client
  const selectedDossier: IClientDetailDossier | null = selectedClient
    ? {
        overview: selectedClient,
        profile: {
          heightCm: 182,
          weightKg: 84.5,
          gender: 'MALE',
          unitSystem: 'METRIC',
          timezone: 'UTC',
          experienceLevel: 'ADVANCED',
        },
        activeProgram: selectedClient.currentProgramTitle
          ? {
              id: 'assign_1',
              programId: 'prog_hypertrophy_v1',
              athleteId: selectedClient.clientId,
              programTitle: selectedClient.currentProgramTitle,
              startDate: '2026-02-01',
              endDate: null,
              isActive: true,
              version: 1,
              createdAt: new Date('2026-02-01T00:00:00Z'),
            }
          : null,
        activeMealPlan: {
          assignmentId: 'mp_assign_1',
          mealPlanId: 'mp_performance_1',
          mealPlanTitle: 'High-Protein Clean Bulk Plan',
          startDate: '2026-02-01',
          calories: 2800,
          proteinG: 205,
          carbsG: 310,
          fatG: 75,
        },
        recentWorkouts: [
          {
            id: 'ws_101',
            title: 'Lower Body Focus A',
            completedAt: '2026-03-16T15:45:00Z',
            durationSeconds: 4500,
            totalVolumeKg: 12450,
            exercisesCount: 6,
          },
          {
            id: 'ws_102',
            title: 'Upper Body Power',
            completedAt: '2026-03-14T12:10:00Z',
            durationSeconds: 4200,
            totalVolumeKg: 9800,
            exercisesCount: 5,
          },
        ],
        recentMetrics: {
          weightKg: 84.5,
          bmi: 25.5,
          bmiCategory: 'NORMAL',
          recordedAt: '2026-03-16',
        },
      }
    : null;

  // Handlers
  const handleAssignProgram = (programId: string, _startDate: string) => {
    if (!assignProgramTarget) return;
    const prog = programs.find((p) => p.id === programId);
    setClients((prev) =>
      prev.map((c) =>
        c.clientId === assignProgramTarget.clientId
          ? {
              ...c,
              currentProgramTitle: prog?.name || 'Custom Assigned Program',
              workoutConsistencyPercent: 100,
              status: ClientStatus.ACTIVE,
            }
          : c,
      ),
    );
    setAssignProgramTarget(null);
  };

  const handleConfirmReplace = (newProgramId: string, _effectiveDate: string) => {
    if (!replaceProgramTarget) return;
    const prog = programs.find((p) => p.id === newProgramId);
    setClients((prev) =>
      prev.map((c) =>
        c.clientId === replaceProgramTarget.clientId
          ? {
              ...c,
              currentProgramTitle: prog?.name || 'Updated Program',
              workoutConsistencyPercent: 100,
            }
          : c,
      ),
    );
    setReplaceProgramTarget(null);
  };

  const handleConfirmOffboard = async (clientId: string, _reason?: string) => {
    setClients((prev) =>
      prev.map((c) =>
        c.clientId === clientId
          ? {
              ...c,
              status: ClientStatus.ARCHIVED,
              currentProgramTitle: null,
            }
          : c,
      ),
    );
    if (selectedClientId === clientId) {
      setSelectedClientId(null);
    }
  };

  const handleSaveProgram = (programData: any) => {
    const newProg: IProgramDetail = {
      id: `prog_${Date.now()}`,
      creatorId: 'user_coach_1',
      name: programData.title || programData.name,
      description: programData.description,
      weeksCount: programData.weeksCount || 4,
      status: ProgramStatus.PUBLISHED,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      days: (programData.days || []).map((d: any, idx: number) => ({
        id: `day_${idx}`,
        dayOfWeek: d.dayOfWeek,
        title: d.title,
        exercises: (d.exercises || []).map((ex: any, eIdx: number) => ({
          id: `pe_${idx}_${eIdx}`,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseId,
          primaryMuscle: 'Target',
          orderIndex: eIdx,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          restSeconds: ex.restSeconds,
          targetRpe: ex.targetRpe,
          notes: ex.notes,
        })),
      })),
    };
    setPrograms((prev) => [newProg, ...prev]);
    setIsBuildingProgram(false);
  };

  const handleSaveMealPlan = (_planData: any) => {
    setIsBuildingMealPlan(false);
  };

  const handleCreateEvent = (dto: {
    clientId: string;
    title: string;
    eventType: any;
    startDateTime: string;
    endDateTime?: string;
    notes?: string;
  }) => {
    const client = clients.find((c) => c.clientId === dto.clientId);
    const newEvt: ICoachCalendarEvent = {
      id: `evt_${Date.now()}`,
      coachId: 'user_coach_1',
      clientId: dto.clientId,
      clientName: client?.fullName || 'Athlete',
      title: dto.title,
      eventType: dto.eventType,
      startDateTime: dto.startDateTime,
      endDateTime: dto.endDateTime,
      status: 'SCHEDULED',
      notes: dto.notes,
    };
    setEvents((prev) => [newEvt, ...prev]);
  };

  const handleGenerateReport = async (dto: {
    type: ReportType;
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<IReportDataSummary> => {
    return {
      reportId: `rep_${Date.now()}`,
      type: dto.type,
      title: `${dto.type.replace(/_/g, ' ')} Report`,
      authorCoachId: 'user_coach_1',
      organizationId: 'org_apex',
      generatedAt: new Date().toISOString(),
      clientSummary: clients.map((c) => ({
        clientId: c.clientId,
        clientName: c.fullName,
        complianceRate: c.workoutConsistencyPercent,
        keyMetricValue: c.currentProgramTitle || 'No active split',
      })),
      metrics: {
        totalClients: clients.length,
        activeProgramsCount: clients.filter((c) => c.currentProgramTitle).length,
        averageCohortWorkoutCompliance: 91.5,
        averageCohortNutritionCompliance: 88.0,
      },
    };
  };

  const handleSendMessage = (targetClientId: string, content: string) => {
    const newMsg: ICoachMessage = {
      id: `msg_${Date.now()}`,
      coachId: 'user_coach_1',
      clientId: targetClientId,
      senderId: 'user_coach_1',
      content,
      isRead: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [targetClientId]: [...(prev[targetClientId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.clientId === targetClientId
          ? { ...c, lastMessage: newMsg }
          : c,
      ),
    );

    const client = clients.find((c) => c.clientId === targetClientId);
    const newAudit: IAuditLogRecord = {
      id: `aud_${Date.now()}`,
      userId: 'user_coach_1',
      actorName: 'Coach Marcus',
      action: 'SEND_COACH_MESSAGE',
      resource: 'COACH_MESSAGE',
      resourceId: newMsg.id,
      metadata: { recipient: client?.fullName || targetClientId },
      ipAddress: '192.168.1.42',
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const handleOpenAiAssistant = (targetClientId: string) => {
    const client = clients.find((c) => c.clientId === targetClientId);
    if (client) {
      setCoachAiTargetClient(client);
      setIsAiDrawerOpen(true);
    }
  };

  const handleGenerateAiDraft = async (
    targetClientId: string,
    draftType: CoachAiDraftType,
    instructions?: string,
  ): Promise<ICoachAiDraft> => {
    const client = clients.find((c) => c.clientId === targetClientId);
    const clientName = client?.fullName || 'Athlete';
    const programTitle = client?.currentProgramTitle || 'Hypertrophy Power Split';

    let content = '';
    let actionProposal: Record<string, any> | null = null;

    if (draftType === 'PERFORMANCE_SUMMARY') {
      content = `Performance Summary for ${clientName} (${client?.primaryGoal || 'Athletic'}):\n- Active Split: ${programTitle}\n- Consistency: ${client?.workoutConsistencyPercent}% completed on scheduled days\n- Volume Overload: 42,100 kg cumulative tonnage (+5.2% vs baseline)\n- Nutrition Adherence: ${client?.nutritionAdherencePercent || 88}% compliance. Weight steady at 84.5 kg.`;
    } else if (draftType === 'WORKOUT_ADJUSTMENT') {
      content = `Periodization Adaptation for ${clientName}:\nDetected elevated RPE and lumbar fatigue on heavy compound days. Proposing intensity deload (-5%) with sustained assistance volume.`;
      actionProposal = {
        type: 'WORKOUT_ADJUSTMENT',
        programTitle,
        recommendations: [
          { exercise: 'Barbell Back Squat', targetSets: 4, targetReps: 6, targetRpe: 7.5, notes: 'Deload intensity' },
          { exercise: 'Romanian Deadlift', targetSets: 3, targetReps: 8, targetRpe: 8.0, notes: 'Slow eccentric' },
        ],
        coachConfirmationRequired: true,
      };
    } else if (draftType === 'NUTRITION_ADJUSTMENT') {
      content = `Caloric & Macro Protocol Adjustment for ${clientName}:\nScale weight plateaued for 14 days during clean bulk phase. Proposing +150 kcal daily surplus increment via carbohydrates.`;
      actionProposal = {
        type: 'NUTRITION_ADJUSTMENT',
        currentCalories: 2800,
        proposedCalories: 2950,
        proposedMacros: { proteinG: 205, carbsG: 345, fatG: 75 },
        rationale: 'Metabolic adaptation offset',
        coachConfirmationRequired: true,
      };
    } else {
      content = `Hey ${clientName}! Great work crushing your sessions this week. Scale weight is tracking nicely at 84.5 kg. How is your recovery and sleep feeling? Let me know if you want to bump calories up slightly!`;
    }

    if (instructions) {
      content += `\n\n[Coach Custom Note]: ${instructions}`;
    }

    const draft: ICoachAiDraft = {
      id: `draft_${Date.now()}`,
      coachId: 'user_coach_1',
      clientId: targetClientId,
      draftType,
      prompt: instructions || `Synthesize ${draftType}`,
      content,
      actionProposal,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    const newAudit: IAuditLogRecord = {
      id: `aud_${Date.now()}`,
      userId: 'user_coach_1',
      actorName: 'Coach Marcus',
      action: 'GENERATE_COACH_AI_DRAFT',
      resource: 'COACH_AI_DRAFT',
      resourceId: draft.id,
      metadata: { athlete: clientName, type: draftType },
      ipAddress: '192.168.1.42',
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    return draft;
  };

  const handleApplyAiDraft = async (draftId: string) => {
    const newAudit: IAuditLogRecord = {
      id: `aud_${Date.now()}`,
      userId: 'user_coach_1',
      actorName: 'Coach Marcus',
      action: 'APPLY_COACH_AI_DRAFT',
      resource: 'COACH_AI_DRAFT',
      resourceId: draftId,
      metadata: { status: 'APPLIED' },
      ipAddress: '192.168.1.42',
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: STITCH_THEME.colors.bgPrimary,
        color: STITCH_THEME.colors.textPrimary,
        fontFamily: STITCH_THEME.typography.fontSans,
      }}
    >
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedClientId(null);
        }}
        currentRole={currentRole}
        onLogout={onLogout}
      />

      {/* Main Workspace Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        {/* Sticky Top Header */}
        <TopHeader
          currentRole={currentRole}
          onChangeRole={setCurrentRole}
          onOpenInviteModal={() => setIsInviteModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          authenticatedUser={authenticatedUser}
          onLogout={onLogout}
        />

        {/* Quick Actions Bar — context-aware */}
        <div
          style={{
            borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            padding: '7px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            backgroundColor: STITCH_THEME.colors.bgSecondary,
          }}
        >
          {currentRole !== UserRole.NUTRITIONIST && (
            <button
              onClick={() => setIsBuildingProgram(true)}
              style={{
                ...STITCH_THEME.styles.secondaryButton,
                fontSize: '12px',
                padding: '5px 12px',
              }}
            >
              + New Program
            </button>
          )}
          {currentRole !== UserRole.TRAINER && (
            <button
              onClick={() => setIsBuildingMealPlan(true)}
              style={{
                ...STITCH_THEME.styles.secondaryButton,
                fontSize: '12px',
                padding: '5px 12px',
              }}
            >
              + New Meal Plan
            </button>
          )}
        </div>

        {/* Dynamic Main Content Area */}
        <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {selectedDossier ? (
            /* Athlete Dossier Detail View */
            <ClientDetailView
              dossier={selectedDossier}
              onBack={() => setSelectedClientId(null)}
              onOpenReplaceProgram={() => {
                if (selectedClient) setReplaceProgramTarget(selectedClient);
              }}
              onOpenOffboardModal={() => {
                if (selectedClient) {
                  setOffboardTarget({
                    id: selectedClient.clientId,
                    athleteId: selectedClient.clientId,
                    name: selectedClient.fullName,
                    email: selectedClient.email,
                    activeProgramTitle: selectedClient.currentProgramTitle || undefined,
                  });
                }
              }}
              currentRole={currentRole}
            />
          ) : activeTab === 'overview' ? (
            /* Enterprise Executive Overview & Mission Control */
            <ExecutiveDashboardView
              currentRole={currentRole}
              onNavigateTab={(tab) => setActiveTab(tab as PortalTab)}
              onSelectClient={(id) => setSelectedClientId(id)}
            />
          ) : activeTab === 'clients' ? (
            /* Client Management Table */
            <div>
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                    Athletes
                  </h1>
                  <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
                    Monitor compliance, manage prescriptions, and review historical performance analytics.
                  </p>
                </div>
                <button onClick={() => setIsInviteModalOpen(true)} style={STITCH_THEME.styles.primaryButton}>
                  + Invite Athlete
                </button>
              </div>

              <ClientListTable
                clients={clients}
                onSelectClient={(id) => setSelectedClientId(id)}
                onAssignProgram={(client) => setAssignProgramTarget(client)}
                onOffboardClient={(client) =>
                  setOffboardTarget({
                    id: client.clientId,
                    athleteId: client.clientId,
                    name: client.fullName,
                    email: client.email,
                    activeProgramTitle: client.currentProgramTitle || undefined,
                  })
                }
                currentRole={currentRole}
              />
            </div>
          ) : activeTab === 'programs' ? (
            /* Programs Library View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0' }}>Training Programs</h1>
                  <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
                    Immutable versioned programs, multi-day splits, and exercise prescriptions.
                  </p>
                </div>
                {currentRole !== UserRole.NUTRITIONIST && (
                  <button onClick={() => setIsBuildingProgram(true)} style={STITCH_THEME.styles.primaryButton}>
                    + Create Program
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {programs.map((prog) => (
                  <div
                    key={prog.id}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    }}
                    style={{
                      ...STITCH_THEME.styles.glassCard,
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: STITCH_THEME.typography.fontMono,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: STITCH_THEME.colors.accentCyanDim,
                            color: STITCH_THEME.colors.accentCyan,
                            fontWeight: 600,
                            letterSpacing: '0.03em',
                          }}
                        >
                          v{prog.version} · {prog.status}
                        </span>
                        <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
                          {prog.weeksCount} Weeks • {prog.days.length} Days/wk
                        </span>
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '8px 0', color: STITCH_THEME.colors.textPrimary }}>
                        {prog.name}
                      </h3>
                      <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, lineHeight: 1.5, margin: 0 }}>
                        {prog.description}
                      </p>
                    </div>

                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>
                        {prog.days.reduce((acc, d) => acc + d.exercises.length, 0)} Total Exercises
                      </span>
                      <button
                        onClick={() => alert(`Previewing split for ${prog.name}`)}
                        style={{ ...STITCH_THEME.styles.secondaryButton, padding: '4px 12px', fontSize: '12px' }}
                      >
                        Inspect Split
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'exercises' ? (
            /* Exercise Library & Biomechanics Management */
            <ExerciseManagementView currentRole={currentRole} />
          ) : activeTab === 'workouts' ? (
            /* Standalone Workout Templates & Visual Builder */
            <WorkoutManagementView currentRole={currentRole} />
          ) : activeTab === 'nutrition' ? (
            /* Nutrition Plans Library */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0' }}>Nutrition Plans</h1>
                  <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
                    Macro-balanced daily nutrition plans, meal timing, and portion recommendations.
                  </p>
                </div>
                {currentRole !== UserRole.TRAINER && (
                  <button onClick={() => setIsBuildingMealPlan(true)} style={STITCH_THEME.styles.primaryButton}>
                    + Create Meal Plan
                  </button>
                )}
              </div>

              <div style={{ ...STITCH_THEME.styles.glassCard, padding: '48px 32px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: STITCH_THEME.colors.accentEmeraldDim,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: STITCH_THEME.colors.accentEmerald,
                    margin: '0 auto 16px',
                    fontFamily: STITCH_THEME.typography.fontMono,
                    fontWeight: 700,
                  }}
                >
                  ◉
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Ready for Plan Assignment</h3>
                <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, maxWidth: '460px', margin: '0 auto 20px auto' }}>
                  Create customized daily meal structures or assign calibrated caloric targets to your athletes.
                </p>
                {currentRole !== UserRole.TRAINER && (
                  <button onClick={() => setIsBuildingMealPlan(true)} style={STITCH_THEME.styles.primaryButton}>
                    Open Nutrition Plan Builder
                  </button>
                )}
              </div>
            </div>
          ) : activeTab === 'dashboard' || activeTab === 'progress' ? (
            /* Cohort Analytics & Progress Curves */
            <AnalyticsDashboard
              clients={clients}
              onSelectClient={(id) => setSelectedClientId(id)}
            />
          ) : activeTab === 'calendar' ? (
            /* Coaching Schedule & Events Calendar */
            <CalendarView
              clients={clients}
              events={events}
              onCreateEvent={handleCreateEvent}
            />
          ) : activeTab === 'reports' ? (
            /* Historical Reports & CSV Export */
            <ReportsView
              clients={clients}
              onGenerateReport={handleGenerateReport}
            />
          ) : activeTab === 'messages' ? (
            /* Direct Messaging & Athlete Communications */
            <MessagesView
              conversations={conversations}
              activeClientId={activeMsgClientId}
              onSelectConversation={(cid) => setActiveMsgClientId(cid)}
              messages={activeMsgClientId ? messages[activeMsgClientId] || [] : []}
              onSendMessage={handleSendMessage}
              onOpenAiAssistant={handleOpenAiAssistant}
            />
          ) : activeTab === 'check-ins' ? (
            /* Weekly Progress Check-Ins Review */
            <WeeklyCheckInsView />
          ) : activeTab === 'trainers' ? (
            /* Certified Trainers Operations & Client Assignments */
            <TrainerManagementView
              currentRole={currentRole}
              onSimulateTrainer={(_id, _name) => {
                setCurrentRole(UserRole.TRAINER);
                setActiveTab('overview');
              }}
            />
          ) : activeTab === 'admin' ? (
            /* Full System Administration & Governance */
            <AdminDashboardView auditLogs={auditLogs} />
          ) : activeTab === 'settings' ? (
            /* System Configuration, RBAC Governance & Audit Trail */
            <SystemSettingsView currentRole={currentRole} auditLogs={auditLogs} />
          ) : (
            /* Placeholder for secondary tabs */
            <div style={{ ...STITCH_THEME.styles.glassCard, padding: '64px 48px', textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: STITCH_THEME.colors.accentCyanDim,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: STITCH_THEME.colors.accentCyan,
                  margin: '0 auto 20px',
                  fontFamily: STITCH_THEME.typography.fontMono,
                  fontWeight: 700,
                }}
              >
                ◈
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', marginTop: 0 }}>
                {(activeTab as string).charAt(0).toUpperCase() + (activeTab as string).slice(1)} Dashboard
              </h2>
              <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, margin: 0 }}>
                Select <strong>Clients</strong> to manage athletes or <strong>Programs</strong> to inspect training splits.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* Coach AI Assistant Drawer */}
      {isAiDrawerOpen && coachAiTargetClient && (
        <CoachAiDrawer
          isOpen={isAiDrawerOpen}
          clientId={coachAiTargetClient.clientId}
          clientName={coachAiTargetClient.fullName}
          onClose={() => setIsAiDrawerOpen(false)}
          onGenerateDraft={handleGenerateAiDraft}
          onApplyDraft={handleApplyAiDraft}
          onInsertIntoChat={(text) => {
            handleSendMessage(coachAiTargetClient.clientId, text);
            setActiveTab('messages');
            setActiveMsgClientId(coachAiTargetClient.clientId);
          }}
        />
      )}

      {/* Program Builder Modal */}
      {isBuildingProgram && (
        <ProgramBuilder
          currentRole={currentRole}
          onSaveProgram={handleSaveProgram}
          onClose={() => setIsBuildingProgram(false)}
        />
      )}

      {/* Nutrition Plan Builder Modal */}
      {isBuildingMealPlan && (
        <NutritionPlanBuilder
          currentRole={currentRole}
          onSaveMealPlan={handleSaveMealPlan}
          onClose={() => setIsBuildingMealPlan(false)}
        />
      )}

      {/* Program Assign Modal */}
      {assignProgramTarget && (
        <ProgramAssignModal
          client={assignProgramTarget}
          availablePrograms={programs}
          onAssign={handleAssignProgram}
          onClose={() => setAssignProgramTarget(null)}
        />
      )}

      {/* Replace Program Modal */}
      {replaceProgramTarget && (
        <ReplaceProgramModal
          client={replaceProgramTarget}
          availablePrograms={programs}
          onConfirmReplace={handleConfirmReplace}
          onClose={() => setReplaceProgramTarget(null)}
        />
      )}

      {/* Invite Athlete Modal */}
      {isInviteModalOpen && (
        <InviteClientModal
          onSendInvite={(email, role) => {
            alert(`Invitation created for ${email} as ${role}. Shareable link generated.`);
          }}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      {/* Safe Offboarding Modal */}
      {offboardTarget && (
        <SafeOffboardingModal
          isOpen={Boolean(offboardTarget)}
          client={offboardTarget}
          onClose={() => setOffboardTarget(null)}
          onConfirm={handleConfirmOffboard}
        />
      )}
    </div>
  );
};

export const GuardedCoachPortalApp: React.FC = () => {
  return (
    <WebErrorBoundary>
      <AuthGuard>
        {(authUser, onLogout) => <CoachPortalApp authenticatedUser={authUser} onLogout={onLogout} />}
      </AuthGuard>
    </WebErrorBoundary>
  );
};

