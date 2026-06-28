import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AISessionCard } from '@/components/AISessionCard';
import { RiskBadge } from '@/components/RiskBadge';
import { SessionRosterCard } from '@/components/SessionRosterCard';
import { SessionEnvironmentPanel } from '@/components/SessionEnvironmentPanel';
import { AthleteStatus, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function CoachSessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes, envConditions, updateAthleteStatus, markHydrated } = useApp();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [rosterOverrides, setRosterOverrides] = useState<Map<string, boolean>>(new Map());
  const [aiPlanApplied, setAiPlanApplied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myAthletes = athletes.filter((a) => a.coachId === 'c1');

  const rosterAthletes = useMemo(
    () => myAthletes.filter((a) => a.status !== 'session_ended'),
    [myAthletes]
  );

  const excludedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of rosterAthletes) {
      const override = rosterOverrides.get(a.id);
      const excluded = override !== undefined ? !override : a.safetyLevel === 'critical';
      if (excluded) ids.add(a.id);
    }
    return ids;
  }, [rosterAthletes, rosterOverrides]);

  const handleToggleOverride = (athleteId: string) => {
    setRosterOverrides((prev) => {
      const next = new Map(prev);
      const currentlyExcluded = excludedIds.has(athleteId);
      // Flip: if currently excluded, override to include (true); if included, override to exclude (false).
      next.set(athleteId, currentlyExcluded);
      return next;
    });
  };

  const inSession = rosterAthletes.filter(
    (a) => !excludedIds.has(a.id) && !['not_in_session', 'session_ended'].includes(a.status)
  );

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRunning((r) => !r);
  };

  const handleEndAll = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    rosterAthletes.forEach((a) => {
      if (!['not_in_session', 'session_ended'].includes(a.status)) {
        updateAthleteStatus(a.id, 'session_ended', 'Session Ended by Coach', 'Coach Raj Mehta');
      }
    });
    setRunning(false);
    setElapsed(0);
  };

  const quickActions: { id: AthleteStatus; label: string; icon: string; color: string }[] = [
    { id: 'resting', label: 'Rest', icon: 'moon', color: colors.safe },
    { id: 'hydrating', label: 'Hydrate', icon: 'droplet', color: colors.recovery },
    { id: 'reduced_intensity', label: 'Reduce', icon: 'trending-down', color: colors.caution },
    { id: 'paused', label: 'Pause', icon: 'pause', color: colors.inactive },
    { id: 'training', label: 'Resume', icon: 'play', color: colors.primary },
    { id: 'medical_attention', label: 'Medical', icon: 'alert-triangle', color: colors.critical },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <Text style={styles.headerTitle}>Session Control</Text>
        <Text style={styles.headerSub}>Coach Raj Mehta · {inSession.length} athletes in session</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }} showsVerticalScrollIndicator={false}>
        <SessionEnvironmentPanel env={envConditions} />

        <AISessionCard
          athletes={rosterAthletes}
          env={envConditions}
          onApply={() => setAiPlanApplied(true)}
          onAdjust={() => setAiPlanApplied(false)}
        />

        {aiPlanApplied && (
          <View style={[styles.appliedBanner, { backgroundColor: colors.safeLight, borderColor: colors.safe + '44' }]}>
            <Feather name="check-circle" size={16} color={colors.safe} />
            <Text style={[styles.appliedText, { color: colors.safeFg }]}>AI plan applied to today&apos;s session. Live risk changes will still trigger coach alerts.</Text>
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
          <Text style={[styles.timerLabel, { color: 'rgba(255,255,255,0.6)' }]}>SESSION TIMER</Text>
          <Text style={styles.timerValue}>{formatTime(elapsed)}</Text>
          <View style={styles.timerBtns}>
            <Pressable style={[styles.timerBtn, { backgroundColor: running ? colors.caution : colors.safe }]} onPress={handleToggle}>
              <Feather name={running ? 'pause' : 'play'} size={18} color="#fff" />
              <Text style={styles.timerBtnText}>{running ? 'Pause Timer' : 'Start Session'}</Text>
            </Pressable>
            <Pressable style={[styles.timerBtn, { backgroundColor: colors.critical + 'CC' }]} onPress={handleEndAll}>
              <Feather name="stop-circle" size={18} color="#fff" />
              <Text style={styles.timerBtnText}>End All</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.nav }]}>Athletes in Session ({inSession.length})</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Critical-risk athletes are excluded automatically — see roster above</Text>
          {inSession.map((athlete) => (
            <View key={athlete.id} style={[styles.athleteRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.athleteLeft}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {athlete.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.athleteName, { color: colors.foreground }]}>{athlete.name}</Text>
                  <Text style={[styles.athleteSport, { color: colors.mutedForeground }]}>{athlete.sport} · {athlete.trainingDuration}min</Text>
                </View>
              </View>
              <RiskBadge level={athlete.safetyLevel} small />
            </View>
          ))}
          {inSession.length === 0 && (
            <View style={styles.empty}>
              <Feather name="play-circle" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active sessions</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.nav }]}>Quick Actions</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Apply to all in-session athletes</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={[styles.actionCard, { backgroundColor: action.color + '15', borderColor: action.color + '44' }]}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  inSession.forEach((a) =>
                    updateAthleteStatus(a.id, action.id, action.label, 'Coach Raj Mehta')
                  );
                }}
              >
                <Feather name={action.icon as any} size={22} color={action.color} />
                <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.hydrationSection, { backgroundColor: colors.recoveryLight, borderColor: colors.recovery + '33' }]}>
          <View style={styles.hydrationHeader}>
            <Feather name="droplet" size={18} color={colors.recovery} />
            <Text style={[styles.hydrationTitle, { color: colors.recoveryFg }]}>Hydration Guidance</Text>
          </View>
          <Text style={[styles.hydrationText, { color: colors.recoveryFg }]}>
            Current conditions: {athletes[0]?.heatRisk?.toUpperCase() ?? 'MODERATE'} heat risk · UV {athletes[0]?.uvExposure?.toFixed(1) ?? '5.0'}.{'\n'}
            Recommend hydration every 20 minutes. Athletes should consume 250–350ml per break.
          </Text>
          <Pressable
            style={[styles.hydrateAllBtn, { backgroundColor: colors.recovery }]}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              inSession.forEach((a) => markHydrated(a.id));
            }}
          >
            <Feather name="droplet" size={15} color="#fff" />
            <Text style={styles.hydrateAllText}>Mark All Hydrated</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' as const, marginTop: 14 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  timerCard: { margin: 16, borderRadius: 20, padding: 24, alignItems: 'center', gap: 6 },
  timerLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1 },
  timerValue: { color: '#fff', fontSize: 48, fontWeight: '800' as const, letterSpacing: -1 },
  timerBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
  timerBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  timerBtnText: { color: '#fff', fontWeight: '700' as const, fontSize: 14 },
  section: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  sectionSub: { fontSize: 12, marginTop: -4 },
  athleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 12 },
  athleteLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' as const },
  athleteName: { fontSize: 14, fontWeight: '600' as const },
  athleteSport: { fontSize: 12, marginTop: 1 },
  empty: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 14 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '30%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, gap: 6, flexGrow: 1 },
  actionLabel: { fontSize: 11, fontWeight: '600' as const },
  appliedBanner: { marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 11 },
  appliedText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '600' as const },
  hydrationSection: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  hydrationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hydrationTitle: { fontSize: 15, fontWeight: '700' as const },
  hydrationText: { fontSize: 13, lineHeight: 20 },
  hydrateAllBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 11 },
  hydrateAllText: { color: '#fff', fontSize: 14, fontWeight: '700' as const },
});
