import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Athlete, EnvConditions } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  athletes: Athlete[];
  env: EnvConditions;
  onApply?: (recommendation: Recommendation) => void;
  onAdjust?: () => void;
}

type RecommendedIntensity = 'low' | 'moderate' | 'high';

export interface Recommendation {
  intensity: RecommendedIntensity;
  loadPercent: number;
  durationMin: number;
  plannedDurationMin: number;
  bestWindow: string;
  hydrationIntervalMin: number;
  sessionFocus: string;
  reason: string;
}

function buildRecommendation(athletes: Athlete[], env: EnvConditions): Recommendation {
  const total = Math.max(athletes.length, 1);
  const criticalCount = athletes.filter((a) => a.safetyLevel === 'critical').length;
  const cautionCount = athletes.filter((a) => a.safetyLevel === 'caution').length;
  const lowHydrationCount = athletes.filter((a) => a.hydrationStatus !== 'good').length;
  const riskLoad = (criticalCount * 2 + cautionCount) / total;
  const plannedDurationMin = 90;

  let intensity: RecommendedIntensity = 'high';
  let loadPercent = 82;
  let hydrationIntervalMin = 25;
  let sessionFocus = 'High-intensity conditioning with monitored recovery';

  if (env.heatRisk === 'extreme' || riskLoad > 0.4) {
    intensity = 'low';
    loadPercent = 42;
    hydrationIntervalMin = 10;
    sessionFocus = 'Indoor technical work, mobility, recovery, and tactical review';
  } else if (env.heatRisk === 'high' || riskLoad > 0.15 || lowHydrationCount / total > 0.3) {
    intensity = 'moderate';
    loadPercent = 60;
    hydrationIntervalMin = 15;
    sessionFocus = 'Technical drills, controlled intervals, and longer recovery blocks';
  }

  const durationMin = Math.max(35, Math.round(plannedDurationMin * (loadPercent / 82)));
  const flaggedCount = cautionCount + criticalCount;
  const reasonParts: string[] = [];

  if (flaggedCount > 0) reasonParts.push(`${flaggedCount} of ${total} athletes are currently flagged`);
  if (lowHydrationCount > 0) reasonParts.push(`${lowHydrationCount} athletes need closer hydration monitoring`);
  reasonParts.push(`${env.heatRisk} heat risk and UV ${env.uvIndex.toFixed(1)}`);

  return {
    intensity,
    loadPercent,
    durationMin,
    plannedDurationMin,
    bestWindow: env.safeHours,
    hydrationIntervalMin,
    sessionFocus,
    reason: `HelioSense AI recommends this plan because ${reasonParts.join(', ')}. Front-load the most demanding work and automatically reduce intensity if athlete risk rises during the session.`,
  };
}

const INTENSITY_LABEL: Record<RecommendedIntensity, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

export function AISessionCard({ athletes, env, onApply, onAdjust }: Props) {
  const colors = useColors();
  const [applied, setApplied] = useState(false);
  const rec = useMemo(() => buildRecommendation(athletes, env), [athletes, env]);

  const intensityColor =
    rec.intensity === 'low' ? colors.safe : rec.intensity === 'moderate' ? colors.caution : colors.critical;

  const handleApply = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApplied(true);
    onApply?.(rec);
  };

  const handleAdjust = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdjust?.();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.nav }]}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <View style={styles.aiIcon}>
            <Feather name="zap" size={15} color={colors.secondary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.secondary }]}>HELIO AI SESSION PLAN</Text>
            <Text style={styles.subtitle}>Generated from live environment and athlete readiness</Text>
          </View>
        </View>
        <View style={styles.livePill}>
          <View style={[styles.liveDot, { backgroundColor: colors.safe }]} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatBlock label="Intensity" value={INTENSITY_LABEL[rec.intensity]} sub={`${rec.loadPercent}% target load`} valueColor={intensityColor} />
        <StatBlock label="Duration" value={`${rec.durationMin} min`} sub={`vs ${rec.plannedDurationMin} planned`} />
        <StatBlock label="Hydration" value={`${rec.hydrationIntervalMin} min`} sub="between breaks" />
      </View>

      <View style={styles.windowRow}>
        <Feather name="clock" size={14} color={colors.secondary} />
        <Text style={styles.windowLabel}>Best training window</Text>
        <Text style={styles.windowValue}>{rec.bestWindow}</Text>
      </View>

      <View style={styles.focusBox}>
        <Text style={styles.focusLabel}>RECOMMENDED SESSION FOCUS</Text>
        <Text style={styles.focusValue}>{rec.sessionFocus}</Text>
      </View>

      <View style={styles.reasonBox}>
        <Feather name="cpu" size={14} color={colors.secondary} />
        <Text style={styles.reasonText}>{rec.reason}</Text>
      </View>

      <View style={styles.btnRow}>
        <Pressable
          style={[styles.applyBtn, { backgroundColor: applied ? colors.safe : colors.secondary }]}
          onPress={handleApply}
        >
          <Feather name={applied ? 'check' : 'play'} size={15} color="#fff" />
          <Text style={styles.applyBtnText}>{applied ? 'Plan applied' : 'Apply AI plan'}</Text>
        </Pressable>
        <Pressable style={styles.adjustBtn} onPress={handleAdjust}>
          <Feather name="sliders" size={15} color="rgba(255,255,255,0.85)" />
          <Text style={styles.adjustBtnText}>Adjust</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatBlock({ label, value, sub, valueColor }: { label: string; value: string; sub: string; valueColor?: string }) {
  return (
    <View style={blockStyles.block}>
      <Text style={blockStyles.label}>{label}</Text>
      <Text style={[blockStyles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={blockStyles.sub}>{sub}</Text>
    </View>
  );
}

const blockStyles = StyleSheet.create({
  block: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 11, padding: 10, gap: 2 },
  label: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  value: { color: '#fff', fontSize: 15, fontWeight: '800' as const },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
});

const styles = StyleSheet.create({
  card: { borderRadius: 18, margin: 16, marginBottom: 8, padding: 16, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  aiIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 12, fontWeight: '800' as const, letterSpacing: 0.5 },
  subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 2 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '800' as const },
  statsRow: { flexDirection: 'row', gap: 8 },
  windowRow: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10 },
  windowLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, flex: 1 },
  windowValue: { color: '#fff', fontSize: 11, fontWeight: '700' as const },
  focusBox: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 12, gap: 4 },
  focusLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 9, fontWeight: '700' as const, letterSpacing: 0.5 },
  focusValue: { color: '#fff', fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  reasonBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 12 },
  reasonText: { flex: 1, color: 'rgba(255,255,255,0.82)', fontSize: 11, lineHeight: 17 },
  btnRow: { flexDirection: 'row', gap: 8 },
  applyBtn: { flex: 1.5, flexDirection: 'row', gap: 7, borderRadius: 10, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' as const },
  adjustBtn: { flex: 1, flexDirection: 'row', gap: 7, borderRadius: 10, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  adjustBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' as const },
});
