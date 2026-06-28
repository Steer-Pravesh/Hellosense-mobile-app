import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EnvBar } from '@/components/EnvBar';
import { RiskBadge } from '@/components/RiskBadge';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function AcademyOverviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes, coaches, sessionHistory, envConditions } = useApp();

  const inSession = athletes.filter((a) => !['not_in_session', 'session_ended'].includes(a.status));
  const critical = athletes.filter((a) => a.safetyLevel === 'critical');
  const caution = athletes.filter((a) => a.safetyLevel === 'caution');
  const safe = athletes.filter((a) => a.safetyLevel === 'safe');
  const totalIncidents = sessionHistory.reduce((sum, s) => sum + s.safetyIncidents, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.push('/')} hitSlop={12}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Academy Dashboard</Text>
            <Text style={styles.headerSub}>HelioSense Sports Academy · Delhi NCR</Text>
          </View>
        </View>
        <EnvBar env={envConditions} compact />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }} showsVerticalScrollIndicator={false}>
        <View style={[styles.demoBanner, { backgroundColor: colors.cautionLight }]}>
          <Feather name="info" size={13} color={colors.caution} />
          <Text style={[styles.demoBannerText, { color: colors.cautionFg }]}>Demo data for interface preview.</Text>
        </View>

        <View style={styles.statsGrid}>
          <BigStatCard value={athletes.length.toString()} label="Total Athletes" icon="users" color={colors.primary} />
          <BigStatCard value={inSession.length.toString()} label="In Session" icon="activity" color={colors.safe} />
          <BigStatCard value={critical.length.toString()} label="Critical" icon="alert-octagon" color={colors.critical} />
          <BigStatCard value={coaches.length.toString()} label="Coaches" icon="user-check" color={colors.secondary} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.nav }]}>Risk Distribution</Text>
          <View style={[styles.riskDistCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { level: 'critical' as const, count: critical.length, label: 'Critical', color: colors.critical },
              { level: 'caution' as const, count: caution.length, label: 'Caution', color: colors.caution },
              { level: 'safe' as const, count: safe.length, label: 'Safe', color: colors.safe },
              { level: 'recovery' as const, count: athletes.filter((a) => a.safetyLevel === 'recovery').length, label: 'Recovery', color: colors.recovery },
              { level: 'inactive' as const, count: athletes.filter((a) => a.safetyLevel === 'inactive').length, label: 'Inactive', color: colors.inactive },
            ].map((item) => (
              <View key={item.level} style={styles.riskRow}>
                <RiskBadge level={item.level} small />
                <View style={styles.riskBar}>
                  <View
                    style={[
                      styles.riskBarFill,
                      { backgroundColor: item.color, width: `${athletes.length ? (item.count / athletes.length) * 100 : 0}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.riskCount, { color: colors.foreground }]}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.nav }]}>Environmental Conditions</Text>
          <View style={{ borderRadius: 16, overflow: 'hidden' }}>
            <EnvBar env={envConditions} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.nav }]}>Active Coaches</Text>
          {coaches.map((coach) => (
            <View key={coach.id} style={[styles.coachRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.coachAvatar, { backgroundColor: colors.secondary + '22' }]}>
                <Feather name="user-check" size={18} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.coachName, { color: colors.foreground }]}>{coach.name}</Text>
                <Text style={[styles.coachSport, { color: colors.mutedForeground }]}>{coach.sport}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={[styles.coachStat, { color: colors.primary }]}>{coach.athleteCount} athletes</Text>
                <Text style={[styles.coachStat, { color: colors.safe }]}>{coach.activeSessions} active</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.nav }]}>Recent Incidents</Text>
            <View style={[styles.incidentBadge, { backgroundColor: totalIncidents > 0 ? colors.cautionLight : colors.safeLight }]}>
              <Text style={[styles.incidentBadgeText, { color: totalIncidents > 0 ? colors.caution : colors.safe }]}>{totalIncidents} total</Text>
            </View>
          </View>
          {sessionHistory
            .filter((s) => s.safetyIncidents > 0)
            .slice(0, 3)
            .map((s) => (
              <View key={s.id} style={[styles.incidentRow, { backgroundColor: colors.card, borderColor: colors.cautionLight }]}>
                <Feather name="alert-triangle" size={14} color={colors.caution} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.incidentAthlete, { color: colors.foreground }]}>{s.athleteName}</Text>
                  <Text style={[styles.incidentDetail, { color: colors.mutedForeground }]}>{s.summary}</Text>
                </View>
                <Text style={[styles.incidentDate, { color: colors.mutedForeground }]}>{new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
              </View>
            ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.nav }]}>Parent Subscriptions</Text>
          <View style={[styles.subCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.subRow}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Enrolled Families</Text>
              <Text style={[styles.subValue, { color: colors.foreground }]}>{athletes.length}</Text>
            </View>
            <View style={[styles.subDivider, { backgroundColor: colors.border }]} />
            <View style={styles.subRow}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Plan Rate</Text>
              <Text style={[styles.subValue, { color: colors.foreground }]}>₹199/month per athlete</Text>
            </View>
            <View style={[styles.subDivider, { backgroundColor: colors.border }]} />
            <View style={styles.subRow}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Status</Text>
              <View style={[styles.subBadge, { backgroundColor: colors.safeLight }]}>
                <Text style={[styles.subBadgeText, { color: colors.safeFg }]}>Active</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function BigStatCard({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[bsStyles.card, { backgroundColor: colors.card, borderColor: color + '33' }]}>
      <Feather name={icon as any} size={18} color={color} />
      <Text style={[bsStyles.value, { color }]}>{value}</Text>
      <Text style={[bsStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const bsStyles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1.5, gap: 4, minWidth: '45%' },
  value: { fontSize: 28, fontWeight: '800' as const },
  label: { fontSize: 11, fontWeight: '500' as const, textAlign: 'center' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' as const },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  demoBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 10 },
  demoBannerText: { fontSize: 12, fontWeight: '500' as const },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  section: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  riskDistCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  riskBar: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  riskBarFill: { height: 6, borderRadius: 3 },
  riskCount: { fontSize: 14, fontWeight: '600' as const, width: 20, textAlign: 'right' },
  coachRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  coachAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  coachName: { fontSize: 14, fontWeight: '600' as const },
  coachSport: { fontSize: 11, marginTop: 1 },
  coachStat: { fontSize: 12, fontWeight: '600' as const },
  incidentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  incidentBadgeText: { fontSize: 12, fontWeight: '600' as const },
  incidentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  incidentAthlete: { fontSize: 13, fontWeight: '600' as const },
  incidentDetail: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  incidentDate: { fontSize: 11 },
  subCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  subLabel: { fontSize: 13 },
  subValue: { fontSize: 13, fontWeight: '600' as const },
  subDivider: { height: 1 },
  subBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  subBadgeText: { fontSize: 12, fontWeight: '600' as const },
});
