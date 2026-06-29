import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AISessionCard } from '@/components/AISessionCard';
import { RiskBadge } from '@/components/RiskBadge';
import { SessionRosterCard } from '@/components/SessionRosterCard';
import { SessionEnvironmentPanel } from '@/components/SessionEnvironmentPanel';
import { Athlete, AthleteStatus, SafetyAlert, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const COACH_ID = 'c1';
const COACH_NAME = 'Coach Raj Mehta';
const HYDRATION_TRIGGER_SECONDS = 60;
const REMINDER_MINUTES = 10;

export default function CoachSessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    athletes,
    envConditions,
    safetyAlerts,
    updateAthleteStatus,
    markHydrated,
    createSafetyAlert,
    recordAlertAction,
  } = useApp();

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [rosterOverrides, setRosterOverrides] = useState<Map<string, boolean>>(new Map());
  const [aiPlanApplied, setAiPlanApplied] = useState(false);
  const [activeHydrationAlert, setActiveHydrationAlert] = useState<SafetyAlert | null>(null);
  const [followUpAlert, setFollowUpAlert] = useState<SafetyAlert | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hydrationTriggeredRef = useRef(false);

  const myAthletes = athletes.filter((athlete) => athlete.coachId === COACH_ID);

  const rosterAthletes = useMemo(
    () => myAthletes.filter((athlete) => athlete.status !== 'session_ended'),
    [myAthletes]
  );

  const excludedIds = useMemo(() => {
    const ids = new Set<string>();

    for (const athlete of rosterAthletes) {
      const override = rosterOverrides.get(athlete.id);
      const excluded = override !== undefined ? !override : athlete.safetyLevel === 'critical';
      if (excluded) ids.add(athlete.id);
    }

    return ids;
  }, [rosterAthletes, rosterOverrides]);

  const inSession = rosterAthletes.filter(
    (athlete) =>
      !excludedIds.has(athlete.id) &&
      !['not_in_session', 'session_ended'].includes(athlete.status)
  );

  const hydrationCandidates = useMemo(() => {
    const candidates = inSession.filter((athlete) => {
      const metrics = athlete.bodyMetrics;
      const bmiRisk = metrics.bmi < 18.5 || metrics.bmi >= 25;
      const recoveryRisk = metrics.recoveryScore < 70;
      const fatigueRisk = metrics.fatigueScore >= 50;
      const heatRisk = athlete.heatRisk === 'high' || athlete.heatRisk === 'extreme';
      const intensityRisk = athlete.intensity === 'high';
      const hydrationRisk = athlete.hydrationStatus !== 'good';

      return bmiRisk || recoveryRisk || fatigueRisk || heatRisk || intensityRisk || hydrationRisk;
    });

    return candidates.length > 0 ? candidates : inSession;
  }, [inSession]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed((current) => current + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (
      !running ||
      elapsed < HYDRATION_TRIGGER_SECONDS ||
      hydrationTriggeredRef.current ||
      hydrationCandidates.length === 0
    ) {
      return;
    }

    hydrationTriggeredRef.current = true;
    setRunning(false);

    const athleteIds = hydrationCandidates.map((athlete) => athlete.id);
    const names = hydrationCandidates.map((athlete) => athlete.name);
    const alertId = createSafetyAlert({
      coachId: COACH_ID,
      athleteIds,
      type: 'hydration_required',
      title: 'Athletes need hydration',
      message: `${names.join(', ')} need a hydration break after ${Math.floor(
        elapsed / 60
      )} minute of training.`,
      reason:
        'Helio AI combined session duration, heat risk, UV exposure, BMI, recovery score, fatigue, training intensity and current hydration status.',
      severity: envConditions.heatRisk === 'extreme' ? 'critical' : 'caution',
    });

    setActiveHydrationAlert({
      id: alertId,
      coachId: COACH_ID,
      athleteIds,
      athleteNames: names,
      type: 'hydration_required',
      title: 'Athletes need hydration',
      message: `${names.join(', ')} need a hydration break after ${Math.floor(
        elapsed / 60
      )} minute of training.`,
      reason:
        'Helio AI combined session duration, heat risk, UV exposure, BMI, recovery score, fatigue, training intensity and current hydration status.',
      severity: envConditions.heatRisk === 'extreme' ? 'critical' : 'caution',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actions: [],
    });

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [
    createSafetyAlert,
    elapsed,
    envConditions.heatRisk,
    hydrationCandidates,
    running,
  ]);

  useEffect(() => {
    const reminderTimer = setInterval(() => {
      if (activeHydrationAlert || followUpAlert) return;

      const dueAlert = safetyAlerts.find(
        (alert) =>
          alert.coachId === COACH_ID &&
          alert.type === 'hydration_required' &&
          alert.status === 'snoozed' &&
          alert.nextReminderAt &&
          new Date(alert.nextReminderAt).getTime() <= Date.now()
      );

      if (dueAlert) {
        recordAlertAction(
          dueAlert.id,
          'reminder_reopened',
          'Hydration reminder shown again',
          COACH_NAME,
          'active',
          'The 10-minute snooze period ended.'
        );
        setActiveHydrationAlert({ ...dueAlert, status: 'active' });
      }
    }, 5000);

    return () => clearInterval(reminderTimer);
  }, [activeHydrationAlert, followUpAlert, recordAlertAction, safetyAlerts]);

  useEffect(() => {
    if (activeHydrationAlert || followUpAlert) return;

    const unresolvedAlert = safetyAlerts.find(
      (alert) =>
        alert.coachId === COACH_ID &&
        alert.type === 'hydration_required' &&
        ['active', 'hydrating'].includes(alert.status)
    );

    if (!unresolvedAlert) return;

    setRunning(false);
    hydrationTriggeredRef.current = true;

    if (unresolvedAlert.status === 'hydrating') {
      setFollowUpAlert(unresolvedAlert);
    } else {
      setActiveHydrationAlert(unresolvedAlert);
    }
  }, [activeHydrationAlert, followUpAlert, safetyAlerts]);

  const handleToggleOverride = (athleteId: string) => {
    setRosterOverrides((previous) => {
      const next = new Map(previous);
      next.set(athleteId, excludedIds.has(athleteId));
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
          .toString()
          .padStart(2, '0')}`
      : `${minutes.toString().padStart(2, '0')}:${remainingSeconds
          .toString()
          .padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!running && elapsed === 0) {
      hydrationTriggeredRef.current = false;
      setActiveHydrationAlert(null);
      setFollowUpAlert(null);
    }

    setRunning((current) => !current);
  };

  const handleIgnoreHydration = () => {
    if (!activeHydrationAlert) return;

    recordAlertAction(
      activeHydrationAlert.id,
      'ignore',
      'Hydration alert ignored',
      COACH_NAME,
      'ignored',
      'Coach dismissed the hydration recommendation.'
    );
    setActiveHydrationAlert(null);
  };

  const handleRemindLater = () => {
    if (!activeHydrationAlert) return;

    const nextReminderAt = new Date(
      Date.now() + REMINDER_MINUTES * 60 * 1000
    ).toISOString();

    recordAlertAction(
      activeHydrationAlert.id,
      'snooze',
      `Remind in ${REMINDER_MINUTES} minutes`,
      COACH_NAME,
      'snoozed',
      `Hydration alert snoozed until ${new Date(nextReminderAt).toLocaleTimeString()}.`,
      nextReminderAt
    );
    setActiveHydrationAlert(null);
  };

  const handleHydrate = () => {
    if (!activeHydrationAlert) return;

    activeHydrationAlert.athleteIds.forEach((athleteId) =>
      markHydrated(athleteId, COACH_NAME, activeHydrationAlert.id)
    );

    recordAlertAction(
      activeHydrationAlert.id,
      'hydrate',
      'Hydration administered',
      COACH_NAME,
      'hydrating',
      'Affected athletes were moved to Hydrating status.'
    );

    setFollowUpAlert({ ...activeHydrationAlert, status: 'hydrating' });
    setActiveHydrationAlert(null);
  };

  const handlePostHydrationAction = (action: 'resume' | 'rest') => {
    if (!followUpAlert) return;

    const nextStatus: AthleteStatus = action === 'resume' ? 'training' : 'resting';
    const actionLabel = action === 'resume' ? 'Session resumed after hydration' : 'Rest taken after hydration';

    followUpAlert.athleteIds.forEach((athleteId) =>
      updateAthleteStatus(
        athleteId,
        nextStatus,
        actionLabel,
        COACH_NAME,
        `Follow-up action for alert ${followUpAlert.id}.`,
        followUpAlert.id
      )
    );

    recordAlertAction(
      followUpAlert.id,
      action,
      actionLabel,
      COACH_NAME,
      'resolved',
      action === 'resume'
        ? 'Athletes returned to active training.'
        : 'Athletes moved to recovery rest.'
    );

    if (action === 'resume') {
      setRunning(true);
    }

    setFollowUpAlert(null);
  };

  const handleEndAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    rosterAthletes.forEach((athlete) => {
      if (!['not_in_session', 'session_ended'].includes(athlete.status)) {
        updateAthleteStatus(
          athlete.id,
          'session_ended',
          'Session Ended by Coach',
          COACH_NAME
        );
      }
    });

    setRunning(false);
    setElapsed(0);
    setAiPlanApplied(false);
    hydrationTriggeredRef.current = false;
  };

  const quickActions: {
    id: AthleteStatus;
    label: string;
    icon: string;
    color: string;
  }[] = [
    { id: 'resting', label: 'Rest', icon: 'moon', color: colors.safe },
    { id: 'hydrating', label: 'Hydrate', icon: 'droplet', color: colors.recovery },
    { id: 'reduced_intensity', label: 'Reduce', icon: 'trending-down', color: colors.caution },
    { id: 'paused', label: 'Pause', icon: 'pause', color: colors.inactive },
    { id: 'training', label: 'Resume', icon: 'play', color: colors.primary },
    { id: 'medical_attention', label: 'Medical', icon: 'alert-triangle', color: colors.critical },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.nav,
            paddingTop: Platform.OS === 'web' ? 67 : insets.top,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Session Control</Text>
        <Text style={styles.headerSub}>
          {COACH_NAME} · {inSession.length} athletes in session
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <SessionEnvironmentPanel env={envConditions} />

        <AISessionCard
          athletes={rosterAthletes}
          env={envConditions}
          onApply={() => setAiPlanApplied(true)}
          onAdjust={() => setAiPlanApplied(false)}
        />

        {aiPlanApplied && (
          <View
            style={[
              styles.appliedBanner,
              {
                backgroundColor: colors.safeLight,
                borderColor: `${colors.safe}44`,
              },
            ]}
          >
            <Feather name="check-circle" size={16} color={colors.safe} />
            <Text style={[styles.appliedText, { color: colors.safeFg }]}>
              AI plan applied. Body metrics, recovery and hydration thresholds are now being monitored.
            </Text>
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          <SessionRosterCard
            athletes={rosterAthletes}
            overrides={rosterOverrides}
            onToggleOverride={handleToggleOverride}
          />
        </View>

        <View style={[styles.timerCard, { backgroundColor: colors.nav }]}>
          <Text style={styles.timerLabel}>SESSION TIMER</Text>
          <Text style={styles.timerValue}>{formatTime(elapsed)}</Text>
          <Text style={styles.demoNote}>
            Demo hydration alert triggers at 01:00
          </Text>

          <View style={styles.timerBtns}>
            <Pressable
              style={[
                styles.timerBtn,
                { backgroundColor: running ? colors.caution : colors.safe },
              ]}
              onPress={handleToggle}
            >
              <Feather name={running ? 'pause' : 'play'} size={18} color="#fff" />
              <Text style={styles.timerBtnText}>
                {running ? 'Pause Timer' : elapsed > 0 ? 'Resume Session' : 'Start Session'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.timerBtn,
                { backgroundColor: `${colors.critical}CC` },
              ]}
              onPress={handleEndAll}
            >
              <Feather name="stop-circle" size={18} color="#fff" />
              <Text style={styles.timerBtnText}>End All</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.nav }]}>
            Athletes in Session ({inSession.length})
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Helio AI uses BMI, body composition, recovery, fatigue, heat acclimatisation and live conditions.
          </Text>

          {inSession.map((athlete) => (
            <AthleteSessionRow key={athlete.id} athlete={athlete} colors={colors} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.nav }]}>
            Quick Actions
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Apply to all in-session athletes
          </Text>

          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: `${action.color}15`,
                    borderColor: `${action.color}44`,
                  },
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  inSession.forEach((athlete) =>
                    updateAthleteStatus(
                      athlete.id,
                      action.id,
                      action.label,
                      COACH_NAME
                    )
                  );
                }}
              >
                <Feather name={action.icon as any} size={22} color={action.color} />
                <Text style={[styles.actionLabel, { color: action.color }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <HydrationAlertModal
        alert={activeHydrationAlert}
        visible={!!activeHydrationAlert}
        athletes={hydrationCandidates}
        colors={colors}
        onIgnore={handleIgnoreHydration}
        onHydrate={handleHydrate}
        onRemind={handleRemindLater}
      />

      <PostHydrationModal
        visible={!!followUpAlert}
        colors={colors}
        onResume={() => handlePostHydrationAction('resume')}
        onRest={() => handlePostHydrationAction('rest')}
      />
    </View>
  );
}

