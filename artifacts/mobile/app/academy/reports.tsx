import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function AcademyReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes, sessionHistory, coaches } = useApp();

  const totalSessions = sessionHistory.length;
  const totalIncidents = sessionHistory.reduce((s, h) => s + h.safetyIncidents, 0);
  const avgDuration = sessionHistory.length
    ? Math.round(sessionHistory.reduce((s, h) => s + h.duration, 0) / sessionHistory.length)
    : 0;
  const criticalAthletes = athletes.filter((a) => a.safetyLevel === 'critical').length;

  const sportCounts: Record<string, number> = {};
  athletes.forEach((a) => { sportCounts[a.sport] = (sportCounts[a.sport] || 0) + 1; });
  const topSports = Object.entries(sportCounts).sort((a, b) => b[1] - a[1]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <Text style={styles.headerTitle}>Safety Reports</Text>
        <Text style={styles.headerSub}>Academy performance and safety analytics</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom), gap: 16, padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.demoBanner, { backgroundColor: colors.cautionLight }]}>
          <Feather name="info" size={13} color={colors.caution} />
          <Text style={[styles.demoBannerText, { color: colors.cautionFg }]}>Demo data for interface preview.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.nav }]}>Overview Summary</Text>
        <View style={styles.statsGrid}>
          <ReportStat value={totalSessions.toString()} label="Total Sessions" icon="calendar" color={colors.primary} />
          <ReportStat value={totalIncidents.toString()} label="Safety Incidents" icon="alert-triangle" color={colors.caution} />
          <ReportStat value={`${avgDuration}m`} label="Avg Session" icon="clock" color={colors.secondary} />
          <ReportStat value={criticalAthletes.toString()} label="Current Critical" icon="alert-octagon" color={colors.critical} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.nav }]}>Athletes by Sport</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {topSports.map(([sport, count]) => (
            <View key={sport} style={styles.sportRow}>
              <Text style={[styles.sportName, { color: colors.foreground }]}>{sport}</Text>
              <View style={styles.sportBarRow}>
                <View style={[styles.sportBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.sportBarFill, { backgroundColor: colors.primary, width: `${(count / athletes.length) * 100}%` }]} />
                </View>
                <Text style={[styles.sportCount, { color: colors.mutedForeground }]}>{count}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.nav }]}>Incident Log</Text>
        {sessionHistory.filter((s) => s.safetyIncidents > 0).map((s) => (
          <View key={s.id} style={[styles.incCard, { backgroundColor: colors.card, borderColor: colors.cautionLight }]}>
            <View style={styles.incHeader}>
              <Text style={[styles.incAthlete, { color: colors.foreground }]}>{s.athleteName}</Text>
              <View style={[styles.incBadge, { backgroundColor: colors.cautionLight }]}>
                <Text style={[styles.incBadgeText, { color: colors.cautionFg }]}>{s.safetyIncidents} incident{s.safetyIncidents !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            <Text style={[styles.incSummary, { color: colors.mutedForeground }]}>{s.summary}</Text>
            <View style={styles.incMeta}>
              <Feather name="user" size={11} color={colors.mutedForeground} />
              <Text style={[styles.incMetaText, { color: colors.mutedForeground }]}>{s.coachName}</Text>
              <Feather name="calendar" size={11} color={colors.mutedForeground} />
              <Text style={[styles.incMetaText, { color: colors.mutedForeground }]}>{new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
              <Feather name="clock" size={11} color={colors.mutedForeground} />
              <Text style={[styles.incMetaText, { color: colors.mutedForeground }]}>{s.duration} min</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.nav }]}>Coach Response Record</Text>
        {coaches.map((coach) => {
          const cHistory = sessionHistory.filter((s) => s.coachId === coach.id);
          const cIncidentSessions = cHistory.filter((h) => h.safetyIncidents > 0);
          const cIncidents = cIncidentSessions.reduce((s, h) => s + h.safetyIncidents, 0);
          // A session "ended unresolved" if its summary indicates a critical flag was
          // still active when the coach closed it out — see handleEndAll in session.tsx.
          const unresolvedSessions = cIncidentSessions.filter((h) =>
            h.summary.toLowerCase().includes('unresolved')
          ).length;
          const responseRate =
            cIncidentSessions.length === 0
              ? 100
              : Math.round(((cIncidentSessions.length - unresolvedSessions) / cIncidentSessions.length) * 100);
          return (
            <View key={coach.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.coachName, { color: colors.foreground }]}>{coach.name}</Text>
              <Text style={[styles.coachSport, { color: colors.mutedForeground }]}>{coach.sport}</Text>
              <View style={styles.coachStats}>
                <CoachStatLine label="Sessions" value={cHistory.length.toString()} colors={colors} />
                <CoachStatLine label="Incidents Handled" value={cIncidents.toString()} colors={colors} />
                <CoachStatLine label="Response Rate" value={`${responseRate}%`} colors={colors} />
              </View>
            </View>
          );
        })}

        <View style={[styles.disclaimerBox, { backgroundColor: colors.inactiveLight, borderColor: colors.border }]}>
          <Feather name="shield" size={14} color={colors.inactive} />
          <Text style={[styles.disclaimerText, { color: colors.inactive }]}>
            HelioSense is a decision-support platform. These reports assist in identifying patterns but do not replace professional medical review or qualified coaching supervision.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ReportStat({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[rsStyles.card, { backgroundColor: colors.card, borderColor: color + '33' }]}>
      <Feather name={icon as any} size={16} color={color} />
      <Text style={[rsStyles.value, { color }]}>{value}</Text>
      <Text style={[rsStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function CoachStatLine({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={cslStyles.row}>
      <Text style={[cslStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[cslStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const rsStyles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1.5, gap: 4, minWidth: '45%' },
  value: { fontSize: 24, fontWeight: '800' as const },
  label: { fontSize: 10, fontWeight: '500' as const, textAlign: 'center' },
});

const cslStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  label: { fontSize: 12 },
  value: { fontSize: 12, fontWeight: '600' as const },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' as const, marginTop: 14 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  demoBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10, borderRadius: 10 },
  demoBannerText: { fontSize: 12, fontWeight: '500' as const },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  sportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 },
  sportName: { width: 80, fontSize: 13, fontWeight: '500' as const },
  sportBarRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sportBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  sportBarFill: { height: 6, borderRadius: 3 },
  sportCount: { fontSize: 12, fontWeight: '600' as const, width: 16 },
  incCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  incHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  incAthlete: { fontSize: 15, fontWeight: '700' as const },
  incBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  incBadgeText: { fontSize: 11, fontWeight: '600' as const },
  incSummary: { fontSize: 13, lineHeight: 18 },
  incMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  incMetaText: { fontSize: 11 },
  coachName: { fontSize: 15, fontWeight: '700' as const },
  coachSport: { fontSize: 12 },
  coachStats: { gap: 2, marginTop: 4 },
  disclaimerBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, padding: 12 },
  disclaimerText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
