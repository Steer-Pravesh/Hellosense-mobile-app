import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Athlete } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

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
  return athlete.safetyLevel === "critical";
}

export function SessionRosterCard({
  athletes,
  overrides,
  onToggleOverride,
}: Props) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");

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
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleOverride(athleteId);
  };

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
            Athlete Activity
          </Text>
          <Text
            style={[styles.summaryTotal, { color: colors.mutedForeground }]}
          >
            {athletes.length} total
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryBlock, { backgroundColor: colors.safeLight }]}
          >
            <Text style={[styles.summaryCount, { color: colors.safe }]}>
              {included.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.safeFg }]}>
              Active
            </Text>
          </View>
          <View
            style={[
              styles.summaryBlock,
              { backgroundColor: colors.criticalLight },
            ]}
          >
            <Text style={[styles.summaryCount, { color: colors.critical }]}>
              {excluded.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.criticalFg }]}>
              Inactive
            </Text>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.tabWrap,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Pressable
          style={[
            styles.tabBtn,
            activeTab === "active" && { backgroundColor: colors.safeLight },
          ]}
          onPress={() => setActiveTab("active")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "active" ? colors.safe : colors.mutedForeground,
              },
            ]}
          >
            Active ({included.length})
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tabBtn,
            activeTab === "inactive" && {
              backgroundColor: colors.criticalLight,
            },
          ]}
          onPress={() => setActiveTab("inactive")}
        >
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === "inactive"
                    ? colors.critical
                    : colors.mutedForeground,
              },
            ]}
          >
            Inactive ({excluded.length})
          </Text>
        </Pressable>
      </View>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        ATHLETE ACTIVITY ·{" "}
        {activeTab === "active"
          ? "ACTIVE IN SESSION"
          : "INACTIVE / OUT OF SESSION"}
      </Text>
      <View
        style={[
          styles.listCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {(activeTab === "active" ? included : excluded).length > 0 ? (
          (activeTab === "active" ? included : excluded).map((a, idx, list) => (
            <RosterRow
              key={a.id}
              athlete={a}
              included={activeTab === "active"}
              isLast={idx === list.length - 1}
              colors={colors}
              onToggle={() => handleToggle(a.id)}
            />
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {activeTab === "active"
              ? "No athletes are active in this session yet."
              : "No inactive athletes. Everyone is currently available for this session."}
          </Text>
        )}
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
    athlete.safetyLevel === "critical"
      ? colors.critical
      : athlete.safetyLevel === "caution"
        ? colors.caution
        : colors.safe;
  const riskBg =
    athlete.safetyLevel === "critical"
      ? colors.criticalLight
      : athlete.safetyLevel === "caution"
        ? colors.cautionLight
        : colors.safeLight;

  return (
    <View
      style={[
        rowStyles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={[rowStyles.avatar, { backgroundColor: riskBg }]}>
        <Text style={[rowStyles.avatarText, { color: riskColor }]}>
          {athlete.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </Text>
      </View>
      <View style={rowStyles.info}>
        <Text style={[rowStyles.name, { color: colors.foreground }]}>
          {athlete.name}
        </Text>
        <Text style={[rowStyles.risk, { color: riskColor }]}>
          {athlete.safetyLevel.charAt(0).toUpperCase() +
            athlete.safetyLevel.slice(1)}
        </Text>
      </View>
      <Pressable
        onPress={onToggle}
        style={[
          rowStyles.toggleBtn,
          included
            ? {
                backgroundColor: colors.criticalLight,
                borderColor: colors.critical + "55",
              }
            : {
                backgroundColor: colors.safeLight,
                borderColor: colors.safe + "55",
              },
        ]}
        hitSlop={6}
      >
        <Feather
          name={included ? "minus" : "plus"}
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
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: { fontSize: 14, fontWeight: "700" as const },
  summaryTotal: { fontSize: 12 },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryBlock: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  summaryCount: { fontSize: 18, fontWeight: "700" as const },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  tabWrap: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 9,
  },
  tabText: { fontSize: 12, fontWeight: "800" as const },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  listCard: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 12 },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 14,
    textAlign: "center" as const,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 11, fontWeight: "700" as const },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: "600" as const },
  risk: { fontSize: 11, marginTop: 1 },
  toggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
