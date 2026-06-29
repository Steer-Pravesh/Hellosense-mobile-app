import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { EnvConditions } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  env: EnvConditions;
  closeSignal?: number;
}

type ExtendedEnv = EnvConditions & {
  temperature?: number;
  humidity?: number;
  feelsLike?: number;
  location?: string;
};

function getRiskCopy(risk: string) {
  switch (risk) {
    case "extreme":
      return "Avoid outdoor high-intensity work. Prefer indoor technical work or recovery drills.";
    case "high":
      return "High risk today. Reduce load, add recovery breaks, and supervise hydration closely.";
    case "moderate":
      return "Moderate risk. Training is okay with hydration windows and workload monitoring.";
    default:
      return "Low risk. Conditions look suitable with normal live monitoring.";
  }
}

function getRiskIcon(risk: string): React.ComponentProps<typeof Feather>["name"] {
  if (risk === "extreme") return "zap-off";
  if (risk === "high") return "alert-triangle";
  if (risk === "moderate") return "activity";
  return "check-circle";
}

export function SessionEnvironmentPanel({ env, closeSignal = 0 }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const current = env as ExtendedEnv;

  useEffect(() => {
    if (closeSignal > 0) setOpen(false);
  }, [closeSignal]);
  const risk = String(env.heatRisk ?? "moderate").toLowerCase();
  const riskColor =
    risk === "extreme" || risk === "high"
      ? colors.critical
      : risk === "moderate"
        ? colors.caution
        : colors.safe;

  const temperature =
    current.temperature != null
      ? `${Math.round(current.temperature)}°C`
      : "Live temp";
  const humidity =
    current.humidity != null ? `${Math.round(current.humidity)}%` : "Tracked";

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Pressable style={styles.strip} onPress={() => setOpen((value) => !value)}>
        <View
          style={[styles.stripIcon, { backgroundColor: colors.primary + "16" }]}
        >
          <Feather name="sun" size={16} color={colors.primary} />
        </View>
        <View style={styles.stripTextWrap}>
          <View style={styles.stripLabelRow}>
            <Text style={[styles.stripLabel, { color: colors.mutedForeground }]}>TODAY&apos;S CONDITIONS</Text>
            <Feather name="wind" size={10} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.stripValue, { color: colors.foreground }]} numberOfLines={1}>
            UV {env.uvIndex.toFixed(1)} · {temperature} · {humidity}
          </Text>
        </View>
        <View style={[styles.riskPill, { backgroundColor: riskColor + "16", borderColor: riskColor + "28" }]}>
          <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
          <Text style={[styles.riskText, { color: riskColor }]}>
            {risk.toUpperCase()}
          </Text>
        </View>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </Pressable>

      {open ? (
        <View style={[styles.dropdown, { borderTopColor: colors.border }]}> 
          <View style={styles.metricsRow}>
            <Metric icon="sun" label="UV" value={env.uvIndex.toFixed(1)} colors={colors} />
            <Metric icon="thermometer" label="Temp" value={temperature} colors={colors} />
            <Metric icon="droplet" label="Humidity" value={humidity} colors={colors} />
          </View>

          <View style={styles.miniInsightRow}>
            <View style={styles.miniInsightItem}>
              <Feather name="clock" size={12} color={colors.primary} />
              <Text style={[styles.miniInsightText, { color: colors.mutedForeground }]} numberOfLines={1}>
                Safer window available
              </Text>
            </View>
            <View style={styles.miniInsightItem}>
              <Feather name={getRiskIcon(risk)} size={12} color={riskColor} />
              <Text style={[styles.miniInsightText, { color: colors.mutedForeground }]} numberOfLines={1}>
                Auto session guard active
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.guidance,
              { backgroundColor: riskColor + "10", borderColor: riskColor + "30" },
            ]}
          >
            <Feather name="info" size={14} color={riskColor} />
            <View style={styles.guidanceTextWrap}>
              <Text style={[styles.guidanceTitle, { color: colors.foreground }]}>
                {getRiskCopy(risk)}
              </Text>
              <Text style={[styles.safeWindow, { color: colors.mutedForeground }]}>
                Safer window: {env.safeHours}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.background }]}> 
      <Feather name={icon} size={13} color={colors.primary} />
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  strip: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  stripIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stripTextWrap: { flex: 1, minWidth: 0 },
  stripLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  stripLabel: { fontSize: 8, fontWeight: "900" as const, letterSpacing: 0.8 },
  stripValue: { fontSize: 12, fontWeight: "900" as const, marginTop: 2 },
  riskPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  riskDot: { width: 7, height: 7, borderRadius: 4 },
  riskText: { fontSize: 8, fontWeight: "900" as const, letterSpacing: 0.3 },
  dropdown: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  metricsRow: { flexDirection: "row", gap: 8 },
  metric: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    minHeight: 64,
    justifyContent: "center",
    gap: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  metricValue: { fontSize: 16, fontWeight: "900" as const, marginTop: 2 },
  metricLabel: { fontSize: 9, fontWeight: "700" as const },
  miniInsightRow: { flexDirection: "row", gap: 8 },
  miniInsightItem: {
    flex: 1,
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  miniInsightText: { flex: 1, fontSize: 9, fontWeight: "700" as const },
  guidance: {
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  guidanceTextWrap: { flex: 1, gap: 3 },
  guidanceTitle: { fontSize: 11, lineHeight: 16, fontWeight: "700" as const },
  safeWindow: { fontSize: 10, fontWeight: "600" as const },
});
