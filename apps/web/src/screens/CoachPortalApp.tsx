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
import { ProgramAccessManagementView } from '../components/ProgramAccessManagementView';
import { UserProgramDashboardView } from '../components/UserProgramDashboardView';
import { AuthGuard } from '../components/AuthGuard';
import { WebErrorBoundary } from '../components/WebErrorBoundary';
import { IAuthUser } from '@alpha/types';
import PROGRAM_CATALOG_RAW from '../data/program-catalog.json';

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
  {
    id: 'prog_6_week_shredded_12w',
    creatorId: 'author_guru_mann',
    name: '6 WEEK SHREDDED',
    description: 'High-density superset, giant set, and drop set protocol designed for aggressive fat loss and lean muscle preservation. Extended to a 12-week implementation across two consecutive cycles.',
    weeksCount: 12,
    status: ProgramStatus.PUBLISHED,
    version: 1,
    displayDuration: '12 Weeks',
    sourceDuration: '6 Weeks',
    sourceAttribution: 'Designed & Created by GRAVITY Performance OS. Elite Conditioning Protocol · Certified Nutrition & Strength System.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    days: [
      { id: 'day_sws_1', dayOfWeek: 1, title: 'Shoulders + Triceps & Upper Abs', exercises: [] },
      { id: 'day_sws_2', dayOfWeek: 2, title: 'Chest + Upper Back & Lower Abs', exercises: [] },
      { id: 'day_sws_3', dayOfWeek: 3, title: 'Cardio & Upper Abs', exercises: [] },
      { id: 'day_sws_4', dayOfWeek: 4, title: 'Lat, Mid Back + Biceps & Lower Abs', exercises: [] },
      { id: 'day_sws_5', dayOfWeek: 5, title: 'Quads, Ham & Calves & Upper Abs', exercises: [] },
      { id: 'day_sws_6', dayOfWeek: 6, title: 'Cardio & Lower Abs', exercises: [] },
      { id: 'day_sws_7', dayOfWeek: 7, title: 'Recovery', exercises: [] },
    ],
  },
];

const CATALOG_PROGRAMS: IProgramDetail[] = (PROGRAM_CATALOG_RAW.programs || []).map((p: any) => {
  const category = (PROGRAM_CATALOG_RAW.categories || []).find((c: any) => c.id === p.categoryId);
  return {
    id: p.id,
    creatorId: 'author_guru_mann',
    categoryId: p.categoryId,
    categoryName: category?.name || 'General',
    name: p.name,
    slug: p.slug,
    description: p.description || '',
    goal: p.goal || 'General Fitness',
    duration: `${p.durationWeeks || 6} Weeks`,
    workoutDaysPerWeek: p.frequencyDays || 6,
    weeksCount: p.durationWeeks || 6,
    status: ProgramStatus.PUBLISHED,
    version: 1,
    displayDuration: `${p.durationWeeks || 6} Weeks`,
    sourceDuration: `${p.durationWeeks || 6} Weeks`,
    sourceAttribution: p.sourceAuthor || 'Program fitted by Gravity',
    sourceUrl: p.sourceUrl,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    days: (p.days || []).map((d: any) => ({
      id: d.id || `${p.id}_d${d.dayOfWeek}`,
      dayOfWeek: d.dayOfWeek,
      title: d.title || `Day ${d.dayOfWeek}`,
      exercises: (d.exercises || []).map((ex: any, idx: number) => ({
        id: ex.id || `${p.id}_d${d.dayOfWeek}_e${idx}`,
        exerciseId: `ex_${idx}`,
        exerciseName: ex.name,
        primaryMuscle: ex.muscleGroup || 'Full Body',
        orderIndex: idx,
        targetSets: ex.targetSets || 3,
        targetReps: ex.targetReps || 10,
        restSeconds: ex.restSeconds || 60,
        targetRpe: 8,
        notes: ex.restInstructions || ex.setGroupType || '',
      })),
    })),
  };
});

const ALL_PORTAL_PROGRAMS: IProgramDetail[] = [
  ...INITIAL_PROGRAMS,
  ...CATALOG_PROGRAMS.filter(
    (cp) => !INITIAL_PROGRAMS.some((ip) => ip.id === cp.id || ip.name.toLowerCase() === cp.name.toLowerCase())
  ),
];

const CARD_THUMBNAILS: Record<string, string> = {
  prog_hypertrophy_v1: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
  prog_recomp_v2: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
  prog_6_week_shredded_12w: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
  'prog-gainer-pure-mass': 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=600&q=80',
  'prog-mass-up': 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=600&q=80',
  'prog-size-8': 'https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&w=600&q=80',
};

