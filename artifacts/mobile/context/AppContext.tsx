import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type AthleteStatus =
  | 'training'
  | 'sprint_drill'
  | 'resting'
  | 'hydrating'
  | 'reduced_intensity'
  | 'paused'
  | 'session_ended'
  | 'medical_attention'
  | 'not_in_session';

export type SafetyLevel = 'safe' | 'caution' | 'critical' | 'recovery' | 'inactive';
export type HeatRisk = 'low' | 'moderate' | 'high' | 'extreme';
export type HydrationStatus = 'good' | 'low' | 'critical';
export type Intensity = 'low' | 'medium' | 'high';

export interface Athlete {
  id: string;
  name: string;
  age: number;
  sport: string;
  coachId: string;
  status: AthleteStatus;
  safetyLevel: SafetyLevel;
  uvExposure: number;
  heatRisk: HeatRisk;
  hydrationStatus: HydrationStatus;
  trainingDuration: number;
  intensity: Intensity;
  lastUpdate: string;
  issueRaised: boolean;
  parentId: string;
  actionHistory: ActionRecord[];
  /** Height in centimeters. */
  heightCm: number;
  /** Weight in kilograms. */
  weightKg: number;
}

export interface ActionRecord {
  id: string;
  action: string;
  coachName: string;
  timestamp: string;
  note?: string;
}

