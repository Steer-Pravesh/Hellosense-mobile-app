import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafetyLevel } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  level: SafetyLevel;
  small?: boolean;
}

const LABELS: Record<SafetyLevel, string> = {
  safe: 'SAFE',
  caution: 'CAUTION',
  critical: 'CRITICAL',
  recovery: 'RECOVERY',
  inactive: 'INACTIVE',
};

export function RiskBadge({ level, small = false }: Props) {
  const colors = useColors();

  const bg = {
    safe: colors.safeLight,
    caution: colors.cautionLight,
    critical: colors.criticalLight,
    recovery: colors.recoveryLight,
    inactive: colors.inactiveLight,
  }[level];

  const fg = {
    safe: colors.safeFg,
    caution: colors.cautionFg,
    critical: colors.criticalFg,
    recovery: colors.recoveryFg,
    inactive: colors.inactiveFg,
  }[level];

  const dot = {
    safe: colors.safe,
    caution: colors.caution,
    critical: colors.critical,
    recovery: colors.recovery,
    inactive: colors.inactive,
  }[level];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: dot }, small && styles.dotSmall]} />
      <Text style={[styles.label, { color: fg }, small && styles.labelSmall]}>
        {LABELS[level]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotSmall: {
    width: 5,
    height: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 9,
  },
});
