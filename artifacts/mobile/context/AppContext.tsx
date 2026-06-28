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
}

export interface ActionRecord {
  id: string;
  action: string;
  coachName: string;
  timestamp: string;
  note?: string;
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
  envConditions: EnvConditions;
  demoBooking: DemoBooking | null;
  setDemoBooking: (booking: DemoBooking | null) => void;
  updateAthleteStatus: (athleteId: string, status: AthleteStatus, action: string, coachName: string) => void;
  markHydrated: (athleteId: string) => void;
  addSessionRecord: (record: SessionHistory) => void;
  activeAlertsCount: number;
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
  },
];

const INITIAL_COACHES: Coach[] = [
  { id: 'c1', name: 'Coach Raj Mehta', sport: 'Football / Athletics / Cricket', athleteCount: 5, activeSessions: 4 },
  { id: 'c2', name: 'Coach Sunita Rao', sport: 'Badminton / Athletics / Cricket', athleteCount: 4, activeSessions: 3 },
];

const INITIAL_HISTORY: SessionHistory[] = [
  { id: 'h1', athleteName: 'Arjun Sharma', sport: 'Football', date: '2026-06-26', duration: 90, safetyIncidents: 0, coachName: 'Raj Mehta', summary: 'Full session, safe completion.' },
  { id: 'h2', athleteName: 'Priya Nair', sport: 'Athletics', date: '2026-06-26', duration: 75, safetyIncidents: 1, coachName: 'Raj Mehta', summary: 'Caution raised at 60 min. Hydration administered.' },
  { id: 'h3', athleteName: 'Rahul Verma', sport: 'Cricket', date: '2026-06-25', duration: 60, safetyIncidents: 2, coachName: 'Raj Mehta', summary: 'Two caution alerts. Session ended early due to high UV.' },
  { id: 'h4', athleteName: 'Sneha Patel', sport: 'Badminton', date: '2026-06-25', duration: 45, safetyIncidents: 0, coachName: 'Sunita Rao', summary: 'Excellent session, no incidents.' },
  { id: 'h5', athleteName: 'Vikram Singh', sport: 'Football', date: '2026-06-24', duration: 80, safetyIncidents: 1, coachName: 'Raj Mehta', summary: 'One rest break taken. Safe completion.' },
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

  const addSessionRecord = useCallback((record: SessionHistory) => {
    setSessionHistory((prev) => [record, ...prev]);
  }, []);

  const activeAlertsCount = athletes.filter(
    (a) => a.safetyLevel === 'critical' || a.safetyLevel === 'caution'
  ).length;

  const getAlertsCountForCoach = useCallback(
    (coachId: string) =>
      athletes.filter(
        (a) =>
          a.coachId === coachId &&
          (a.safetyLevel === 'critical' || a.safetyLevel === 'caution')
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
        envConditions: ENV,
        demoBooking,
        setDemoBooking,
        updateAthleteStatus,
        markHydrated,
        addSessionRecord,
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
