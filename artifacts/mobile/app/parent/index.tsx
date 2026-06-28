import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RiskBadge } from '@/components/RiskBadge';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const STATUS_LABELS: Record<string, string> = {
  training: 'Training', sprint_drill: 'Sprint Drill', resting: 'Resting',
  hydrating: 'Hydrating', reduced_intensity: 'Reduced Intensity', paused: 'Paused',
  session_ended: 'Session Ended', medical_attention: 'Medical Attention', not_in_session: 'Not in Session',
};

export default function ParentChildScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes, parentAthleteId, hasParentSubscription } = useApp();
  const child = athletes.find((a) => a.id === parentAthleteId);

  if (!child) return null;

  const statusColor = {
    safe: colors.safe, caution: colors.caution, critical: colors.critical,
    recovery: colors.recovery, inactive: colors.inactive,
  }[child.safetyLevel];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.push('/')} hitSlop={12}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Parent Dashboard</Text>
            <Text style={styles.headerSub}>Monitoring: {child.name}</Text>
          </View>
          {!hasParentSubscription && (
            <Pressable
              style={[styles.activateBtn, { backgroundColor: colors.recovery }]}
              onPress={() => router.push('/parent/subscription' as any)}
            >
              <Text style={styles.activateBtnText}>Activate</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
        showsVerticalScrollIndicator={false}
      >
        {!hasParentSubscription && (
          <Pressable
            style={[styles.subBanner, { backgroundColor: colors.recoveryLight, borderColor: colors.recovery + '44' }]}
            onPress={() => router.push('/parent/subscription' as any)}
          >
            <Feather name="shield" size={16} color={colors.recovery} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.subBannerTitle, { color: colors.recoveryFg }]}>Activate Parent Safety Plan</Text>
              <Text style={[styles.subBannerSub, { color: colors.recoveryFg + 'AA' }]}>₹199/month · Unlock full real-time updates</Text>
            </View>
            <Feather name="arrow-right" size={16} color={colors.recovery} />
          </Pressable>
        )}

        <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: statusColor + '44', borderWidth: 2 }]}>
          <View style={styles.statusTop}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {child.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.childName, { color: colors.foreground }]}>{child.name}</Text>
              <Text style={[styles.childSport, { color: colors.mutedForeground }]}>{child.sport} · Age {child.age}</Text>
            </View>
            <RiskBadge level={child.safetyLevel} />
          </View>

          <View style={[styles.bigStatus, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.bigStatusText, { color: statusColor }]}>{STATUS_LABELS[child.status]}</Text>
          </View>

          <View style={styles.sessionStats}>
            <SessionStat icon="clock" label="Session Duration" value={child.trainingDuration > 0 ? `${child.trainingDuration} min` : 'Not started'} colors={colors} />
            <SessionStat icon="sun" label="UV Exposure" value={child.uvExposure > 0 ? `${child.uvExposure.toFixed(1)} index` : 'N/A'} colors={colors} />
            <SessionStat icon="thermometer" label="Heat Risk" value={child.heatRisk.charAt(0).toUpperCase() + child.heatRisk.slice(1)} colors={colors} />
            <SessionStat icon="droplet" label="Hydration" value={child.hydrationStatus.charAt(0).toUpperCase() + child.hydrationStatus.slice(1)} colors={colors} />
            <SessionStat icon="zap" label="Intensity" value={child.intensity.charAt(0).toUpperCase() + child.intensity.slice(1)} colors={colors} />
            <SessionStat icon="refresh-cw" label="Last Updated" value={new Date(child.lastUpdate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} colors={colors} />
          </View>
        </View>

        {child.safetyLevel === 'critical' && (
          <View style={[styles.alertBox, { backgroundColor: colors.criticalLight, borderColor: colors.critical }]}>
            <Feather name="alert-octagon" size={18} color={colors.critical} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertBoxTitle, { color: colors.criticalFg }]}>Safety Alert</Text>
              <Text style={[styles.alertBoxText, { color: colors.criticalFg }]}>
                Your child has been flagged as critical risk. The coach has been notified and is taking action. Stay updated.
              </Text>
            </View>
          </View>
        )}

        {child.safetyLevel === 'caution' && (
          <View style={[styles.alertBox, { backgroundColor: colors.cautionLight, borderColor: colors.caution }]}>
            <Feather name="alert-triangle" size={18} color={colors.caution} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertBoxTitle, { color: colors.cautionFg }]}>Caution Notice</Text>
              <Text style={[styles.alertBoxText, { color: colors.cautionFg }]}>
                Your child has entered a caution zone. The coach is monitoring the situation closely.
              </Text>
            </View>
          </View>
        )}

        {child.status === 'hydrating' && (
          <View style={[styles.alertBox, { backgroundColor: colors.recoveryLight, borderColor: colors.recovery }]}>
            <Feather name="droplet" size={18} color={colors.recovery} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertBoxTitle, { color: colors.recoveryFg }]}>Hydration Update</Text>
              <Text style={[styles.alertBoxText, { color: colors.recoveryFg }]}>
                Your child is currently taking a hydration break. This is a healthy break during the session.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.nav }]}>Recent Actions</Text>
          {child.actionHistory.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No actions recorded yet for this session.</Text>
            </View>
          ) : (
            child.actionHistory.slice(0, 5).map((record) => (
              <View key={record.id} style={[styles.actionItem, { backgroundColor: colors.card, borderLeftColor: colors.accent }]}>
                <Text style={[styles.actionText, { color: colors.foreground }]}>{record.action}</Text>
                <Text style={[styles.actionMeta, { color: colors.mutedForeground }]}>
                  {record.coachName} · {new Date(record.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={[styles.disclaimer, { backgroundColor: colors.inactiveLight, borderColor: colors.border }]}>
          <Feather name="info" size={12} color={colors.inactive} />
          <Text style={[styles.disclaimerText, { color: colors.inactive }]}>
            HelioSense provides session updates and safety alerts. It does not replace direct coach communication or emergency services.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SessionStat({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={ssStyles.row}>
      <View style={ssStyles.left}>
        <Feather name={icon as any} size={14} color={colors.mutedForeground} />
        <Text style={[ssStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[ssStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const ssStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: '600' as const },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' as const },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  activateBtn: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 },
  activateBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' as const },
  subBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14 },
  subBannerTitle: { fontSize: 14, fontWeight: '700' as const },
  subBannerSub: { fontSize: 12, marginTop: 2 },
  statusCard: { borderRadius: 18, padding: 16, gap: 14 },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' as const },
  childName: { fontSize: 18, fontWeight: '700' as const },
  childSport: { fontSize: 12, marginTop: 2 },
  bigStatus: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  bigStatusText: { fontSize: 16, fontWeight: '700' as const },
  sessionStats: { gap: 0 },
  alertBox: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 14, borderWidth: 1.5, padding: 14 },
  alertBoxTitle: { fontSize: 14, fontWeight: '700' as const },
  alertBoxText: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  emptyBox: { borderRadius: 12, borderWidth: 1, padding: 14 },
  emptyText: { fontSize: 13, textAlign: 'center' },
  actionItem: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8, borderRadius: 4 },
  actionText: { fontSize: 13, fontWeight: '600' as const },
  actionMeta: { fontSize: 11, marginTop: 2 },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, padding: 12 },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
