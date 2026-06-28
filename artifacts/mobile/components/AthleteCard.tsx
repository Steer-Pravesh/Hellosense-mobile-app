import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Athlete } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { RiskBadge } from './RiskBadge';

const STATUS_LABELS: Record<string, string> = {
  training: 'Training',
  sprint_drill: 'Sprint Drill',
  resting: 'Resting',
  hydrating: 'Hydrating',
  reduced_intensity: 'Reduced Intensity',
  paused: 'Paused',
  session_ended: 'Session Ended',
  medical_attention: 'Medical Attention',
  not_in_session: 'Not in Session',
};

interface Props {
  athlete: Athlete;
  onAlert?: (athlete: Athlete) => void;
  showActions?: boolean;
}

export function AthleteCard({ athlete, onAlert, showActions = true }: Props) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const isCritical = athlete.safetyLevel === 'critical';
  const isIssue = athlete.issueRaised;

  const borderColor = isCritical
    ? colors.critical
    : isIssue
    ? colors.caution
    : colors.border;

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((e) => !e);
  };

  const handleAlert = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onAlert?.(athlete);
  };

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor, borderWidth: isCritical ? 2 : 1 },
      ]}
      onPress={handlePress}
    >
      {isCritical && (
        <View style={[styles.criticalBanner, { backgroundColor: colors.critical }]}>
          <Feather name="alert-octagon" size={12} color="#fff" />
          <Text style={styles.criticalBannerText}>CRITICAL RISK — IMMEDIATE ACTION REQUIRED</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {athlete.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>{athlete.name}</Text>
            {isIssue && !isCritical && (
              <View style={[styles.issueDot, { backgroundColor: colors.caution }]}>
                <Text style={styles.issueText}>Issue Raised</Text>
              </View>
            )}
          </View>
          <Text style={[styles.sport, { color: colors.mutedForeground }]}>
            {athlete.sport} · Age {athlete.age}
          </Text>
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            {STATUS_LABELS[athlete.status]}
          </Text>
        </View>
        <View style={styles.right}>
          <RiskBadge level={athlete.safetyLevel} small />
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.mutedForeground}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>

      <View style={styles.quickStats}>
        <QuickStat
          icon="sun"
          label="UV"
          value={athlete.uvExposure > 0 ? athlete.uvExposure.toFixed(1) : '—'}
          color={athlete.uvExposure >= 6 ? colors.critical : athlete.uvExposure >= 3 ? colors.caution : colors.safe}
          colors={colors}
        />
        <QuickStat
          icon="thermometer"
          label="Heat"
          value={athlete.heatRisk === 'low' ? 'Low' : athlete.heatRisk === 'moderate' ? 'Mod' : athlete.heatRisk === 'high' ? 'High' : 'Extreme'}
          color={athlete.heatRisk === 'extreme' ? colors.critical : athlete.heatRisk === 'high' ? colors.caution : colors.safe}
          colors={colors}
        />
        <QuickStat
          icon="droplet"
          label="H₂O"
          value={athlete.hydrationStatus === 'good' ? 'Good' : athlete.hydrationStatus === 'low' ? 'Low' : 'Critical'}
          color={athlete.hydrationStatus === 'critical' ? colors.critical : athlete.hydrationStatus === 'low' ? colors.caution : colors.recovery}
          colors={colors}
        />
        <QuickStat
          icon="clock"
          label="Min"
          value={athlete.trainingDuration > 0 ? `${athlete.trainingDuration}` : '—'}
          color={colors.mutedForeground}
          colors={colors}
        />
      </View>

      {expanded && (
        <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
          <DetailRow label="Intensity" value={athlete.intensity.charAt(0).toUpperCase() + athlete.intensity.slice(1)} colors={colors} />
          <DetailRow label="UV Exposure" value={`${athlete.uvExposure.toFixed(1)} index`} colors={colors} />
          <DetailRow label="Heat Risk" value={athlete.heatRisk.charAt(0).toUpperCase() + athlete.heatRisk.slice(1)} colors={colors} />
          <DetailRow label="Hydration" value={athlete.hydrationStatus.charAt(0).toUpperCase() + athlete.hydrationStatus.slice(1)} colors={colors} />
          <DetailRow label="Session Duration" value={`${athlete.trainingDuration} minutes`} colors={colors} />
          <DetailRow label="Last Updated" value={new Date(athlete.lastUpdate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} colors={colors} />

          {athlete.actionHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text style={[styles.historyTitle, { color: colors.foreground }]}>Recent Actions</Text>
              {athlete.actionHistory.slice(0, 3).map((record) => (
                <View key={record.id} style={[styles.historyItem, { borderLeftColor: colors.accent }]}>
                  <Text style={[styles.historyAction, { color: colors.foreground }]}>{record.action}</Text>
                  <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                    {record.coachName} · {new Date(record.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {showActions && (isCritical || isIssue) && (
            <Pressable
              style={[styles.alertBtn, { backgroundColor: isCritical ? colors.critical : colors.caution }]}
              onPress={handleAlert}
            >
              <Feather name="alert-circle" size={16} color="#fff" />
              <Text style={styles.alertBtnText}>
                {isCritical ? 'Respond to Critical Alert' : 'Take Action'}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

function QuickStat({ icon, label, value, color, colors }: any) {
  return (
    <View style={[qStyles.stat, { backgroundColor: colors.background }]}>
      <Feather name={icon} size={13} color={color} />
      <Text style={[qStyles.value, { color }]}>{value}</Text>
      <Text style={[qStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={dStyles.row}>
      <Text style={[dStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[dStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const qStyles = StyleSheet.create({
  stat: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, gap: 2 },
  value: { fontSize: 12, fontWeight: '700' as const },
  label: { fontSize: 9, fontWeight: '500' as const, letterSpacing: 0.3 },
});

const dStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: '600' as const },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#1E3D59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  criticalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  criticalBannerText: { color: '#fff', fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5 },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '700' as const },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '700' as const },
  issueDot: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  issueText: { color: '#fff', fontSize: 9, fontWeight: '700' as const },
  sport: { fontSize: 12, marginTop: 2 },
  statusText: { fontSize: 12, marginTop: 1 },
  right: { alignItems: 'flex-end', gap: 4 },
  quickStats: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
  expandedSection: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 2,
  },
  historySection: { marginTop: 10 },
  historyTitle: { fontSize: 13, fontWeight: '600' as const, marginBottom: 6 },
  historyItem: {
    borderLeftWidth: 2,
    paddingLeft: 10,
    marginBottom: 6,
  },
  historyAction: { fontSize: 13, fontWeight: '500' as const },
  historyMeta: { fontSize: 11, marginTop: 1 },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  alertBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' as const },
});
