import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EnvConditions } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  env: EnvConditions;
}

type ExtendedEnv = EnvConditions & {
  temperature?: number;
  humidity?: number;
  feelsLike?: number;
  location?: string;
};

function getRiskCopy(risk: string) {
  switch (risk) {
    case 'extreme':
      return 'Avoid outdoor high-intensity work. Use recovery, mobility, or indoor technical drills.';
    case 'high':
      return 'Reduce load, increase recovery breaks, and keep hydration closely supervised.';
    case 'moderate':
      return 'Outdoor training is suitable with planned hydration and workload monitoring.';
    default:
      return 'Conditions are suitable for the planned session. Continue live monitoring.';
  }
}

export function SessionEnvironmentPanel({ env }: Props) {
  const colors = useColors();
  const current = env as ExtendedEnv;
  const risk = String(env.heatRisk ?? 'moderate').toLowerCase();
  const riskColor =
    risk === 'extreme' || risk === 'high'
      ? colors.critical
      : risk === 'moderate'
        ? colors.caution
        : colors.safe;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.headingWrap}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
            <Feather name="sun" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>LIVE ENVIRONMENT</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Today&apos;s training conditions</Text>
          </View>
        </View>
        <View style={[styles.riskPill, { backgroundColor: riskColor + '18' }]}>
          <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
          <Text style={[styles.riskText, { color: riskColor }]}>{risk.toUpperCase()} RISK</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Metric icon="sun" label="UV index" value={env.uvIndex.toFixed(1)} colors={colors} />
        <Metric
          icon="thermometer"
          label="Temperature"
          value={current.temperature != null ? `${Math.round(current.temperature)}°C` : 'Live'}
          colors={colors}
        />
        <Metric
          icon="droplet"
          label="Humidity"
          value={current.humidity != null ? `${Math.round(current.humidity)}%` : 'Tracked'}
          colors={colors}
        />
      </View>

      <View style={[styles.guidance, { backgroundColor: riskColor + '10', borderColor: riskColor + '30' }]}>
        <Feather name="info" size={15} color={riskColor} />
        <View style={styles.guidanceTextWrap}>
          <Text style={[styles.guidanceTitle, { color: colors.foreground }]}>{getRiskCopy(risk)}</Text>
          <Text style={[styles.safeWindow, { color: colors.mutedForeground }]}>Safer window: {env.safeHours}</Text>
        </View>
      </View>
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.background }]}>
      <Feather name={icon} size={14} color={colors.primary} />
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 0.8 },
  title: { fontSize: 15, fontWeight: '700' as const, marginTop: 2 },
  riskPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  riskDot: { width: 7, height: 7, borderRadius: 4 },
  riskText: { fontSize: 9, fontWeight: '800' as const, letterSpacing: 0.4 },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, borderRadius: 12, padding: 10, minHeight: 76, justifyContent: 'center', gap: 2 },
  metricValue: { fontSize: 16, fontWeight: '800' as const, marginTop: 3 },
  metricLabel: { fontSize: 10 },
  guidance: { flexDirection: 'row', gap: 9, borderWidth: 1, borderRadius: 12, padding: 11 },
  guidanceTextWrap: { flex: 1, gap: 3 },
  guidanceTitle: { fontSize: 12, lineHeight: 17, fontWeight: '600' as const },
  safeWindow: { fontSize: 11 },
});
