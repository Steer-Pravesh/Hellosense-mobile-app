import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RiskBadge } from '@/components/RiskBadge';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function AcademyCoachesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coaches, athletes, sessionHistory } = useApp();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <Text style={styles.headerTitle}>Coaches</Text>
        <Text style={styles.headerSub}>{coaches.length} coaches · Active staff</Text>
      </View>

      <FlatList
        data={coaches}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const coachAthletes = athletes.filter((a) => a.coachId === item.id);
          const critical = coachAthletes.filter((a) => a.safetyLevel === 'critical');
          const caution = coachAthletes.filter((a) => a.safetyLevel === 'caution');
          const history = sessionHistory.filter((s) => s.coachId === item.id);

          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: critical.length > 0 ? colors.critical + '44' : colors.border }]}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: colors.secondary + '22' }]}>
                  <Feather name="user-check" size={22} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.coachName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.coachSport, { color: colors.mutedForeground }]}>{item.sport}</Text>
                </View>
                <View style={[styles.activeBadge, { backgroundColor: colors.safeLight }]}>
                  <View style={[styles.activeDot, { backgroundColor: colors.safe }]} />
                  <Text style={[styles.activeText, { color: colors.safeFg }]}>Active</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <CoachStat value={item.athleteCount.toString()} label="Athletes" icon="users" color={colors.primary} colors={colors} />
                <CoachStat value={item.activeSessions.toString()} label="Active" icon="activity" color={colors.safe} colors={colors} />
                <CoachStat value={critical.length.toString()} label="Critical" icon="alert-octagon" color={critical.length > 0 ? colors.critical : colors.mutedForeground} colors={colors} />
                <CoachStat value={caution.length.toString()} label="Caution" icon="alert-triangle" color={caution.length > 0 ? colors.caution : colors.mutedForeground} colors={colors} />
              </View>

              {coachAthletes.length > 0 && (
                <View style={styles.athleteChips}>
                  <Text style={[styles.athleteChipsTitle, { color: colors.mutedForeground }]}>Athletes</Text>
                  <View style={styles.chipsRow}>
                    {coachAthletes.map((a) => (
                      <View key={a.id} style={styles.chipRow}>
                        <View style={[styles.chip, { backgroundColor: colors.background }]}>
                          <Text style={[styles.chipText, { color: colors.foreground }]}>{a.name.split(' ')[0]}</Text>
                          <RiskBadge level={a.safetyLevel} small />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.responseRow}>
                <Feather name="clock" size={13} color={colors.mutedForeground} />
                <Text style={[styles.responseText, { color: colors.mutedForeground }]}>
                  {history.length} sessions recorded · Coach response: Excellent
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

function CoachStat({ value, label, icon, color, colors }: any) {
  return (
    <View style={[csStyles.stat, { backgroundColor: colors.background }]}>
      <Feather name={icon} size={13} color={color} />
      <Text style={[csStyles.value, { color }]}>{value}</Text>
      <Text style={[csStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const csStyles = StyleSheet.create({
  stat: { flex: 1, alignItems: 'center', borderRadius: 10, paddingVertical: 8, gap: 2 },
  value: { fontSize: 16, fontWeight: '700' as const },
  label: { fontSize: 9, fontWeight: '500' as const },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' as const, marginTop: 14 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 14, padding: 14, gap: 12, shadowColor: '#1E3D59', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  coachName: { fontSize: 16, fontWeight: '700' as const },
  coachSport: { fontSize: 12, marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontSize: 11, fontWeight: '600' as const },
  statsRow: { flexDirection: 'row', gap: 6 },
  athleteChips: { gap: 8 },
  athleteChipsTitle: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipRow: {},
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: '500' as const },
  responseRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  responseText: { fontSize: 12 },
});
