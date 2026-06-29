import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Athlete, EnvConditions } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  athletes: Athlete[];
  env: EnvConditions;
  onApply?: (recommendation: Recommendation) => void;
  onAdjust?: () => void;
}

type SessionIntensity = "low" | "medium" | "high";
type LocationType = "outdoor" | "indoor";
type DrillType = "sprint" | "endurance" | "strength" | "mixed";
type TimeChoice = "current" | "later";
type RiskLevel = "safe" | "watch" | "high" | "avoid";
type RecommendedIntensity = "low" | "moderate" | "high";

export interface Recommendation {
  intensity: RecommendedIntensity;
  loadPercent: number;
  durationMin: number;
  plannedDurationMin: number;
  bestWindow: string;
  hydrationIntervalMin: number;
  sessionFocus: string;
  reason: string;
}

interface WatchAthlete {
  id: string;
  name: string;
  reasons: string[];
  riskScore: number;
}

interface RiskPreview extends Recommendation {
  riskLevel: RiskLevel;
  riskScore: number;
  riskHeadline: string;
  riskWindow: string;
  athletesToWatch: WatchAthlete[];
  warnings: string[];
  recommendations: string[];
  restIntervalMin: number;
  hydrationPlan: string[];
  restPlan: string[];
}

const LOCATION_OPTIONS: { value: LocationType; label: string }[] = [
  { value: "outdoor", label: "Outdoor" },
  { value: "indoor", label: "Indoor" },
];

const DRILL_OPTIONS: { value: DrillType; label: string }[] = [
  { value: "sprint", label: "Sprint" },
  { value: "endurance", label: "Endurance" },
  { value: "strength", label: "Strength" },
  { value: "mixed", label: "Mixed" },
];

function getCurrentSessionTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSessionIntensity(intensityScore: number): SessionIntensity {
  if (intensityScore >= 70) return "high";
  if (intensityScore >= 40) return "medium";
  return "low";
}

function buildSchedule(
  durationMin: number,
  intervalMin: number,
  label: "Hydration" | "Rest",
) {
  const items: string[] = [];
  for (let minute = intervalMin; minute < durationMin; minute += intervalMin) {
    items.push(`${label} at ${minute} min`);
  }
  return items.slice(0, 5);
}

function scoreAthlete(
  athlete: Athlete,
  intensityScore: number,
  drillType: DrillType,
  durationMin: number,
  locationType: LocationType,
  env: EnvConditions,
) {
  let score = 0;
  const reasons: string[] = [];
  const metrics = athlete.bodyMetrics;

  if (athlete.safetyLevel === "critical") {
    score += 38;
    reasons.push("currently critical");
  } else if (athlete.safetyLevel === "caution") {
    score += 22;
    reasons.push("already in caution zone");
  }

  if (athlete.hydrationStatus === "critical") {
    score += 28;
    reasons.push("critical hydration");
  } else if (athlete.hydrationStatus === "low") {
    score += 18;
    reasons.push("low hydration");
  }

  if (metrics.recoveryScore < 60) {
    score += 18;
    reasons.push("low recovery score");
  } else if (metrics.recoveryScore < 72) {
    score += 10;
    reasons.push("recovery below ideal");
  }

  if (metrics.fatigueScore >= 65) {
    score += 18;
    reasons.push("high fatigue");
  } else if (metrics.fatigueScore >= 50) {
    score += 10;
    reasons.push("rising fatigue");
  }

  if (metrics.heatAcclimatisation === "low") {
    score += 14;
    reasons.push("low heat acclimatisation");
  }

  if (intensityScore >= 80) score += 18;
  else if (intensityScore >= 60) score += 12;
  else if (intensityScore >= 40) score += 6;

  if (drillType === "sprint" || drillType === "endurance") score += 10;
  if (durationMin >= 75) score += 10;
  if (durationMin >= 90) score += 8;
  if (locationType === "outdoor" && env.uvIndex >= 8) score += 15;
  if (locationType === "outdoor" && env.temperature >= 36) score += 12;
  if (env.heatRisk === "extreme") score += 20;
  if (env.heatRisk === "high") score += 12;

  return { ...athlete, riskScore: score, reasons };
}

