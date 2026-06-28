import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
export type AlertSeverity = 'info' | 'caution' | 'critical';
export type AlertStatus = 'active' | 'snoozed' | 'hydrating' | 'resolved' | 'ignored';
export type AlertType = 'hydration_required' | 'heat_risk' | 'critical_risk';

export interface AthleteBodyMetrics {
  heightCm: number;
  weightKg: number;
  bmi: number;
  bodyFatPercent: number;
  restingHeartRate: number;
  recoveryScore: number;
  sleepScore: number;
  fatigueScore: number;
  heatAcclimatisation: 'low' | 'medium' | 'high';
  medicalRestrictions?: string[];
  injuryHistory?: string[];
}

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
  bodyMetrics: AthleteBodyMetrics;
  actionHistory: ActionRecord[];
}

export interface ActionRecord {
  id: string;
  action: string;
  coachName: string;
  timestamp: string;
  note?: string;
  alertId?: string;
}

export interface AlertActionRecord {
  id: string;
  action: string;
  label: string;
  coachName: string;
  timestamp: string;
  note?: string;
}

export interface SafetyAlert {
  id: string;
  coachId: string;
  athleteIds: string[];
  athleteNames: string[];
  type: AlertType;
  title: string;
  message: string;
  reason: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  nextReminderAt?: string;
  actions: AlertActionRecord[];
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

interface CreateAlertInput {
  coachId: string;
  athleteIds: string[];
  type: AlertType;
  title: string;
  message: string;
  reason: string;
  severity: AlertSeverity;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  athletes: Athlete[];
  coaches: Coach[];
  sessionHistory: SessionHistory[];
  safetyAlerts: SafetyAlert[];
  envConditions: EnvConditions;
  demoBooking: DemoBooking | null;
  setDemoBooking: (booking: DemoBooking | null) => void;
  updateAthleteStatus: (
    athleteId: string,
    status: AthleteStatus,
    action: string,
    coachName: string,
    note?: string,
    alertId?: string
  ) => void;
  markHydrated: (athleteId: string, coachName?: string, alertId?: string) => void;
  addSessionRecord: (record: SessionHistory) => void;
  createSafetyAlert: (input: CreateAlertInput) => string;
  recordAlertAction: (
    alertId: string,
    action: string,
    label: string,
    coachName: string,
    status: AlertStatus,
    note?: string,
    nextReminderAt?: string
  ) => void;
  activeAlertsCount: number;
  getAlertsCountForCoach: (coachId: string) => number;
  getAlertsForCoach: (coachId: string) => SafetyAlert[];
  parentAthleteId: string;
  hasParentSubscription: boolean;
  setHasParentSubscription: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  role: 'hs_role',
  parentSubscription: 'hs_parent_sub',
  athletes: 'hs_athletes',
  alerts: 'hs_safety_alerts',
  sessionHistory: 'hs_session_history',
};

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

const bmi = (weightKg: number, heightCm: number) =>
  Number((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1));

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
    bodyMetrics: {
      heightCm: 176,
      weightKg: 68,
      bmi: bmi(68, 176),
      bodyFatPercent: 14,
      restingHeartRate: 58,
      recoveryScore: 82,
      sleepScore: 79,
      fatigueScore: 28,
      heatAcclimatisation: 'high',
      medicalRestrictions: [],
      injuryHistory: ['Minor ankle strain - recovered'],
    },
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
    bodyMetrics: {
      heightCm: 165,
      weightKg: 54,
      bmi: bmi(54, 165),
      bodyFatPercent: 18,
      restingHeartRate: 62,
      recoveryScore: 64,
      sleepScore: 61,
      fatigueScore: 58,
      heatAcclimatisation: 'medium',
      medicalRestrictions: [],
      injuryHistory: [],
    },
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
    bodyMetrics: {
      heightCm: 181,
      weightKg: 84,
      bmi: bmi(84, 181),
      bodyFatPercent: 21,
      restingHeartRate: 72,
      recoveryScore: 42,
      sleepScore: 48,
      fatigueScore: 76,
      heatAcclimatisation: 'low',
      medicalRestrictions: ['Previous heat exhaustion'],
      injuryHistory: ['Lower-back tightness'],
    },
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
    bodyMetrics: {
      heightCm: 160,
      weightKg: 50,
      bmi: bmi(50, 160),
      bodyFatPercent: 20,
      restingHeartRate: 64,
      recoveryScore: 88,
      sleepScore: 86,
      fatigueScore: 18,
      heatAcclimatisation: 'high',
      medicalRestrictions: [],
      injuryHistory: [],
    },
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
    bodyMetrics: {
      heightCm: 183,
      weightKg: 79,
      bmi: bmi(79, 183),
      bodyFatPercent: 16,
      restingHeartRate: 56,
      recoveryScore: 76,
      sleepScore: 72,
      fatigueScore: 34,
      heatAcclimatisation: 'high',
      medicalRestrictions: [],
      injuryHistory: ['Hamstring strain - recovered'],
    },
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
    bodyMetrics: {
      heightCm: 167,
      weightKg: 55,
      bmi: bmi(55, 167),
      bodyFatPercent: 19,
      restingHeartRate: 60,
      recoveryScore: 84,
      sleepScore: 82,
      fatigueScore: 24,
      heatAcclimatisation: 'medium',
      medicalRestrictions: [],
      injuryHistory: [],
    },
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
    bodyMetrics: {
      heightCm: 174,
      weightKg: 66,
      bmi: bmi(66, 174),
      bodyFatPercent: 15,
      restingHeartRate: 63,
      recoveryScore: 66,
      sleepScore: 69,
      fatigueScore: 52,
      heatAcclimatisation: 'medium',
      medicalRestrictions: [],
      injuryHistory: [],
    },
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
    bodyMetrics: {
      heightCm: 158,
      weightKg: 48,
      bmi: bmi(48, 158),
      bodyFatPercent: 21,
      restingHeartRate: 65,
      recoveryScore: 91,
      sleepScore: 89,
      fatigueScore: 14,
      heatAcclimatisation: 'high',
      medicalRestrictions: [],
      injuryHistory: [],
    },
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

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(null);
  const [athletes, setAthletes] = useState<Athlete[]>(INITIAL_ATHLETES);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>(INITIAL_HISTORY);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [demoBooking, setDemoBooking] = useState<DemoBooking | null>(null);
  const [hasParentSubscription, setHasParentSubscription] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.role),
      AsyncStorage.getItem(STORAGE_KEYS.parentSubscription),
      AsyncStorage.getItem(STORAGE_KEYS.athletes),
      AsyncStorage.getItem(STORAGE_KEYS.alerts),
      AsyncStorage.getItem(STORAGE_KEYS.sessionHistory),
    ]).then(([savedRole, parentSub, savedAthletes, savedAlerts, savedHistory]) => {
      if (savedRole) setRoleState(savedRole as UserRole);
      if (parentSub === 'true') setHasParentSubscription(true);
      if (savedAthletes) setAthletes(JSON.parse(savedAthletes));
      if (savedAlerts) setSafetyAlerts(JSON.parse(savedAlerts));
      if (savedHistory) setSessionHistory(JSON.parse(savedHistory));
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    AsyncStorage.setItem(STORAGE_KEYS.athletes, JSON.stringify(athletes));
  }, [athletes, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    AsyncStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(safetyAlerts));
  }, [safetyAlerts, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    AsyncStorage.setItem(STORAGE_KEYS.sessionHistory, JSON.stringify(sessionHistory));
  }, [sessionHistory, storageReady]);

  const setRole = useCallback((nextRole: UserRole) => {
    setRoleState(nextRole);
    if (nextRole) AsyncStorage.setItem(STORAGE_KEYS.role, nextRole);
  }, []);

  const updateAthleteStatus = useCallback(
    (
      athleteId: string,
      status: AthleteStatus,
      action: string,
      coachName: string,
      note?: string,
      alertId?: string
    ) => {
      setAthletes((previous) =>
        previous.map((athlete) => {
          if (athlete.id !== athleteId) return athlete;
          const newSafety = STATUS_TO_SAFETY[status];
          const record: ActionRecord = {
            id: makeId('action'),
            action,
            coachName,
            timestamp: new Date().toISOString(),
            note,
            alertId,
          };

          return {
            ...athlete,
            status,
            safetyLevel: newSafety,
            issueRaised: newSafety === 'critical' || newSafety === 'caution',
            lastUpdate: new Date().toISOString(),
            actionHistory: [record, ...athlete.actionHistory],
          };
        })
      );
    },
    []
  );

  const markHydrated = useCallback((athleteId: string, coachName = 'Coach', alertId?: string) => {
    setAthletes((previous) =>
      previous.map((athlete) => {
        if (athlete.id !== athleteId) return athlete;
        const record: ActionRecord = {
          id: makeId('action'),
          action: 'Hydration administered',
          coachName,
          timestamp: new Date().toISOString(),
          note: 'Athlete marked as hydrated from hydration alert.',
          alertId,
        };

        return {
          ...athlete,
          status: 'hydrating',
          safetyLevel: 'recovery',
          hydrationStatus: 'good',
          issueRaised: false,
          lastUpdate: new Date().toISOString(),
          actionHistory: [record, ...athlete.actionHistory],
        };
      })
    );
  }, []);

  const addSessionRecord = useCallback((record: SessionHistory) => {
    setSessionHistory((previous) => [record, ...previous]);
  }, []);

  const createSafetyAlert = useCallback(
    (input: CreateAlertInput) => {
      const createdAt = new Date().toISOString();
      const alertId = makeId('alert');
      const names = athletes
        .filter((athlete) => input.athleteIds.includes(athlete.id))
        .map((athlete) => athlete.name);

      const alert: SafetyAlert = {
        id: alertId,
        coachId: input.coachId,
        athleteIds: input.athleteIds,
        athleteNames: names,
        type: input.type,
        title: input.title,
        message: input.message,
        reason: input.reason,
        severity: input.severity,
        status: 'active',
        createdAt,
        updatedAt: createdAt,
        actions: [],
      };

      setSafetyAlerts((previous) => [alert, ...previous]);
      return alertId;
    },
    [athletes]
  );

  const recordAlertAction = useCallback(
    (
      alertId: string,
      action: string,
      label: string,
      coachName: string,
      status: AlertStatus,
      note?: string,
      nextReminderAt?: string
    ) => {
      const timestamp = new Date().toISOString();
      let affectedAthleteIds: string[] = [];

      setSafetyAlerts((previous) =>
        previous.map((alert) => {
          if (alert.id !== alertId) return alert;
          affectedAthleteIds = alert.athleteIds;

          const actionRecord: AlertActionRecord = {
            id: makeId('alert-action'),
            action,
            label,
            coachName,
            timestamp,
            note,
          };

          return {
            ...alert,
            status,
            updatedAt: timestamp,
            nextReminderAt,
            actions: [actionRecord, ...alert.actions],
          };
        })
      );

      if (affectedAthleteIds.length > 0) {
        setAthletes((previous) =>
          previous.map((athlete) => {
            if (!affectedAthleteIds.includes(athlete.id)) return athlete;

            const actionRecord: ActionRecord = {
              id: makeId('action'),
              action: label,
              coachName,
              timestamp,
              note,
              alertId,
            };

            return {
              ...athlete,
              lastUpdate: timestamp,
              actionHistory: [actionRecord, ...athlete.actionHistory],
            };
          })
        );
      }
    },
    []
  );

  const activeAlertsCount = useMemo(
    () =>
      safetyAlerts.filter((alert) =>
        ['active', 'snoozed', 'hydrating'].includes(alert.status)
      ).length +
      athletes.filter(
        (athlete) =>
          athlete.safetyLevel === 'critical' || athlete.safetyLevel === 'caution'
      ).length,
    [athletes, safetyAlerts]
  );

  const getAlertsCountForCoach = useCallback(
    (coachId: string) =>
      safetyAlerts.filter(
        (alert) =>
          alert.coachId === coachId &&
          ['active', 'snoozed', 'hydrating'].includes(alert.status)
      ).length +
      athletes.filter(
        (athlete) =>
          athlete.coachId === coachId &&
          (athlete.safetyLevel === 'critical' || athlete.safetyLevel === 'caution')
      ).length,
    [athletes, safetyAlerts]
  );

  const getAlertsForCoach = useCallback(
    (coachId: string) =>
      safetyAlerts
        .filter((alert) => alert.coachId === coachId)
        .sort(
          (first, second) =>
            new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
        ),
    [safetyAlerts]
  );

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        athletes,
        coaches: INITIAL_COACHES,
        sessionHistory,
        safetyAlerts,
        envConditions: ENV,
        demoBooking,
        setDemoBooking,
        updateAthleteStatus,
        markHydrated,
        addSessionRecord,
        createSafetyAlert,
        recordAlertAction,
        activeAlertsCount,
        getAlertsCountForCoach,
        getAlertsForCoach,
        parentAthleteId: 'a1',
        hasParentSubscription,
        setHasParentSubscription: (value: boolean) => {
          setHasParentSubscription(value);
          AsyncStorage.setItem(STORAGE_KEYS.parentSubscription, value ? 'true' : 'false');
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
