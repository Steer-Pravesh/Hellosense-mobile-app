import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AthleteCard } from '@/components/AthleteCard';
import { CriticalAlertModal } from '@/components/CriticalAlertModal';
import { EnvBar } from '@/components/EnvBar';
import { Athlete, SafetyLevel, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type Filter = 'all' | SafetyLevel;

export default function CoachAthletesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes, envConditions } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [alertAthlete, setAlertAthlete] = useState<Athlete | null>(null);

  const myAthletes = athletes.filter((a) => a.coachId === 'c1');
  const filtered = myAthletes.filter((a) => {
    const matchFilter = filter === 'all' || a.safetyLevel === filter;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.sport.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filters: { id: Filter; label: string; color: string }[] = [
    { id: 'all', label: 'All', color: colors.nav },
    { id: 'critical', label: 'Critical', color: colors.critical },
    { id: 'caution', label: 'Caution', color: colors.caution },
    { id: 'safe', label: 'Safe', color: colors.safe },
    { id: 'recovery', label: 'Recovery', color: colors.recovery },
    { id: 'inactive', label: 'Inactive', color: colors.inactive },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Fixed top section — header + search + filter chips */}
      <View style={[styles.topSection, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top },
          ]}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.push('/')} hitSlop={12}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <View style={styles.headerTitle}>
              <Text style={styles.headerName}>Coach Dashboard</Text>
              <Text style={styles.headerSub}>Raj Mehta · Football, Athletics, Cricket</Text>
            </View>
            <View style={[styles.alertBadge, { backgroundColor: colors.critical }]}>
              <Text style={styles.alertBadgeText}>{myAthletes.filter((a) => a.safetyLevel === 'critical').length}</Text>
            </View>
          </View>
          <EnvBar env={envConditions} compact />
        </View>

        <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search athletes…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          style={[styles.filterList, { backgroundColor: colors.card }]}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}
          renderItem={({ item }) => {
            const count = item.id === 'all' ? myAthletes.length : myAthletes.filter((a) => a.safetyLevel === item.id).length;
            const active = filter === item.id;
            return (
              <Pressable
                style={[styles.filterBtn, { backgroundColor: active ? item.color : item.color + '18', borderColor: item.color + '44' }]}
                onPress={() => setFilter(item.id)}
              >
                <Text style={[styles.filterText, { color: active ? '#fff' : item.color }]}>
                  {item.label} {count > 0 ? `(${count})` : ''}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Scrollable athlete list */}
      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        style={styles.athleteList}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No athletes match this filter</Text>
          </View>
        }
        renderItem={({ item }) => (
          <AthleteCard athlete={item} onAlert={setAlertAthlete} showActions />
        )}
      />

      <CriticalAlertModal
        athlete={alertAthlete}
        visible={!!alertAthlete}
        onClose={() => setAlertAthlete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topSection: { flexShrink: 0 },
  header: { paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { flex: 1 },
  headerName: { color: '#fff', fontSize: 17, fontWeight: '700' as const },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  alertBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  alertBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' as const },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  filterList: { flexGrow: 0, flexShrink: 0 },
  filterBtn: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' as const },
  athleteList: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 15 },
});
