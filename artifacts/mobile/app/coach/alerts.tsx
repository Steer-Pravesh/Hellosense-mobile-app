import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CriticalAlertModal } from '@/components/CriticalAlertModal';
import { RiskBadge } from '@/components/RiskBadge';
import { Athlete, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function CoachAlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes } = useApp();
  const [alertAthlete, setAlertAthlete] = useState<Athlete | null>(null);

  const myAthletes = athletes.filter((a) => a.coachId === 'c1');
  const alerts = myAthletes.filter((a) => a.safetyLevel === 'critical' || a.safetyLevel === 'caution');
  const critical = alerts.filter((a) => a.safetyLevel === 'critical');
  const caution = alerts.filter((a) => a.safetyLevel === 'caution');

  const STATUS_LABELS: Record<string, string> = {
    training: 'Training', sprint_drill: 'Sprint Drill', resting: 'Resting',
    hydrating: 'Hydrating', reduced_intensity: 'Reduced Intensity', paused: 'Paused',
    session_ended: 'Session Ended', medical_attention: 'Medical Attention', not_in_session: 'Not in Session',
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <Text style={styles.headerTitle}>Risk Alerts</Text>
        <Text style={styles.headerSub}>
          {critical.length} critical · {caution.length} caution
        </Text>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.allClear}>
          <View style={[styles.allClearIcon, { backgroundColor: colors.safeLight }]}>
            <Feather name="check-circle" size={40} color={colors.safe} />
          </View>
          <Text style={[styles.allClearTitle, { color: colors.foreground }]}>All Clear</Text>
          <Text style={[styles.allClearSub, { color: colors.mutedForeground }]}>
            No active risk alerts for your athletes right now.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            critical.length > 0 ? (
              <View style={[styles.criticalBanner, { backgroundColor: colors.criticalLight }]}>
                <Feather name="alert-octagon" size={16} color={colors.critical} />
                <Text style={[styles.criticalBannerText, { color: colors.criticalFg }]}>
                  {critical.length} athlete{critical.length > 1 ? 's are' : ' is'} in a critical risk zone. Immediate response required.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.alertCard,
                {
                  backgroundColor: colors.card,
                  borderColor: item.safetyLevel === 'critical' ? colors.critical : colors.caution,
                  borderWidth: item.safetyLevel === 'critical' ? 2 : 1,
                },
              ]}
              onPress={() => setAlertAthlete(item)}
            >
              <View style={styles.alertTop}>
                <View style={[styles.avatar, { backgroundColor: item.safetyLevel === 'critical' ? colors.criticalLight : colors.cautionLight }]}>
                  <Text style={[styles.avatarText, { color: item.safetyLevel === 'critical' ? colors.critical : colors.caution }]}>
                    {item.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.alertInfo}>
                  <Text style={[styles.alertName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.alertStatus, { color: colors.mutedForeground }]}>
                    {STATUS_LABELS[item.status]} · {item.trainingDuration} min · {item.sport}
                  </Text>
                </View>
                <RiskBadge level={item.safetyLevel} small />
              </View>

              <View style={styles.alertStats}>
                <AlertStat label="UV" value={item.uvExposure.toFixed(1)} color={item.uvExposure >= 6 ? colors.critical : colors.caution} />
                <AlertStat label="Heat" value={item.heatRisk.toUpperCase()} color={item.heatRisk === 'extreme' ? colors.critical : colors.caution} />
                <AlertStat label="H₂O" value={item.hydrationStatus.toUpperCase()} color={item.hydrationStatus === 'critical' ? colors.critical : colors.caution} />
                <AlertStat label="Intensity" value={item.intensity.toUpperCase()} color={item.intensity === 'high' ? colors.caution : colors.mutedForeground} />
              </View>

              <Pressable
                style={[styles.respondBtn, { backgroundColor: item.safetyLevel === 'critical' ? colors.critical : colors.caution }]}
                onPress={() => setAlertAthlete(item)}
              >
                <Feather name="zap" size={14} color="#fff" />
                <Text style={styles.respondBtnText}>
                  {item.safetyLevel === 'critical' ? 'Respond Now' : 'Take Action'}
                </Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <CriticalAlertModal
        athlete={alertAthlete}
        visible={!!alertAthlete}
        onClose={() => setAlertAthlete(null)}
      />
    </View>
  );
}

function AlertStat({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[asStyles.box, { backgroundColor: colors.background }]}>
      <Text style={[asStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[asStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const asStyles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 7 },
  label: { fontSize: 9, fontWeight: '600' as const, letterSpacing: 0.3 },
  value: { fontSize: 12, fontWeight: '700' as const },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' as const, marginTop: 14 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  allClear: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  allClearIcon: { padding: 24, borderRadius: 50 },
  allClearTitle: { fontSize: 22, fontWeight: '700' as const },
  allClearSub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  criticalBanner: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 12, padding: 12, marginBottom: 14 },
  criticalBannerText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' as const },
  alertCard: { borderRadius: 16, marginBottom: 12, padding: 14, gap: 12, shadowColor: '#1E3D59', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' as const },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 16, fontWeight: '700' as const },
  alertStatus: { fontSize: 12, marginTop: 2 },
  alertStats: { flexDirection: 'row', gap: 6 },
  respondBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 11 },
  respondBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' as const },
});
