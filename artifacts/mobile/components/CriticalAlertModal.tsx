import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
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
import { Athlete, AthleteStatus, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  athlete: Athlete | null;
  visible: boolean;
  onClose: () => void;
}

interface CoachAction {
  id: AthleteStatus;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export function CriticalAlertModal({ athlete, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateAthleteStatus, activeCoachId, coaches } = useApp();
  const coachName = coaches.find((c) => c.id === activeCoachId)?.name ?? 'Coach';

  const ACTIONS: CoachAction[] = [
    { id: 'resting', label: 'Give Rest', icon: 'moon', description: 'Stop activity, allow recovery', color: colors.safe },
    { id: 'hydrating', label: 'Hydrate Now', icon: 'droplet', description: 'Administer fluids immediately', color: colors.recovery },
    { id: 'reduced_intensity', label: 'Reduce Intensity', icon: 'trending-down', description: 'Lower training load', color: colors.caution },
    { id: 'paused', label: 'Pause Session', icon: 'pause-circle', description: 'Temporarily suspend athlete', color: colors.inactive },
    { id: 'session_ended', label: 'End Session', icon: 'stop-circle', description: 'Close training session now', color: colors.nav },
    { id: 'medical_attention', label: 'Medical Attention', icon: 'alert-triangle', description: 'Escalate to medical staff', color: colors.critical },
  ];

  const handleAction = (action: CoachAction) => {
    if (!athlete) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    updateAthleteStatus(athlete.id, action.id, action.label, coachName);
    onClose();
  };

  if (!athlete) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          <View style={[styles.header, { backgroundColor: colors.criticalLight }]}>
            <View style={styles.headerTop}>
              <View style={[styles.alertIcon, { backgroundColor: colors.critical }]}>
                <Feather name="alert-octagon" size={22} color="#fff" />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.alertTitle, { color: colors.criticalFg }]}>
                  CRITICAL RISK ALERT
                </Text>
                <Text style={[styles.athleteName, { color: colors.foreground }]}>
                  {athlete.name}
                </Text>
                <Text style={[styles.athleteDetail, { color: colors.mutedForeground }]}>
                  {athlete.sport} · {athlete.trainingDuration} min session
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={styles.statsRow}>
              <StatPill label="UV" value={athlete.uvExposure.toFixed(1)} color={colors.caution} />
              <StatPill label="Heat" value={athlete.heatRisk.toUpperCase()} color={colors.critical} />
              <StatPill
                label="Hydration"
                value={athlete.hydrationStatus.toUpperCase()}
                color={athlete.hydrationStatus === 'critical' ? colors.critical : colors.caution}
              />
            </View>
          </View>

          <Text style={[styles.promptText, { color: colors.foreground }]}>
            Select your response action:
          </Text>

          <ScrollView style={styles.actions} showsVerticalScrollIndicator={false}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { borderColor: colors.border, backgroundColor: pressed ? colors.input : colors.card },
                ]}
                onPress={() => handleAction(action)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '22' }]}>
                  <Feather name={action.icon as any} size={20} color={action.color} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
                  <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>{action.description}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[statStyles.pill, { borderColor: color + '44' }]}>
      <Text style={[statStyles.label, { color }]}>{label}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  label: { fontSize: 10, fontWeight: '500' as const, letterSpacing: 0.5 },
  value: { fontSize: 13, fontWeight: '700' as const },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  header: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  alertTitle: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1 },
  athleteName: { fontSize: 18, fontWeight: '700' as const, marginTop: 2 },
  athleteDetail: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  promptText: {
    fontSize: 14,
    fontWeight: '600' as const,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  actions: { paddingHorizontal: 20 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '600' as const },
  actionDesc: { fontSize: 12, marginTop: 2 },
});