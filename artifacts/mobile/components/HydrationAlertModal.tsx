import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { HydrationAlert, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  alert: HydrationAlert | null;
  /** True once the coach has chosen "Hydrate now" for this alert — shows the follow-up prompt instead. */
  awaitingPostHydrationChoice: boolean;
  /** Called right after the coach taps "Hydrate now", before the follow-up step renders. */
  onHydrateChosen: () => void;
  onDismiss: () => void;
}

export function HydrationAlertModal({
  alert,
  awaitingPostHydrationChoice,
  onHydrateChosen,
  onDismiss,
}: Props) {
  const colors = useColors();
  const { respondToHydrationAlert, respondToPostHydration } = useApp();

  if (!alert) return null;

  const haptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(style);
  };

  const handleHydrate = () => {
    haptic();
    respondToHydrationAlert(alert.id, 'hydrate');
    onHydrateChosen();
  };

  const handleSnooze = () => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    respondToHydrationAlert(alert.id, 'snooze');
    onDismiss();
  };

  const handleIgnore = () => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    respondToHydrationAlert(alert.id, 'ignore');
    onDismiss();
  };

  const handleResume = () => {
    haptic();
    respondToPostHydration(alert.athleteId, 'resume');
    onDismiss();
  };

  const handleRest = () => {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    respondToPostHydration(alert.athleteId, 'rest');
    onDismiss();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.nav }]}>
          {!awaitingPostHydrationChoice ? (
            <>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Feather name="droplet" size={22} color="#60A5FA" />
              </View>
              <Text style={styles.title}>Hydration check</Text>
              <Text style={styles.subtitle}>
                {alert.athleteName} has been training for a while. Time for a hydration break.
              </Text>

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.secondary }]}
                onPress={handleHydrate}
              >
                <Feather name="droplet" size={15} color="#fff" />
                <Text style={styles.primaryBtnText}>Hydrate now</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={handleSnooze}>
                <Feather name="clock" size={15} color="#CBD5E1" />
                <Text style={styles.secondaryBtnText}>Remind me in 10 min</Text>
              </Pressable>
              <Pressable style={styles.tertiaryBtn} onPress={handleIgnore}>
                <Feather name="x" size={14} color="#94A3B8" />
                <Text style={styles.tertiaryBtnText}>Ignore</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <Feather name="check" size={22} color="#4ADE80" />
              </View>
              <Text style={styles.title}>Hydration logged</Text>
              <Text style={styles.subtitle}>{alert.athleteName} has hydrated. What's next?</Text>

              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.secondary }]}
                onPress={handleResume}
              >
                <Feather name="play" size={15} color="#fff" />
                <Text style={styles.primaryBtnText}>Resume session</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={handleRest}>
                <Feather name="moon" size={15} color="#CBD5E1" />
                <Text style={styles.secondaryBtnText}>Take rest</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' as const, textAlign: 'center', marginBottom: 6 },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' as const },
  secondaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  secondaryBtnText: { color: '#E2E8F0', fontSize: 13, fontWeight: '600' as const },
  tertiaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  tertiaryBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' as const },
});