function buildRiskPreview(
  athletes: Athlete[],
  env: EnvConditions,
  sessionTime: string,
  durationMin: number,
  intensityScore: number,
  locationType: LocationType,
  drillType: DrillType,
): RiskPreview {
  const intensity = getSessionIntensity(intensityScore);
  const activeAthletes = athletes.filter(
    (athlete) => athlete.status !== "session_ended",
  );
  const scored = activeAthletes
    .map((athlete) =>
      scoreAthlete(
        athlete,
        intensityScore,
        drillType,
        durationMin,
        locationType,
        env,
      ),
    )
    .sort((a, b) => b.riskScore - a.riskScore);

  const athletesToWatch = scored
    .filter((athlete) => athlete.riskScore >= 45)
    .slice(0, 4)
    .map((athlete) => ({
      id: athlete.id,
      name: athlete.name,
      reasons: athlete.reasons.slice(0, 3),
      riskScore: athlete.riskScore,
    }));

  const topScore = scored[0]?.riskScore ?? 0;
  const environmentScore =
    (locationType === "outdoor" ? env.uvIndex * 4 : env.uvIndex) +
    (env.temperature >= 36 ? 14 : env.temperature >= 33 ? 8 : 2) +
    (env.heatRisk === "extreme"
      ? 22
      : env.heatRisk === "high"
        ? 14
        : env.heatRisk === "moderate"
          ? 7
          : 0);
  const sessionScore =
    intensityScore * 0.28 +
    (durationMin >= 90
      ? 18
      : durationMin >= 75
        ? 12
        : durationMin >= 60
          ? 7
          : 3) +
    (drillType === "sprint"
      ? 14
      : drillType === "endurance"
        ? 12
        : drillType === "mixed"
          ? 8
          : 4);
  const riskScore = Math.min(
    100,
    Math.round(topScore * 0.52 + environmentScore * 0.28 + sessionScore * 0.2),
  );

  const riskLevel: RiskLevel =
    riskScore >= 78
      ? "avoid"
      : riskScore >= 60
        ? "high"
        : riskScore >= 38
          ? "watch"
          : "safe";

  const hydrationIntervalMin =
    riskLevel === "avoid"
      ? 8
      : riskLevel === "high"
        ? 10
        : riskLevel === "watch"
          ? 15
          : 20;
  const restIntervalMin =
    riskLevel === "avoid"
      ? 16
      : riskLevel === "high"
        ? 20
        : riskLevel === "watch"
          ? 30
          : 40;
  const loadPercent =
    riskLevel === "avoid"
      ? 45
      : riskLevel === "high"
        ? 60
        : riskLevel === "watch"
          ? 75
          : 90;
  const recommendedDuration = Math.max(
    30,
    Math.round(durationMin * (loadPercent / 90)),
  );
  const recommendedIntensity: RecommendedIntensity =
    riskLevel === "safe" ? "high" : riskLevel === "watch" ? "moderate" : "low";

  const warnings: string[] = [];
  if (locationType === "outdoor" && env.uvIndex >= 8)
    warnings.push(`Peak UV exposure risk around ${sessionTime}`);
  if (env.temperature >= 36)
    warnings.push("Heat load can rise quickly during continuous drills");
  if (durationMin >= 75 && intensity === "high")
    warnings.push(
      "Long high-intensity block may push vulnerable athletes into caution zone",
    );
  if (athletesToWatch.length > 0)
    warnings.push(
      `${athletesToWatch.length} athletes need closer monitoring from the first block`,
    );

  const hydrationPlan = buildSchedule(
    durationMin,
    hydrationIntervalMin,
    "Hydration",
  );
  const restPlan = buildSchedule(durationMin, restIntervalMin, "Rest");

  const recommendations = [
    `Hydration break every ${hydrationIntervalMin} minutes`,
    `Recovery/rest block every ${restIntervalMin} minutes`,
    riskLevel === "safe"
      ? "Continue normal workload with live monitoring"
      : "Front-load demanding drills and extend recovery blocks",
    riskLevel === "avoid" || riskLevel === "high"
      ? "Reduce sprint volume by 20–30%"
      : "Keep sprint volume controlled",
    locationType === "outdoor"
      ? "Keep shaded recovery zone ready"
      : "Keep ventilation and water access ready",
  ];

  const riskHeadline =
    riskLevel === "avoid"
      ? "Modify this session before starting"
      : riskLevel === "high"
        ? "High caution: athletes may enter risk zone"
        : riskLevel === "watch"
          ? "Keep watch: manageable with breaks"
          : "Safe to start with normal monitoring";

  const riskWindow =
    riskLevel === "safe"
      ? "Risk unlikely in first 60 min"
      : riskLevel === "watch"
        ? "Watch after 45–60 min"
        : riskLevel === "high"
          ? "Watch after 30–45 min"
          : "Risk may rise within 20–30 min";

  const sessionFocus =
    riskLevel === "safe"
      ? "Planned session is acceptable with HelioSense live monitoring."
      : riskLevel === "watch"
        ? "Use controlled intensity, planned hydration and active monitoring for flagged athletes."
        : riskLevel === "high"
          ? "Reduce load, shorten intense blocks and assign watch athletes to modified workload."
          : "Avoid long outdoor high-intensity work. Shift to technical, indoor or recovery-focused training.";

  return {
    intensity: recommendedIntensity,
    loadPercent,
    durationMin: recommendedDuration,
    plannedDurationMin: durationMin,
    bestWindow: env.safeHours,
    hydrationIntervalMin,
    restIntervalMin,
    hydrationPlan: hydrationPlan.length
      ? hydrationPlan
      : ["No fixed hydration break needed before session end"],
    restPlan: restPlan.length
      ? restPlan
      : ["No fixed rest block needed before session end"],
    sessionFocus,
    reason: `HelioSense combined ${durationMin} min work, ${intensityScore}/100 intensity, ${drillType} drills, ${locationType} conditions, UV ${env.uvIndex.toFixed(1)}, ${Math.round(env.temperature)}°C heat and each athlete's hydration, recovery, fatigue and heat acclimatisation.`,
    riskLevel,
    riskScore,
    riskHeadline,
    riskWindow,
    athletesToWatch,
    warnings: warnings.length
      ? warnings
      : ["No major pre-session threat detected"],
    recommendations,
  };
}