function AthleteSessionRow({ athlete, colors }: { athlete: Athlete; colors: any }) {
  return (
    <View
      style={[
        styles.athleteRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.athleteLeft}>
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {athlete.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.athleteName, { color: colors.foreground }]}>
            {athlete.name}
          </Text>
          <Text style={[styles.athleteSport, { color: colors.mutedForeground }]}>
            BMI {athlete.bodyMetrics.bmi} · Body fat {athlete.bodyMetrics.bodyFatPercent}% · Recovery {athlete.bodyMetrics.recoveryScore}
          </Text>
          <Text style={[styles.athleteSport, { color: colors.mutedForeground }]}>
            Fatigue {athlete.bodyMetrics.fatigueScore} · Resting HR {athlete.bodyMetrics.restingHeartRate} bpm
          </Text>
        </View>
      </View>

      <RiskBadge level={athlete.safetyLevel} small />
    </View>
  );
}

function HydrationAlertModal({
  alert,
  visible,
  athletes,
  colors,
  onIgnore,
  onHydrate,
  onRemind,
}: {
  alert: SafetyAlert | null;
  visible: boolean;
  athletes: Athlete[];
  colors: any;
  onIgnore: () => void;
  onHydrate: () => void;
  onRemind: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onIgnore}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <View style={[styles.modalIcon, { backgroundColor: colors.recoveryLight }]}>
            <Feather name="droplet" size={28} color={colors.recovery} />
          </View>

          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {alert?.title ?? 'Athletes need hydration'}
          </Text>
          <Text style={[styles.modalMessage, { color: colors.mutedForeground }]}>
            {alert?.message}
          </Text>

          <View style={[styles.reasonBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.reasonTitle, { color: colors.foreground }]}>
              Why Helio AI triggered this
            </Text>
            <Text style={[styles.reasonText, { color: colors.mutedForeground }]}>
              {alert?.reason}
            </Text>
          </View>

          <View style={styles.metricWrap}>
            {athletes.slice(0, 3).map((athlete) => (
              <View
                key={athlete.id}
                style={[styles.metricChip, { borderColor: colors.border }]}
              >
                <Text style={[styles.metricName, { color: colors.foreground }]}>
                  {athlete.name}
                </Text>
                <Text style={[styles.metricText, { color: colors.mutedForeground }]}>
                  BMI {athlete.bodyMetrics.bmi} · Recovery {athlete.bodyMetrics.recoveryScore} · Fatigue {athlete.bodyMetrics.fatigueScore}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            style={[styles.primaryModalBtn, { backgroundColor: colors.recovery }]}
            onPress={onHydrate}
          >
            <Feather name="droplet" size={16} color="#fff" />
            <Text style={styles.primaryModalBtnText}>Hydrate athletes</Text>
          </Pressable>

          <View style={styles.secondaryActions}>
            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={onIgnore}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>
                Ignore
              </Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={onRemind}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                Remind in 10 min
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PostHydrationModal({
  visible,
  colors,
  onResume,
  onRest,
}: {
  visible: boolean;
  colors: any;
  onResume: () => void;
  onRest: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <View style={[styles.modalIcon, { backgroundColor: colors.safeLight }]}>
            <Feather name="check-circle" size={28} color={colors.safe} />
          </View>

          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Hydration completed
          </Text>
          <Text style={[styles.modalMessage, { color: colors.mutedForeground }]}>
            What should the athletes do next?
          </Text>

          <Pressable
            style={[styles.primaryModalBtn, { backgroundColor: colors.primary }]}
            onPress={onResume}
          >
            <Feather name="play" size={16} color="#fff" />
            <Text style={styles.primaryModalBtnText}>Resume session</Text>
          </Pressable>

          <Pressable
            style={[styles.restBtn, { backgroundColor: colors.safeLight }]}
            onPress={onRest}
          >
            <Feather name="moon" size={16} color={colors.safe} />
            <Text style={[styles.restBtnText, { color: colors.safe }]}>
              Take rest
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 14 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  appliedBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
  },
  appliedText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  timerCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  timerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  timerValue: { color: '#fff', fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  demoNote: { color: 'rgba(255,255,255,0.52)', fontSize: 10 },
  timerBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
  timerBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  timerBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSub: { fontSize: 12, marginTop: -4, lineHeight: 18 },
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  athleteLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700' },
  athleteName: { fontSize: 14, fontWeight: '600' },
  athleteSport: { fontSize: 10, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    flexGrow: 1,
  },
  actionLabel: { fontSize: 11, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 22,
    padding: 20,
    alignItems: 'stretch',
    gap: 12,
  },
  modalIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalTitle: { fontSize: 21, fontWeight: '800', textAlign: 'center' },
  modalMessage: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  reasonBox: { borderRadius: 12, padding: 12, gap: 4 },
  reasonTitle: { fontSize: 12, fontWeight: '700' },
  reasonText: { fontSize: 11, lineHeight: 17 },
  metricWrap: { gap: 7 },
  metricChip: { borderWidth: 1, borderRadius: 10, padding: 9 },
  metricName: { fontSize: 12, fontWeight: '700' },
  metricText: { fontSize: 10, marginTop: 2 },
  primaryModalBtn: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 13,
  },
  primaryModalBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryActions: { flexDirection: 'row', gap: 8 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '700' },
  restBtn: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 13,
  },
  restBtnText: { fontSize: 14, fontWeight: '700' },
});
