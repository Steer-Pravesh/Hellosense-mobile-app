import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Athlete } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface Props {
  athletes: Athlete[];
  /**
   * Manual overrides keyed by athlete id. `true` = force include (used to
   * bring a critical-risk athlete back in), `false` = force exclude (used
   * for a coach manually pulling an otherwise-safe athlete out).
   * Athletes with no entry fall back to the auto rule (critical = excluded).
   */
  overrides: Map<string, boolean>;
  onToggleOverride: (athleteId: string) => void;
}

/** Auto rule: critical risk defaults to excluded. Manual overrides always win. */
function isExcluded(athlete: Athlete, overrides: Map<string, boolean>) {
  const override = overrides.get(athlete.id);
  if (override !== undefined) return !override;
  return athlete.safetyLevel === 'critical';
}

export function SessionRosterCard({ athletes, overrides, onToggleOverride }: Props) {
  const colors = useColors();

  const { included, excluded } = useMemo(() => {
    const included: Athlete[] = [];
    const excluded: Athlete[] = [];
    for (const a of athletes) {
      if (isExcluded(a, overrides)) excluded.push(a);
      else included.push(a);
    }
    return { included, excluded };
  }, [athletes, overrides]);

  const handleToggle = (athleteId: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleOverride(athleteId);
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Session roster</Text>
          <Text style={[styles.summaryTotal, { color: colors.mutedForeground }]}>{athletes.length} total</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBlock, { backgroundColor: colors.safeLight }]}>
            <Text style={[styles.summaryCount, { color: colors.safe }]}>{included.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.safeFg }]}>Included</Text>
          </View>
          <View style={[styles.summaryBlock, { backgroundColor: colors.criticalLight }]}>
            <Text style={[styles.summaryCount, { color: colors.critical }]}>{excluded.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.criticalFg }]}>Auto-excluded</Text>
          </View>
        </View>
      </View>

      {excluded.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            EXCLUDED · CRITICAL RISK
          </Text>
          <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {excluded.map((a, idx) => (
              <RosterRow
                key={a.id}
                athlete={a}
                included={false}
                isLast={idx === excluded.length - 1}
                colors={colors}
                onToggle={() => handleToggle(a.id)}
              />
            ))}
          </View>
        </>
      )}

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        INCLUDED ({included.length})
      </Text>
      <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {included.map((a, idx) => (
          <RosterRow
            key={a.id}
            athlete={a}
            included
            isLast={idx === included.length - 1}
            colors={colors}
            onToggle={() => handleToggle(a.id)}
          />
        ))}
      </View>
    </View>
  );
}

function RosterRow({
  athlete,
  included,
  isLast,
  colors,
  onToggle,
}: {
  athlete: Athlete;
  included: boolean;
  isLast: boolean;
  colors: any;
  onToggle: () => void;
}) {
  const riskColor =
    athlete.safetyLevel === 'critical'
      ? colors.critical
      : athlete.safetyLevel === 'caution'
      ? colors.caution
      : colors.safe;
  const riskBg =
    athlete.safetyLevel === 'critical'
      ? colors.criticalLight
      : athlete.safetyLevel === 'caution'
      ? colors.cautionLight
      : colors.safeLight;

  return (
    <View style={[rowStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[rowStyles.avatar, { backgroundColor: riskBg }]}>
        <Text style={[rowStyles.avatarText, { color: riskColor }]}>
          {athlete.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </Text>
      </View>
      <View style={rowStyles.info}>
        <Text style={[rowStyles.name, { color: colors.foreground }]}>{athlete.name}</Text>
        <Text style={[rowStyles.risk, { color: riskColor }]}>
          {athlete.safetyLevel.charAt(0).toUpperCase() + athlete.safetyLevel.slice(1)}
        </Text>
      </View>
      <Pressable
        onPress={onToggle}
        style={[
          rowStyles.toggleBtn,
          included
            ? { backgroundColor: colors.criticalLight, borderColor: colors.critical + '55' }
            : { backgroundColor: colors.safeLight, borderColor: colors.safe + '55' },
        ]}
        hitSlop={6}
      >
        <Feather
          name={included ? 'minus' : 'plus'}
          size={16}
          color={included ? colors.critical : colors.safe}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 10 },
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontSize: 14, fontWeight: '700' as const },
  summaryTotal: { fontSize: 12 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryBlock: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  summaryCount: { fontSize: 18, fontWeight: '700' as const },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5, marginTop: 2 },
  listCard: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 12 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '700' as const },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600' as const },
  risk: { fontSize: 11, marginTop: 1 },
  toggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