const RISK_STYLE: Record<
  RiskLevel,
  { label: string; icon: React.ComponentProps<typeof Feather>["name"] }
> = {
  safe: { label: "LOW RISK", icon: "check-circle" },
  watch: { label: "KEEP WATCH", icon: "eye" },
  high: { label: "HIGH CAUTION", icon: "alert-triangle" },
  avoid: { label: "MODIFY SESSION", icon: "shield-off" },
};

const INTENSITY_LABEL: Record<RecommendedIntensity, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export function AISessionCard({ athletes, env, onApply, onAdjust }: Props) {
  const colors = useColors();
  const [plannerVisible, setPlannerVisible] = useState(false);
  const [timeChoice, setTimeChoice] = useState<TimeChoice>("current");
  const [sessionTime, setSessionTime] = useState(getCurrentSessionTime());
  const [scheduledTimeInput, setScheduledTimeInput] = useState("16:00");
  const [durationInput, setDurationInput] = useState("90");
  const [intensityScore, setIntensityScore] = useState(75);
  const [locationType, setLocationType] = useState<LocationType>("outdoor");
  const [drillType, setDrillType] = useState<DrillType>("sprint");
  const [applied, setApplied] = useState(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);

  const durationMin = Math.max(5, Math.min(240, Number(durationInput) || 5));

  const preview = useMemo(
    () =>
      buildRiskPreview(
        athletes,
        env,
        sessionTime,
        durationMin,
        intensityScore,
        locationType,
        drillType,
      ),
    [
      athletes,
      durationMin,
      drillType,
      env,
      intensityScore,
      locationType,
      sessionTime,
    ],
  );

  const riskColor =
    preview.riskLevel === "safe"
      ? colors.safe
      : preview.riskLevel === "watch"
        ? colors.caution
        : colors.critical;

  const handleChange = (callback: () => void) => {
    callback();
    setApplied(false);
    onAdjust?.();
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const handleOpenPlanner = () => {
    handleChange(() => {
      setPlannerVisible(true);
      setTimeChoice("current");
      setSessionTime(getCurrentSessionTime());
    });
  };

  const handleTimeChoice = (choice: TimeChoice) => {
    handleChange(() => {
      setTimeChoice(choice);
      const nextTime =
        choice === "current" ? getCurrentSessionTime() : scheduledTimeInput;
      setSessionTime(nextTime);
    });
  };

  const handleScheduledTimeChange = (value: string) => {
    handleChange(() => {
      setScheduledTimeInput(value);
      if (timeChoice === "later") setSessionTime(value);
    });
  };

  const handleIntensityInput = (value: string) => {
    const numeric = Number(value.replace(/[^0-9]/g, ""));
    if (Number.isNaN(numeric)) return;
    handleChange(() => setIntensityScore(Math.max(0, Math.min(100, numeric))));
  };

  const handleApply = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApplied(true);
    setAiSheetOpen(false);
    onApply?.(preview);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.nav }]}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <View style={styles.aiIcon}>
            <Feather name="cpu" size={15} color={colors.secondary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.secondary }]}>
              SESSION SETUP
            </Text>
            <Text style={styles.subtitle}>
              Simple setup. AI stays hidden until needed.
            </Text>
          </View>
        </View>
        {plannerVisible && (
          <View
            style={[styles.riskPill, { backgroundColor: `${riskColor}22` }]}
          >
            <Feather
              name={RISK_STYLE[preview.riskLevel].icon}
              size={12}
              color={riskColor}
            />
            <Text style={[styles.riskPillText, { color: riskColor }]}>
              {RISK_STYLE[preview.riskLevel].label}
            </Text>
          </View>
        )}
      </View>

      {!plannerVisible ? (
        <Pressable
          style={[styles.addSessionBtn, { backgroundColor: colors.secondary }]}
          onPress={handleOpenPlanner}
        >
          <Feather name="plus-circle" size={17} color="#fff" />
          <Text style={styles.addSessionText}>Add Session</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.plannerBox}>
            <View style={styles.durationLocationRow}>
              <View style={styles.durationColumn}>
                <Text style={styles.plannerLabel}>Duration</Text>
                <View style={styles.durationRow}>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() =>
                      handleChange(() =>
                        setDurationInput(String(Math.max(5, durationMin - 5))),
                      )
                    }
                  >
                    <Feather name="minus" size={14} color="#fff" />
                  </Pressable>
                  <TextInput
                    value={durationInput}
                    onChangeText={(value) =>
                      handleChange(() =>
                        setDurationInput(value.replace(/[^0-9]/g, "")),
                      )
                    }
                    keyboardType="number-pad"
                    style={styles.durationInput}
                    placeholder="60"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                  />
                </View>
              </View>

              <View style={styles.locationColumn}>
                <Text style={styles.plannerLabel}>Location</Text>
                <View style={styles.locationToggle}>
                  {LOCATION_OPTIONS.map((item) => {
                    const selected = item.value === locationType;
                    return (
                      <Pressable
                        key={item.value}
                        style={[
                          styles.locationChip,
                          selected && styles.locationChipActive,
                        ]}
                        onPress={() =>
                          handleChange(() => setLocationType(item.value))
                        }
                      >
                        <Text
                          style={[
                            styles.locationChipText,
                            selected && styles.locationChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.plannerRow}>
              <View style={styles.sliderHeader}>
                <Text style={styles.plannerLabel}>Intensity</Text>
                <View style={styles.intensityInputWrap}>
                  <TextInput
                    value={String(intensityScore)}
                    onChangeText={handleIntensityInput}
                    keyboardType="number-pad"
                    style={styles.intensityInput}
                    maxLength={3}
                  />
                  <Text style={styles.intensityValue}>/100</Text>
                </View>
              </View>
              <View style={styles.intensityEditRow}>
                <Pressable
                  style={styles.smallStepBtn}
                  onPress={() =>
                    handleChange(() =>
                      setIntensityScore(Math.max(0, intensityScore - 5)),
                    )
                  }
                >
                  <Feather name="minus" size={13} color="#fff" />
                </Pressable>
                <Pressable
                  style={styles.intensityBar}
                  onPress={() =>
                    handleChange(() =>
                      setIntensityScore(Math.min(100, intensityScore + 10)),
                    )
                  }
                >
                  <View
                    style={[
                      styles.intensityFill,
                      {
                        width: `${intensityScore}%`,
                        backgroundColor: riskColor,
                      },
                    ]}
                  />
                </Pressable>
                <Pressable
                  style={styles.smallStepBtn}
                  onPress={() =>
                    handleChange(() =>
                      setIntensityScore(Math.min(100, intensityScore + 5)),
                    )
                  }
                >
                  <Feather name="plus" size={13} color="#fff" />
                </Pressable>
              </View>
              <View style={styles.markerRow}>
                {[0, 25, 50, 75, 100].map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => handleChange(() => setIntensityScore(value))}
                  >
                    <Text
                      style={[
                        styles.markerText,
                        intensityScore === value && styles.markerTextActive,
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <PlannerRow
              label="Drill"
              options={DRILL_OPTIONS.map((item) => item.label)}
              value={
                DRILL_OPTIONS.find((item) => item.value === drillType)?.label ??
                "Sprint"
              }
              onSelect={(label) =>
                handleChange(() =>
                  setDrillType(
                    DRILL_OPTIONS.find((item) => item.label === label)?.value ??
                      "sprint",
                  ),
                )
              }
            />
          </View>

          <Pressable
            style={[
              styles.aiStatusRow,
              {
                borderColor: `${riskColor}44`,
                backgroundColor: `${riskColor}12`,
              },
            ]}
            onPress={() => setAiSheetOpen(true)}
          >
            <View style={styles.aiStatusLeft}>
              <View
                style={[styles.aiStatusDot, { backgroundColor: riskColor }]}
              />
              <View>
                <Text style={styles.aiStatusTitle}>
                  AI Safe · {Math.max(0, 100 - preview.riskScore)}/100
                </Text>
                <Text style={styles.aiStatusSub}>{preview.riskHeadline}</Text>
              </View>
            </View>
            <View style={styles.aiViewButton}>
              <Text style={styles.aiViewButtonText}>View</Text>
              <Feather name="chevron-up" size={14} color="#fff" />
            </View>
          </Pressable>

          <Modal
            visible={aiSheetOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setAiSheetOpen(false)}
          >
            <View style={styles.sheetOverlay}>
              <Pressable
                style={styles.sheetBackdrop}
                onPress={() => setAiSheetOpen(false)}
              />
              <View style={[styles.sheet, { backgroundColor: colors.nav }]}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <View>
                    <Text
                      style={[styles.sheetTitle, { color: colors.secondary }]}
                    >
                      HelioSense AI Suggestions
                    </Text>
                    <Text style={styles.sheetSub}>
                      Hidden by default. Open only when coach needs detail.
                    </Text>
                  </View>
                  <Pressable
                    style={styles.sheetClose}
                    onPress={() => setAiSheetOpen(false)}
                  >
                    <Feather name="x" size={18} color="#fff" />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View
                    style={[
                      styles.sheetScorePanel,
                      {
                        borderColor: `${riskColor}55`,
                        backgroundColor: `${riskColor}12`,
                      },
                    ]}
                  >
                    <View style={styles.safeScoreHeader}>
                      <Text style={styles.safeScoreLabel}>
                        PREDICTED SAFETY
                      </Text>
                      <Text style={[styles.scoreText, { color: riskColor }]}>
                        {Math.max(0, 100 - preview.riskScore)}/100
                      </Text>
                    </View>
                    <View style={styles.safeScoreTrack}>
                      <View
                        style={[
                          styles.safeScoreFill,
                          {
                            width: `${Math.max(0, 100 - preview.riskScore)}%`,
                            backgroundColor: riskColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.safeScoreSub}>
                      {preview.riskHeadline} · {preview.riskWindow}
                    </Text>
                  </View>

                  <View style={styles.statsRow}>
                    <StatBlock
                      label="Suggested load"
                      value={`${preview.loadPercent}%`}
                      sub={`Intensity ${INTENSITY_LABEL[preview.intensity]}`}
                      valueColor={riskColor}
                    />
                    <StatBlock
                      label="Duration"
                      value={`${preview.durationMin} min`}
                      sub={`vs ${preview.plannedDurationMin} planned`}
                    />
                    <StatBlock
                      label="Hydration"
                      value={`${preview.hydrationIntervalMin} min`}
                      sub="break interval"
                    />
                  </View>

                  <ScheduleBox
                    title="UPCOMING HYDRATION"
                    icon="droplet"
                    items={preview.hydrationPlan}
                    color={colors.recovery}
                  />
                  <ScheduleBox
                    title="UPCOMING REST"
                    icon="pause-circle"
                    items={preview.restPlan}
                    color={colors.safe}
                  />

                  <View style={styles.focusBox}>
                    <Text style={styles.focusLabel}>
                      COACH DECISION SUPPORT
                    </Text>
                    <Text style={styles.focusValue}>
                      {preview.sessionFocus}
                    </Text>
                  </View>

                  <View style={styles.watchBox}>
                    <Text style={styles.focusLabel}>ATHLETES TO WATCH</Text>
                    {preview.athletesToWatch.length > 0 ? (
                      preview.athletesToWatch.map((athlete) => (
                        <View key={athlete.id} style={styles.watchRow}>
                          <View
                            style={[
                              styles.watchDot,
                              { backgroundColor: riskColor },
                            ]}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.watchName}>{athlete.name}</Text>
                            <Text style={styles.watchReason}>
                              {athlete.reasons.join(" + ") ||
                                "elevated session risk"}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        No athlete is currently predicted to be under major
                        threat.
                      </Text>
                    )}
                  </View>

                  <View style={styles.recommendationBox}>
                    <Text style={styles.focusLabel}>RECOMMENDATIONS</Text>
                    {preview.recommendations.map((item) => (
                      <View key={item} style={styles.bulletRow}>
                        <Feather
                          name="check"
                          size={13}
                          color={colors.secondary}
                        />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.sheetActions}>
                  <Pressable
                    style={[
                      styles.sheetPrimaryBtn,
                      { backgroundColor: colors.secondary },
                    ]}
                    onPress={() => {
                      handleApply();
                      setAiSheetOpen(false);
                    }}
                  >
                    <Text style={styles.sheetPrimaryText}>
                      Save Changes
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.sheetSecondaryBtn}
                    onPress={() => setAiSheetOpen(false)}
                  >
                    <Text style={styles.sheetSecondaryText}>Keep My Plan</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          <View style={styles.scheduleLaterBox}>
            <Pressable
              style={[
                styles.scheduleLaterBtn,
                timeChoice === "later" && styles.scheduleLaterBtnActive,
              ]}
              onPress={() =>
                handleTimeChoice(timeChoice === "later" ? "current" : "later")
              }
            >
              <Feather
                name="clock"
                size={14}
                color={
                  timeChoice === "later" ? "#fff" : "rgba(255,255,255,0.82)"
                }
              />
              <Text style={styles.scheduleLaterText}>
                {timeChoice === "later"
                  ? "Scheduled for later"
                  : "Schedule for Later"}
              </Text>
            </Pressable>
            {timeChoice === "later" && (
              <TextInput
                value={scheduledTimeInput}
                onChangeText={handleScheduledTimeChange}
                style={styles.timeInput}
                placeholder="HH:MM"
                placeholderTextColor="rgba(255,255,255,0.35)"
              />
            )}
            <Text style={styles.helperText}>
              {timeChoice === "later"
                ? `Session scheduled at ${sessionTime || "selected time"}`
                : `Starts now · ${sessionTime}`}
            </Text>
          </View>

          <View style={styles.btnRow}>
            <Pressable
              style={[
                styles.applyBtn,
                {
                  backgroundColor: applied ? colors.safe : colors.secondary,
                },
              ]}
              onPress={handleApply}
            >
              <Feather
                name={applied ? "check" : "shield"}
                size={15}
                color="#fff"
              />
              <Text style={styles.applyBtnText}>
                {applied ? "Session ready" : "Start Session"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.adjustBtn}
              onPress={() => handleChange(() => setIntensityScore(55))}
            >
              <Feather
                name="sliders"
                size={15}
                color="rgba(255,255,255,0.85)"
              />
              <Text style={styles.adjustBtnText}>Safer preset</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function PlannerRow({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.plannerRow}>
      <Text style={styles.plannerLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => onSelect(option)}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextActive]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StatBlock({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <View style={blockStyles.block}>
      <Text style={blockStyles.label}>{label}</Text>
      <Text
        style={[blockStyles.value, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
      <Text style={blockStyles.sub}>{sub}</Text>
    </View>
  );
}

function ScheduleBox({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  items: string[];
  color: string;
}) {
  return (
    <View style={styles.scheduleBox}>
      <View style={styles.scheduleTitleRow}>
        <Feather name={icon} size={14} color={color} />
        <Text style={styles.focusLabel}>{title}</Text>
      </View>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <View style={[styles.scheduleDot, { backgroundColor: color }]} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const blockStyles = StyleSheet.create({
  block: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 11,
    padding: 10,
    gap: 2,
  },
  label: { color: "rgba(255,255,255,0.55)", fontSize: 10 },
  value: { color: "#fff", fontSize: 15, fontWeight: "800" as const },
  sub: { color: "rgba(255,255,255,0.5)", fontSize: 9 },
});

const styles = StyleSheet.create({
  card: { borderRadius: 18, margin: 16, marginBottom: 8, padding: 16, gap: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  titleLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  aiIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 12, fontWeight: "800" as const, letterSpacing: 0.5 },
  subtitle: { color: "rgba(255,255,255,0.55)", fontSize: 9, marginTop: 2 },
  riskPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  riskPillText: { fontSize: 9, fontWeight: "800" as const, letterSpacing: 0.3 },
  addSessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    paddingVertical: 13,
  },
  addSessionText: { color: "#fff", fontSize: 14, fontWeight: "800" as const },
  modeBox: {
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 13,
    padding: 11,
  },
  modeRow: { flexDirection: "row", gap: 9 },
  modeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 12,
    padding: 11,
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  modeCardActive: {
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  modeTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "800" as const,
  },
  modeTitleActive: { color: "#fff" },
  modeSub: { color: "rgba(255,255,255,0.52)", fontSize: 9, lineHeight: 13 },
  plannerBox: {
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 13,
    padding: 11,
  },
  plannerRow: { gap: 7 },
  durationLocationRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  durationColumn: { flex: 0.44, gap: 7, minWidth: 0 },
  locationColumn: { flex: 0.56, gap: 7, minWidth: 0 },
  locationToggle: { flexDirection: "row", gap: 5 },
  locationChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 5,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  locationChipActive: {
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  locationChipText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 8,
    fontWeight: "700" as const,
  },
  locationChipTextActive: { color: "#fff" },
  plannerLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  helperText: { color: "rgba(255,255,255,0.55)", fontSize: 10, lineHeight: 14 },
  timeInput: {
    minHeight: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 14,
    fontWeight: "700" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipActive: {
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  chipText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "600" as const,
  },
  chipTextActive: { color: "#fff" },
  durationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBtn: {
    width: 30,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  durationInput: {
    flex: 1,
    minWidth: 44,
    maxWidth: 58,
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 6,
    textAlign: "center",
    color: "#fff",
    fontSize: 15,
    fontWeight: "800" as const,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  durationUnitPill: {
    minHeight: 30,
    paddingHorizontal: 8,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  durationUnitText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "800" as const,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  intensityValue: { color: "#fff", fontSize: 12, fontWeight: "800" as const },
  intensityInputWrap: { flexDirection: "row", alignItems: "center", gap: 3 },
  intensityInput: {
    width: 46,
    height: 32,
    borderRadius: 9,
    paddingHorizontal: 8,
    textAlign: "center",
    color: "#fff",
    fontSize: 14,
    fontWeight: "800" as const,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  intensityEditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  smallStepBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  intensityBar: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  intensityFill: { height: "100%", borderRadius: 999 },
  markerRow: { flexDirection: "row", justifyContent: "space-between" },
  markerText: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "700" as const,
  },
  markerTextActive: { color: "#fff" },
  aiStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 13,
    padding: 11,
    gap: 10,
  },
  aiStatusLeft: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  aiStatusDot: { width: 9, height: 9, borderRadius: 9 },
  aiStatusTitle: { color: "#fff", fontSize: 13, fontWeight: "900" as const },
  aiStatusSub: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
  },
  aiViewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  aiViewButtonText: { color: "#fff", fontSize: 11, fontWeight: "800" as const },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    maxHeight: "84%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitle: { fontSize: 14, fontWeight: "900" as const, letterSpacing: 0.3 },
  sheetSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    marginTop: 3,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  sheetScroll: { maxHeight: 520 },
  sheetContent: { gap: 10, paddingBottom: 4 },
  sheetScorePanel: { borderWidth: 1, borderRadius: 13, padding: 12, gap: 9 },
  sheetActions: { flexDirection: "row", gap: 8 },
  sheetPrimaryBtn: {
    flex: 1.15,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimaryText: { color: "#fff", fontSize: 13, fontWeight: "800" as const },
  sheetSecondaryBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  sheetSecondaryText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  previewPanel: { borderWidth: 1, borderRadius: 13, padding: 12, gap: 9 },
  safeScorePanel: { borderWidth: 1, borderRadius: 13, padding: 12, gap: 9 },
  safeScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  safeScoreLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 0.6,
  },
  safeScoreTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  safeScoreFill: { height: "100%", borderRadius: 999 },
  safeScoreSub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600" as const,
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 11,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  detailsToggleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailsToggleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800" as const,
  },
  detailsBox: { gap: 10 },
  activityHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 11,
    padding: 11,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  activityHintText: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    lineHeight: 15,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  previewTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800" as const,
  },
  scoreText: { fontSize: 18, fontWeight: "900" as const },
  statsRow: { flexDirection: "row", gap: 8 },
  windowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 10,
  },
  windowLabel: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
    flex: 1,
    fontWeight: "600" as const,
  },
  windowValue: { color: "#fff", fontSize: 11, fontWeight: "700" as const },
  focusBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  focusLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  focusValue: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600" as const,
  },
  watchBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  watchRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  watchDot: { width: 7, height: 7, borderRadius: 5, marginTop: 5 },
  watchName: { color: "#fff", fontSize: 12, fontWeight: "800" as const },
  watchReason: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 1,
  },
  emptyText: { color: "rgba(255,255,255,0.72)", fontSize: 11, lineHeight: 16 },
  scheduleBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 12,
    gap: 7,
  },
  scheduleTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  scheduleDot: { width: 7, height: 7, borderRadius: 7, marginTop: 5 },
  recommendationBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 12,
    gap: 7,
  },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  bulletText: {
    flex: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    lineHeight: 16,
  },
  reasonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 12,
  },
  reasonText: {
    flex: 1,
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    lineHeight: 17,
  },
  scheduleLaterBox: { gap: 7 },
  scheduleLaterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  scheduleLaterBtnActive: {
    borderColor: "rgba(255,255,255,0.48)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  scheduleLaterText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  btnRow: { flexDirection: "row", gap: 8 },
  applyBtn: {
    flex: 1.4,
    flexDirection: "row",
    gap: 7,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" as const },
  adjustBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 7,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  adjustBtnText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600" as const,
  },
});