const CATEGORY_THUMBNAILS: Record<string, string> = {
  'cat-muscle-building': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
  'cat-fat-loss': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
  'cat-single-muscle': 'https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&w=600&q=80',
  'cat-bodyweight': 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80',
  'cat-medical': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80',
  'cat-family': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
  'cat-specialized-nutrition': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
};

const getProgramThumbnail = (prog: IProgramDetail): string => {
  const cardThumb = CARD_THUMBNAILS[prog.id];
  if (cardThumb) return cardThumb;
  if (prog.categoryId) {
    const catThumb = CATEGORY_THUMBNAILS[prog.categoryId];
    if (catThumb) return catThumb;
  }
  return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';
};


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
  const [programs, setPrograms] = useState<IProgramDetail[]>(ALL_PORTAL_PROGRAMS);
  const [programCategoryFilter, setProgramCategoryFilter] = useState<string>('ALL');
  const [programSearchQuery, setProgramSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'duration' | 'exercises'>('recent');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [previewProgram, setPreviewProgram] = useState<IProgramDetail | null>(null);

  const getCategoryCount = (catId: string) => {
    if (catId === 'ALL') return programs.length;
    return programs.filter((p) => {
      return p.categoryId === catId || (catId === 'cat-fat-loss' && p.id === 'prog_6_week_shredded_12w');
    }).length;
  };
  const [selectedUserProgramId, setSelectedUserProgramId] = useState<string>('prog-6-week-shredded');
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
        authenticatedUser={authenticatedUser}
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
        {activeTab !== 'programs' && (
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
        )}

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
              {/* Page Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(0, 240, 255, 0.08)',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    📖
                  </div>
                  <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                      Training Programs
                    </h1>
                    <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                      Immutable versioned programs, multi-day splits, and exercise prescriptions.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {currentRole !== UserRole.TRAINER && (
                    <button
                      onClick={() => setIsBuildingMealPlan(true)}
                      style={{
                        height: '38px',
                        padding: '0 16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
                    >
                      <span>+</span>
                      <span>New Meal Plan</span>
                    </button>
                  )}
                  {currentRole !== UserRole.NUTRITIONIST && (
                    <button
                      onClick={() => setIsBuildingProgram(true)}
                      style={{
                        height: '38px',
                        padding: '0 18px',
                        backgroundColor: '#00F0FF',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#07090E',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 0 16px rgba(0, 240, 255, 0.3)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#38F4FF')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00F0FF')}
                    >
                      <span>+</span>
                      <span>Create Program</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Pills & Search / Sort Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    { id: 'ALL', name: `All Programs (${programs.length})` },
                    ...(PROGRAM_CATALOG_RAW.categories || []).map((c: any) => ({
                      id: c.id,
                      name: `${c.name} (${getCategoryCount(c.id)})`,
                    })),
                  ].map((cat) => {
                    const isSelected = programCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setProgramCategoryFilter(cat.id)}
                        style={{
                          height: '32px',
                          padding: '0 16px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#00F0FF' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#07090E' : '#94A3B8',
                          border: isSelected ? 'none' : `1px solid rgba(255, 255, 255, 0.08)`,
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          boxShadow: isSelected ? '0 0 12px rgba(0, 240, 255, 0.35)' : 'none',
                        }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar + Sort Dropdown */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '14px', color: '#64748B', fontSize: '15px', pointerEvents: 'none' }}>⌕</span>
                    <input
                      type="text"
                      placeholder={`Search ${programs.length} GRAVITY programs by name, category, or target goal...`}
                      value={programSearchQuery}
                      onChange={(e) => setProgramSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 40px 0 40px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid rgba(255, 255, 255, 0.09)`,
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease, background-color 0.15s ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgba(0, 240, 255, 0.5)';
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.09)';
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      }}
                    />
                    {programSearchQuery && (
                      <button
                        onClick={() => setProgramSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setSortDropdownOpen((prev) => !prev)}
                      style={{
                        height: '42px',
                        padding: '0 16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid rgba(255, 255, 255, 0.09)`,
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>🎛️</span>
                      <span>
                        {sortBy === 'recent'
                          ? 'Recently Added'
                          : sortBy === 'name'
                          ? 'Name (A-Z)'
                          : sortBy === 'duration'
                          ? 'Duration'
                          : 'Exercises'}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>▼</span>
                    </button>
                    {sortDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '48px',
                          backgroundColor: '#0D1117',
                          border: `1px solid rgba(255, 255, 255, 0.12)`,
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
                          zIndex: 40,
                          minWidth: '170px',
                          padding: '6px 0',
                        }}
                      >
                        {[
                          { key: 'recent', label: 'Recently Added' },
                          { key: 'name', label: 'Name (A-Z)' },
                          { key: 'duration', label: 'Duration' },
                          { key: 'exercises', label: 'Exercises' },
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => {
                              setSortBy(item.key as any);
                              setSortDropdownOpen(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              textAlign: 'left',
                              background: sortBy === item.key ? 'rgba(0, 240, 255, 0.1)' : 'none',
                              color: sortBy === item.key ? '#00F0FF' : '#F8FAFC',
                              border: 'none',
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            {item.label}
                            {sortBy === item.key && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Program Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {programs
                  .filter((prog) => {
                    const matchesCat =
                      programCategoryFilter === 'ALL' ||
                      prog.categoryId === programCategoryFilter ||
                      (programCategoryFilter === 'cat-fat-loss' && prog.id === 'prog_6_week_shredded_12w');
                    const q = programSearchQuery.toLowerCase().trim();
                    const matchesQuery =
                      !q ||
                      prog.name.toLowerCase().includes(q) ||
                      (prog.description && prog.description.toLowerCase().includes(q)) ||
                      (prog.categoryName && prog.categoryName.toLowerCase().includes(q));
                    return matchesCat && matchesQuery;
                  })
                  .sort((a, b) => {
                    if (sortBy === 'name') return a.name.localeCompare(b.name);
                    if (sortBy === 'duration') return (b.weeksCount || 0) - (a.weeksCount || 0);
                    if (sortBy === 'exercises') {
                      const aEx = a.days.reduce((acc, d) => acc + d.exercises.length, 0);
                      const bEx = b.days.reduce((acc, d) => acc + d.exercises.length, 0);
                      return bEx - aEx;
                    }
                    return 0;
                  })
                  .map((prog) => {
                    const exerciseCount = prog.days.reduce((acc, d) => acc + d.exercises.length, 0);
                    const isShredded = prog.id === 'prog_6_week_shredded_12w';
                    const isSize8 = prog.name.toLowerCase().includes('size 8');
                    const thumb = getProgramThumbnail(prog);

                    return (
                      <div
                        key={prog.id}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0, 240, 255, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }}
                        style={{
                          position: 'relative',
                          overflow: 'hidden',
                          backgroundColor: '#0D1117',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '22px 24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '270px',
                          transition: 'transform 0.18s ease, border-color 0.18s ease',
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* Atmospheric Background Image on Right */}
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '46%',
                            backgroundImage: `linear-gradient(to right, #0D1117 0%, rgba(13, 17, 23, 0.55) 35%, rgba(13, 17, 23, 0.15) 100%), url(${thumb})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            pointerEvents: 'none',
                            opacity: 0.85,
                          }}
                        />

                        {/* Card Content (Left ~64%) */}
                        <div style={{ position: 'relative', zIndex: 1, maxWidth: '64%' }}>
                          {/* Meta Pill & Duration */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <span
                              style={{
                                fontSize: '10px',
                                fontFamily: STITCH_THEME.typography.fontMono,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                backgroundColor: isShredded
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(0, 240, 255, 0.1)',
                                color: isShredded ? '#F59E0B' : '#00F0FF',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                              }}
                            >
                              {isShredded ? 'RESTRICTED ACCESS' : `${prog.categoryName || 'PROGRAM'} · v${prog.version || 1}`}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>⏱️</span>
                              <span>
                                {prog.weeksCount} Weeks • {prog.workoutDaysPerWeek || prog.days.length} Days/wk
                              </span>
                            </span>
                          </div>

                          {/* Title */}
                          <h3
                            style={{
                              fontSize: '18px',
                              fontWeight: 800,
                              margin: '0 0 6px 0',
                              color: '#FFFFFF',
                              letterSpacing: '-0.01em',
                              lineHeight: 1.25,
                            }}
                          >
                            {prog.name}
                          </h3>

                          {/* Attribution */}
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#00F0FF',
                              fontWeight: 600,
                              marginBottom: '8px',
                            }}
                          >
                            {prog.sourceAttribution ? 'Program fitted by Gravity' : 'Program fitted by Gravity'}
                          </div>

                          {/* Description */}
                          <p
                            style={{
                              fontSize: '12px',
                              color: '#94A3B8',
                              lineHeight: 1.5,
                              margin: 0,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '36px',
                            }}
                          >
                            {prog.description}
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div
                          style={{
                            position: 'relative',
                            zIndex: 1,
                            marginTop: '20px',
                            paddingTop: '16px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          {/* Stats on Left */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span>🏋️</span>
                              <span>{isShredded ? '68 Exercises' : `${exerciseCount} Exercises`}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {isShredded ? (
                                <>
                                  <span>🔄</span>
                                  <span>2 Cycles</span>
                                </>
                              ) : (
                                <>
                                  <span>📄</span>
                                  <span>Full Details</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions on Right */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                            {isShredded || isSize8 ? (
                              <button
                                onClick={() => setActiveTab('shredded-admin')}
                                style={{
                                  height: '32px',
                                  padding: '0 14px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: '6px',
                                  color: '#F8FAFC',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                              >
                                Manage Access
                              </button>
                            ) : (
                              <button
                                onClick={() => setPreviewProgram(prog)}
                                style={{
                                  height: '32px',
                                  padding: '0 14px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: '6px',
                                  color: '#F8FAFC',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                              >
                                Inspect Split
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedUserProgramId(prog.id);
                                setActiveTab('shredded-program');
                              }}
                              style={{
                                height: '32px',
                                padding: '0 14px',
                                backgroundColor: '#00F0FF',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#07090E',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                transition: 'all 0.15s ease',
                                boxShadow: '0 0 12px rgba(0, 240, 255, 0.25)',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#38F4FF')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#00F0FF')}
                            >
                              Start Program
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : activeTab === 'shredded-program' ? (
            /* User / Athlete 12-Week Progress Engine */
            <UserProgramDashboardView programId={selectedUserProgramId} onBack={() => setActiveTab('programs')} />
          ) : activeTab === 'shredded-admin' ? (
            /* Admin Access Management & Canonical Inspector */
            <ProgramAccessManagementView currentRole={currentRole} onBack={() => setActiveTab('programs')} />
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

      {/* Inspect Split Modal */}
      {previewProgram && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
        >
          <div
            style={{
              ...STITCH_THEME.styles.glassCardElevated,
              width: '740px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '28px',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: STITCH_THEME.typography.fontMono,
                    color: STITCH_THEME.colors.accentCyan,
                    fontWeight: 700,
                  }}
                >
                  {previewProgram.categoryName || 'GRAVITY PROGRAM'} • {previewProgram.weeksCount} WEEKS
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0', color: STITCH_THEME.colors.textPrimary }}>
                  {previewProgram.name}
                </h2>
              </div>
              <button
                onClick={() => setPreviewProgram(null)}
                style={{ ...STITCH_THEME.styles.secondaryButton, padding: '6px 12px', fontSize: '13px' }}
              >
                ✕ Close
              </button>
            </div>

            <p style={{ fontSize: '13px', color: STITCH_THEME.colors.textSecondary, marginBottom: '20px', lineHeight: 1.5 }}>
              {previewProgram.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {previewProgram.days.map((d, dIdx) => (
                <div
                  key={d.id || dIdx}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: STITCH_THEME.colors.textPrimary }}>
                      Day {d.dayOfWeek}: {d.title}
                    </span>
                    <span style={{ fontSize: '11px', color: STITCH_THEME.colors.accentCyan, fontFamily: STITCH_THEME.typography.fontMono }}>
                      {d.exercises.length} Exercises
                    </span>
                  </div>
                  {d.exercises.length === 0 ? (
                    <div style={{ fontSize: '12px', color: STITCH_THEME.colors.textMuted }}>Rest & Muscular Recovery</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {d.exercises.map((ex, eIdx) => (
                        <div
                          key={ex.id || eIdx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: STITCH_THEME.colors.textSecondary,
                            padding: '4px 0',
                          }}
                        >
                          <span>
                            {eIdx + 1}. {ex.exerciseName}
                          </span>
                          <span style={{ color: STITCH_THEME.colors.textMuted }}>
                            {ex.targetSets} sets × {ex.targetReps} reps
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setSelectedUserProgramId(previewProgram.id);
                  setPreviewProgram(null);
                  setActiveTab('shredded-program');
                }}
                style={{ ...STITCH_THEME.styles.primaryButton, padding: '8px 18px', fontSize: '13px' }}
              >
                Start This Program
              </button>
            </div>
          </div>
        </div>
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

