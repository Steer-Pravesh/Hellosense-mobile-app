import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Athlete, EnvConditions } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  athletes: Athlete[];
  env: EnvConditions;
  onApply?: (rec: Recommendation) => void;
  onAdjust?: () => void;
  /** Shows an "Applied" state instead of the action buttons once the coach has applied this recommendation. */
  applied?: boolean;
}

type RecommendedIntensity = 'low' | 'moderate' | 'high';

export interface Recommendation {
  intensity: RecommendedIntensity;
  loadPercent: number;
  durationMin: number;
  plannedDurationMin: number;
  bestWindow: string;
  reason: string;
}

/**
 * Derives a session recommendation from current squad readiness + env
 * conditions. This is a rules-based stand-in for the eventual AI/ML layer —
 * same output shape, so swapping in a real model later is a drop-in change.
 */
function buildRecommendation(athletes: Athlete[], env: EnvConditions): Recommendation {
  const total = athletes.length || 1;
  const criticalCount = athletes.filter((a) => a.safetyLevel === 'critical').length;
  const cautionCount = athletes.filter((a) => a.safetyLevel === 'caution').length;
  const lowHydrationCount = athletes.filter((a) => a.hydrationStatus !== 'good').length;

  const riskLoad = (criticalCount * 2 + cautionCount) / total;
  const plannedDurationMin = 90;

  let intensity: RecommendedIntensity = 'high';
  let loadPercent = 85;
  if (env.heatRisk === 'extreme' || riskLoad > 0.4) {
    intensity = 'low';
    loadPercent = 45;
  } else if (env.heatRisk === 'high' || riskLoad > 0.15 || lowHydrationCount / total > 0.3) {
    intensity = 'moderate';
    loadPercent = 62;
  }

  const durationMin = Math.round(plannedDurationMin * (loadPercent / 85));
  const bestWindow = env.safeHours;

  const reasonParts: string[] = [];
  if (cautionCount + criticalCount > 0) {
    reasonParts.push(
      `${cautionCount + criticalCount} of ${total} athletes are flagged caution or critical`
    );
  }
  if (lowHydrationCount > 0) {
    reasonParts.push(`${lowHydrationCount} showing low or critical hydration`);
  }
  reasonParts.push(`${env.heatRisk} heat risk with UV ${env.uvIndex.toFixed(1)}`);

  const reason =
    `Reduced intensity from a typical high-load session because ${reasonParts.join(', and ')}. ` +
    `Recommend front-loading any high-intensity drills early, then shifting to technical or low-load work ` +
    `as conditions or fatigue progress.`;

  return { intensity, loadPercent, durationMin, plannedDurationMin, bestWindow, reason };
}

const INTENSITY_LABEL: Record<RecommendedIntensity, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

export function AISessionCard({ athletes, env, onApply, onAdjust, applied }: Props) {
  const colors = useColors();
  const rec = buildRecommendation(athletes, env);

  const intensityColor =
    rec.intensity === 'low' ? colors.safe : rec.intensity === 'moderate' ? colors.caution : colors.critical;

  const handleApply = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply?.(rec);
  };

  const handleAdjust = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdjust?.();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.nav }]}>
      <View style={styles.titleRow}>
        <Feather name="zap" size={15} color={colors.secondary} />
        <Text style={[styles.title, { color: colors.secondary }]}>AI SESSION RECOMMENDATION</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBlock label="Intensity" value={INTENSITY_LABEL[rec.intensity]} sub={`${rec.loadPercent}% load`} valueColor={intensityColor} />
        <StatBlock label="Duration" value={`${rec.durationMin} min`} sub={`vs ${rec.plannedDurationMin} planned`} />
        <StatBlock label="Best window" value={rec.bestWindow.split(' or ')[0]} sub="cooler hours" />
      </View>

      <View style={[styles.reasonBox, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
        <Text style={styles.reasonText}>{rec.reason}</Text>
      </View>

      {applied ? (
        <View style={[styles.appliedRow, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
          <Feather name="check-circle" size={15} color={colors.safe} />
          <Text style={[styles.appliedText, { color: colors.safe }]}>Applied to session plan</Text>
        </View>
      ) : (
        <View style={styles.btnRow}>
          <Pressable style={[styles.applyBtn, { backgroundColor: colors.secondary }]} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Apply to session plan</Text>
          </Pressable>
          <Pressable style={styles.adjustBtn} onPress={handleAdjust}>
            <Text style={styles.adjustBtnText}>Adjust manually</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function StatBlock({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <View style={blockStyles.block}>
      <Text style={blockStyles.label}>{label}</Text>
      <Text style={[blockStyles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={blockStyles.sub}>{sub}</Text>
    </View>
  );
}

const blockStyles = StyleSheet.create({
  block: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  label: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  value: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    gap: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 8 },
  reasonBox: { borderRadius: 10, padding: 12 },
  reasonText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 8 },
  appliedRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 11 },
  appliedText: { fontSize: 13, fontWeight: '700' as const },
  applyBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' as const },
  adjustBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  adjustBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' as const },
});