/** BMI = weight(kg) / height(m)^2 — computed on the fly rather than stored, so it never goes stale. */
export function getBMI(athlete: Pick<Athlete, 'heightCm' | 'weightKg'>): number {
  const heightM = athlete.heightCm / 100;
  return Math.round((athlete.weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): 'underweight' | 'healthy' | 'overweight' | 'obese' {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'healthy';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export type HydrationAlertStatus = 'pending' | 'snoozed' | 'resolved' | 'ignored';

export interface HydrationAlert {
  id: string;
  athleteId: string;
  athleteName: string;
  coachId: string;
  triggeredAt: string;
  status: HydrationAlertStatus;
  /** When status is 'snoozed', this is when the reminder should re-fire. */
  snoozeUntil?: string;
  resolvedAt?: string;
  /** The action the coach ultimately took ('Hydrate Now', 'Ignore', etc.) — set once resolved/ignored. */
  resolution?: string;
}

export interface Coach {
  id: string;
  name: string;
  sport: string;
  athleteCount: number;
  activeSessions: number;
}

export interface SessionHistory {
  id: string;
  athleteName: string;
  sport: string;
  date: string;
  duration: number;
  safetyIncidents: number;
  coachId: string;
  coachName: string;
  summary: string;
}

export interface DemoBooking {
  id: string;
  fullName: string;
  academyName: string;
  role: string;
  phone: string;
  email: string;
  city: string;
  athleteCount: string;
  coachCount: string;
  sports: string;
  demoDate: string;
  timeSlot: string;
  requirements: string;
  confirmedAt: string;
}

export interface EnvConditions {
  temperature: number;
  uvIndex: number;
  humidity: number;
  heatRisk: HeatRisk;
  recommendation: string;
  safeHours: string;
  breakInterval: number;
}

export type UserRole = 'coach' | 'academy' | 'parent' | null;

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  athletes: Athlete[];
  coaches: Coach[];
  sessionHistory: SessionHistory[];
  addSessionRecord: (record: Omit<SessionHistory, 'id'>) => void;
  hydrationAlerts: HydrationAlert[];
  /** Creates a new pending hydration alert for an athlete, unless one is already active. */
  triggerHydrationAlert: (athleteId: string, coachId: string) => void;
  /** Coach's response to the first popup: hydrate now / snooze 10 min / ignore. */
  respondToHydrationAlert: (alertId: string, response: 'hydrate' | 'snooze' | 'ignore') => void;
  /** Coach's response to the follow-up popup after hydrating: resume training / take rest. */
  respondToPostHydration: (athleteId: string, response: 'resume' | 'rest') => void;
  envConditions: EnvConditions;
  demoBooking: DemoBooking | null;
  setDemoBooking: (booking: DemoBooking | null) => void;
  updateAthleteStatus: (athleteId: string, status: AthleteStatus, action: string, coachName: string) => void;
  markHydrated: (athleteId: string) => void;
  /** Academy-wide count of critical/caution athletes, across all coaches. */
  activeAlertsCount: number;
  /** Count of critical/caution athletes scoped to a single coach — use this for per-coach badges. */
  getAlertsCountForCoach: (coachId: string) => number;
  parentAthleteId: string;
  hasParentSubscription: boolean;
  setHasParentSubscription: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const now = new Date().toISOString();

const STATUS_TO_SAFETY: Record<AthleteStatus, SafetyLevel> = {
  training: 'safe',
  sprint_drill: 'caution',
  resting: 'safe',
  hydrating: 'recovery',
  reduced_intensity: 'caution',
  paused: 'safe',
  session_ended: 'inactive',
  medical_attention: 'critical',
  not_in_session: 'inactive',
};

const INITIAL_ATHLETES: Athlete[] = [
  {
    id: 'a1',
    name: 'Arjun Sharma',
    age: 17,
    sport: 'Football',
    coachId: 'c1',
    status: 'training',
    safetyLevel: 'safe',
    uvExposure: 4.2,
    heatRisk: 'moderate',
    hydrationStatus: 'good',
    trainingDuration: 45,
    intensity: 'medium',
    lastUpdate: now,
    issueRaised: false,
    parentId: 'p1',
    actionHistory: [],
    heightCm: 172,
    weightKg: 64,
  },
  {
    id: 'a2',
    name: 'Priya Nair',
    age: 16,
    sport: 'Athletics',
    coachId: 'c1',
    status: 'sprint_drill',
    safetyLevel: 'caution',
    uvExposure: 6.8,
    heatRisk: 'high',
    hydrationStatus: 'low',
    trainingDuration: 72,
    intensity: 'high',
    lastUpdate: now,
    issueRaised: true,
    parentId: 'p2',
    actionHistory: [],
    heightCm: 161,
    weightKg: 52,
  },
  {
    id: 'a3',
    name: 'Rahul Verma',
    age: 18,
    sport: 'Cricket',
    coachId: 'c1',
    status: 'medical_attention',
    safetyLevel: 'critical',
    uvExposure: 8.1,
    heatRisk: 'extreme',
    hydrationStatus: 'critical',
    trainingDuration: 95,
    intensity: 'high',
    lastUpdate: now,
    issueRaised: true,
    parentId: 'p3',
    actionHistory: [],
    heightCm: 178,
    weightKg: 80,
  },
  {
    id: 'a4',
    name: 'Sneha Patel',
    age: 15,
    sport: 'Badminton',
    coachId: 'c2',
    status: 'hydrating',
    safetyLevel: 'recovery',
    uvExposure: 3.5,
    heatRisk: 'low',
    hydrationStatus: 'good',
    trainingDuration: 30,
    intensity: 'low',
    lastUpdate: now,
    issueRaised: false,
    parentId: 'p4',
    actionHistory: [],
    heightCm: 158,
    weightKg: 48,
  },
  {
    id: 'a5',
    name: 'Vikram Singh',
    age: 19,
    sport: 'Football',
    coachId: 'c1',
    status: 'resting',
    safetyLevel: 'safe',
    uvExposure: 5.1,
    heatRisk: 'moderate',
    hydrationStatus: 'good',
    trainingDuration: 60,
    intensity: 'medium',
    lastUpdate: now,
    issueRaised: false,
    parentId: 'p5',
    actionHistory: [],
    heightCm: 175,
    weightKg: 70,
  },
  {
    id: 'a6',
    name: 'Ananya Kumar',
    age: 16,
    sport: 'Athletics',
    coachId: 'c2',
    status: 'not_in_session',
    safetyLevel: 'inactive',
    uvExposure: 0,
    heatRisk: 'low',
    hydrationStatus: 'good',
    trainingDuration: 0,
    intensity: 'low',
    lastUpdate: now,
    issueRaised: false,
    parentId: 'p6',
    actionHistory: [],
    heightCm: 163,
    weightKg: 54,
  },
  {
    id: 'a7',
    name: 'Rohan Das',
    age: 17,
    sport: 'Cricket',
    coachId: 'c2',
    status: 'reduced_intensity',
    safetyLevel: 'caution',
    uvExposure: 5.6,
    heatRisk: 'moderate',
    hydrationStatus: 'low',
    trainingDuration: 50,
    intensity: 'low',
    lastUpdate: now,
    issueRaised: false,
    parentId: 'p7',
    actionHistory: [],
    heightCm: 169,
    weightKg: 62,
  },
  {
    id: 'a8',
    name: 'Kavya Reddy',
    age: 15,
    sport: 'Badminton',
    coachId: 'c2',
    status: 'paused',
    safetyLevel: 'safe',
    uvExposure: 2.1,
    heatRisk: 'low',
    hydrationStatus: 'good',
    trainingDuration: 20,
    intensity: 'low',
    lastUpdate: now,
    issueRaised: false,
    parentId: 'p8',
    actionHistory: [],
    heightCm: 155,
    weightKg: 46,
  },
];

const INITIAL_COACHES: Coach[] = [
  { id: 'c1', name: 'Coach Raj Mehta', sport: 'Football / Athletics / Cricket', athleteCount: 5, activeSessions: 4 },
  { id: 'c2', name: 'Coach Sunita Rao', sport: 'Badminton / Athletics / Cricket', athleteCount: 4, activeSessions: 3 },
];

const INITIAL_HISTORY: SessionHistory[] = [
  { id: 'h1', athleteName: 'Arjun Sharma', sport: 'Football', date: '2026-06-26', duration: 90, safetyIncidents: 0, coachId: 'c1', coachName: 'Raj Mehta', summary: 'Full session, safe completion.' },
  { id: 'h2', athleteName: 'Priya Nair', sport: 'Athletics', date: '2026-06-26', duration: 75, safetyIncidents: 1, coachId: 'c1', coachName: 'Raj Mehta', summary: 'Caution raised at 60 min. Hydration administered.' },
  { id: 'h3', athleteName: 'Rahul Verma', sport: 'Cricket', date: '2026-06-25', duration: 60, safetyIncidents: 2, coachId: 'c1', coachName: 'Raj Mehta', summary: 'Two caution alerts. Session ended early due to high UV.' },
  { id: 'h4', athleteName: 'Sneha Patel', sport: 'Badminton', date: '2026-06-25', duration: 45, safetyIncidents: 0, coachId: 'c2', coachName: 'Sunita Rao', summary: 'Excellent session, no incidents.' },
  { id: 'h5', athleteName: 'Vikram Singh', sport: 'Football', date: '2026-06-24', duration: 80, safetyIncidents: 1, coachId: 'c1', coachName: 'Raj Mehta', summary: 'One rest break taken. Safe completion.' },
];

const ENV: EnvConditions = {
  temperature: 34,
  uvIndex: 7.2,
  humidity: 62,
  heatRisk: 'high',
  recommendation: 'Avoid high-intensity drills between 11:00 AM – 3:00 PM. Schedule sessions before 10:00 AM or after 4:00 PM.',
  safeHours: 'Before 10:00 AM or after 4:00 PM',
  breakInterval: 20,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(null);
  const [athletes, setAthletes] = useState<Athlete[]>(INITIAL_ATHLETES);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>(INITIAL_HISTORY);
  const [hydrationAlerts, setHydrationAlerts] = useState<HydrationAlert[]>([]);
  const [demoBooking, setDemoBooking] = useState<DemoBooking | null>(null);
  const [hasParentSubscription, setHasParentSubscription] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('hs_role').then((r) => {
      if (r) setRoleState(r as UserRole);
    });
    AsyncStorage.getItem('hs_parent_sub').then((v) => {
      if (v === 'true') setHasParentSubscription(true);
    });
  }, []);

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
    if (r) AsyncStorage.setItem('hs_role', r);
  }, []);

  const updateAthleteStatus = useCallback(
    (athleteId: string, status: AthleteStatus, action: string, coachName: string) => {
      setAthletes((prev) =>
        prev.map((a) => {
          if (a.id !== athleteId) return a;
          const newSafety = STATUS_TO_SAFETY[status];
          const record: ActionRecord = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            action,
            coachName,
            timestamp: new Date().toISOString(),
          };
          return {
            ...a,
            status,
            safetyLevel: newSafety,
            issueRaised: newSafety === 'critical' || newSafety === 'caution',
            lastUpdate: new Date().toISOString(),
            actionHistory: [record, ...a.actionHistory],
          };
        })
      );
    },
    []
  );

  const markHydrated = useCallback((athleteId: string) => {
    setAthletes((prev) =>
      prev.map((a) => {
        if (a.id !== athleteId) return a;
        const record: ActionRecord = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          action: 'Hydration administered',
          coachName: 'Coach',
          timestamp: new Date().toISOString(),
        };
        return {
          ...a,
          status: 'hydrating' as AthleteStatus,
          safetyLevel: 'recovery' as SafetyLevel,
          hydrationStatus: 'good' as HydrationStatus,
          issueRaised: false,
          lastUpdate: new Date().toISOString(),
          actionHistory: [record, ...a.actionHistory],
        };
      })
    );
  }, []);

  const addSessionRecord = useCallback((record: Omit<SessionHistory, 'id'>) => {
    setSessionHistory((prev) => [
      { ...record, id: Date.now().toString() + Math.random().toString(36).slice(2, 7) },
      ...prev,
    ]);
  }, []);

  /** Shared helper so snooze/ignore responses log to the athlete's actionHistory the same way markHydrated does. */
  const logAthleteAction = useCallback((athleteId: string, action: string) => {
    setAthletes((prev) =>
      prev.map((a) => {
        if (a.id !== athleteId) return a;
        const record: ActionRecord = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          action,
          coachName: 'Coach',
          timestamp: new Date().toISOString(),
        };
        return { ...a, actionHistory: [record, ...a.actionHistory] };
      })
    );
  }, []);

  const triggerHydrationAlert = useCallback((athleteId: string, coachId: string) => {
    setHydrationAlerts((prev) => {
      // Don't create a duplicate if this athlete already has an active (pending/snoozed) alert.
      const hasActive = prev.some(
        (al) => al.athleteId === athleteId && (al.status === 'pending' || al.status === 'snoozed')
      );
      if (hasActive) return prev;

      const athlete = athletes.find((a) => a.id === athleteId);
      const alert: HydrationAlert = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        athleteId,
        athleteName: athlete?.name ?? 'Athlete',
        coachId,
        triggeredAt: new Date().toISOString(),
        status: 'pending',
      };
      return [alert, ...prev];
    });
  }, [athletes]);

  const respondToHydrationAlert = useCallback(
    (alertId: string, response: 'hydrate' | 'snooze' | 'ignore') => {
      const alert = hydrationAlerts.find((al) => al.id === alertId);
      if (!alert) return;

      if (response === 'snooze') {
        setHydrationAlerts((prev) =>
          prev.map((al) =>
            al.id === alertId
              ? { ...al, status: 'snoozed', snoozeUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString() }
              : al
          )
        );
        logAthleteAction(alert.athleteId, 'Hydration Reminder Snoozed (10 min)');
        return;
      }

      if (response === 'ignore') {
        setHydrationAlerts((prev) =>
          prev.map((al) =>
            al.id === alertId
              ? { ...al, status: 'ignored', resolvedAt: new Date().toISOString(), resolution: 'Ignored' }
              : al
          )
        );
        logAthleteAction(alert.athleteId, 'Hydration Reminder Ignored');
        return;
      }

      // response === 'hydrate': mark resolved here; the actual status/hydration change
      // happens via markHydrated, called separately so the UI can show the follow-up
      // "resume or rest" prompt before fully closing out the alert.
      setHydrationAlerts((prev) =>
        prev.map((al) =>
          al.id === alertId
            ? { ...al, status: 'resolved', resolvedAt: new Date().toISOString(), resolution: 'Hydrated' }
            : al
        )
      );
      markHydrated(alert.athleteId);
    },
    [hydrationAlerts, markHydrated, logAthleteAction]
  );

  const respondToPostHydration = useCallback((athleteId: string, response: 'resume' | 'rest') => {
    const action = response === 'resume' ? 'Resumed Training After Hydration' : 'Rest Taken After Hydration';
    const newStatus: AthleteStatus = response === 'resume' ? 'training' : 'resting';
    setAthletes((prev) =>
      prev.map((a) => {
        if (a.id !== athleteId) return a;
        const record: ActionRecord = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          action,
          coachName: 'Coach',
          timestamp: new Date().toISOString(),
        };
        return {
          ...a,
          status: newStatus,
          safetyLevel: STATUS_TO_SAFETY[newStatus],
          lastUpdate: new Date().toISOString(),
          actionHistory: [record, ...a.actionHistory],
        };
      })
    );
  }, []);

  const activeAlertsCount = athletes.filter(
    (a) => a.safetyLevel === 'critical' || a.safetyLevel === 'caution'
  ).length;

  const getAlertsCountForCoach = useCallback(
    (coachId: string) =>
      athletes.filter(
        (a) => a.coachId === coachId && (a.safetyLevel === 'critical' || a.safetyLevel === 'caution')
      ).length,
    [athletes]
  );

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        athletes,
        coaches: INITIAL_COACHES,
        sessionHistory,
        addSessionRecord,
        hydrationAlerts,
        triggerHydrationAlert,
        respondToHydrationAlert,
        respondToPostHydration,
        envConditions: ENV,
        demoBooking,
        setDemoBooking,
        updateAthleteStatus,
        markHydrated,
        activeAlertsCount,
        getAlertsCountForCoach,
        parentAthleteId: 'a1',
        hasParentSubscription,
        setHasParentSubscription: (val: boolean) => {
          setHasParentSubscription(val);
          AsyncStorage.setItem('hs_parent_sub', val ? 'true' : 'false');
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
