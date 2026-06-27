import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EnvConditions } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  env: EnvConditions;
  compact?: boolean;
}

export function EnvBar({ env, compact = false }: Props) {
  const colors = useColors();

  const uvColor =
    env.uvIndex >= 8 ? colors.critical : env.uvIndex >= 5 ? colors.caution : colors.safe;
  const heatColor =
    env.heatRisk === 'extreme'
      ? colors.critical
      : env.heatRisk === 'high'
      ? colors.caution
      : colors.safe;

  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: colors.nav }]}>
        <EnvPill icon="sun" value={`UV ${env.uvIndex.toFixed(1)}`} color={uvColor} />
        <EnvPill icon="thermometer" value={`${env.temperature}°C`} color={heatColor} />
        <EnvPill icon="droplets" value={`${env.humidity}% RH`} color={colors.recovery} />
        <EnvPill
          icon="alert-triangle"
          value={env.heatRisk.toUpperCase()}
          color={heatColor}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.nav }]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Environmental Conditions</Text>
        <Text style={[styles.riskBadge, { color: heatColor }]}>
          {env.heatRisk.toUpperCase()} RISK
        </Text>
      </View>
      <View style={styles.statsRow}>
        <EnvStatBlock icon="sun" label="UV Index" value={env.uvIndex.toFixed(1)} color={uvColor} />
        <EnvStatBlock icon="thermometer" label="Temp" value={`${env.temperature}°C`} color={heatColor} />
        <EnvStatBlock icon="wind" label="Humidity" value={`${env.humidity}%`} color={colors.recovery} />
        <EnvStatBlock icon="clock" label="Break" value={`${env.breakInterval}min`} color={colors.accent} />
      </View>
      <View style={[styles.recBox, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
        <Feather name="info" size={13} color={colors.accent} />
        <Text style={styles.recText}>{env.recommendation}</Text>
      </View>
    </View>
  );
}

function EnvPill({ icon, value, color }: { icon: string; value: string; color: string }) {
  return (
    <View style={pStyles.pill}>
      <Feather name={icon as any} size={11} color={color} />
      <Text style={[pStyles.text, { color }]}>{value}</Text>
    </View>
  );
}

function EnvStatBlock({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={bStyles.block}>
      <Feather name={icon as any} size={18} color={color} />
      <Text style={[bStyles.value, { color }]}>{value}</Text>
      <Text style={bStyles.label}>{label}</Text>
    </View>
  );
}

const pStyles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontSize: 11, fontWeight: '600' as const },
});

const bStyles = StyleSheet.create({
  block: { flex: 1, alignItems: 'center', gap: 3 },
  value: { fontSize: 16, fontWeight: '700' as const },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '500' as const },
});

const styles = StyleSheet.create({
  compact: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
  riskBadge: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row' },
  recBox: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    alignItems: 'flex-start',
  },
  recText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, flex: 1, lineHeight: 17 },
});
