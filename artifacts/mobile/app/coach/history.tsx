import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function CoachHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessionHistory } = useApp();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <Text style={styles.headerTitle}>Session History</Text>
        <Text style={styles.headerSub}>{sessionHistory.length} sessions recorded</Text>
      </View>

      <FlatList
        data={sessionHistory}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="clock" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No sessions recorded yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={[styles.athleteName, { color: colors.foreground }]}>{item.athleteName}</Text>
                <Text style={[styles.sport, { color: colors.mutedForeground }]}>{item.sport} · {item.coachName}</Text>
              </View>
              <View style={[styles.incidentBadge, { backgroundColor: item.safetyIncidents > 0 ? colors.cautionLight : colors.safeLight }]}>
                <Feather name={item.safetyIncidents > 0 ? 'alert-triangle' : 'check'} size={12} color={item.safetyIncidents > 0 ? colors.caution : colors.safe} />
                <Text style={[styles.incidentText, { color: item.safetyIncidents > 0 ? colors.cautionFg : colors.safeFg }]}>
                  {item.safetyIncidents} incident{item.safetyIncidents !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View style={styles.cardStats}>
              <StatItem icon="calendar" label="Date" value={new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} colors={colors} />
              <StatItem icon="clock" label="Duration" value={`${item.duration} min`} colors={colors} />
            </View>

            <View style={[styles.summaryBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>{item.summary}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function StatItem({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  return (
    <View style={siStyles.item}>
      <Feather name={icon as any} size={13} color={colors.mutedForeground} />
      <Text style={[siStyles.label, { color: colors.mutedForeground }]}>{label}:</Text>
      <Text style={[siStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const siStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontSize: 12 },
  value: { fontSize: 12, fontWeight: '600' as const },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' as const, marginTop: 14 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 12, padding: 14, gap: 10, shadowColor: '#1E3D59', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardLeft: { flex: 1 },
  athleteName: { fontSize: 16, fontWeight: '700' as const },
  sport: { fontSize: 12, marginTop: 2 },
  incidentBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  incidentText: { fontSize: 11, fontWeight: '600' as const },
  cardStats: { flexDirection: 'row', gap: 16 },
  summaryBox: { borderRadius: 10, padding: 10 },
  summaryText: { fontSize: 13, lineHeight: 19 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 15 },
});
