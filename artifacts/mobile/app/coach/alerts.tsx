import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CriticalAlertModal } from '@/components/CriticalAlertModal';
import { RiskBadge } from '@/components/RiskBadge';
import { Athlete, SafetyAlert, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const COACH_ID = 'c1';

export default function CoachAlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes, getAlertsForCoach } = useApp();
  const [alertAthlete, setAlertAthlete] = useState<Athlete | null>(null);

  const myAthletes = athletes.filter((athlete) => athlete.coachId === COACH_ID);
  const systemAlerts = getAlertsForCoach(COACH_ID);
  const liveRiskAthletes = myAthletes.filter(
    (athlete) =>
      athlete.safetyLevel === 'critical' || athlete.safetyLevel === 'caution'
  );

  const activeSystemAlerts = systemAlerts.filter((alert) =>
    ['active', 'snoozed', 'hydrating'].includes(alert.status)
  );

  const resolvedSystemAlerts = systemAlerts.filter((alert) =>
    ['resolved', 'ignored'].includes(alert.status)
  );

  const totalActive = activeSystemAlerts.length + liveRiskAthletes.length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.nav,
            paddingTop: Platform.OS === 'web' ? 67 : insets.top,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Risk Alerts</Text>
        <Text style={styles.headerSub}>
          {totalActive} active · {resolvedSystemAlerts.length} handled
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        {activeSystemAlerts.length > 0 && (
          <>
            <SectionTitle
              title="AI SAFETY ALERTS"
              count={activeSystemAlerts.length}
              colors={colors}
            />

            {activeSystemAlerts.map((alert) => (
              <SystemAlertCard key={alert.id} alert={alert} colors={colors} />
            ))}
          </>
        )}

        {liveRiskAthletes.length > 0 && (
          <>
            <SectionTitle
              title="LIVE ATHLETE RISKS"
              count={liveRiskAthletes.length}
              colors={colors}
            />

            {liveRiskAthletes.map((athlete) => (
              <Pressable
                key={athlete.id}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      athlete.safetyLevel === 'critical'
                        ? colors.critical
                        : colors.caution,
                    borderWidth: athlete.safetyLevel === 'critical' ? 2 : 1,
                  },
                ]}
                onPress={() => setAlertAthlete(athlete)}
              >
                <View style={styles.alertTop}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor:
                          athlete.safetyLevel === 'critical'
                            ? colors.criticalLight
                            : colors.cautionLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.avatarText,
                        {
                          color:
                            athlete.safetyLevel === 'critical'
                              ? colors.critical
                              : colors.caution,
                        },
                      ]}
                    >
                      {athlete.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)}
                    </Text>
                  </View>

                  <View style={styles.alertInfo}>
                    <Text style={[styles.alertName, { color: colors.foreground }]}>
                      {athlete.name}
                    </Text>
                    <Text
                      style={[
                        styles.alertStatus,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {athlete.sport} · {athlete.trainingDuration} min
                    </Text>
                  </View>

                  <RiskBadge level={athlete.safetyLevel} small />
                </View>

                <View style={styles.alertStats}>
                  <AlertStat
                    label="BMI"
                    value={athlete.bodyMetrics.bmi.toString()}
                    color={colors.primary}
                  />
                  <AlertStat
                    label="Body fat"
                    value={`${athlete.bodyMetrics.bodyFatPercent}%`}
                    color={colors.primary}
                  />
                  <AlertStat
                    label="Recovery"
                    value={athlete.bodyMetrics.recoveryScore.toString()}
                    color={
                      athlete.bodyMetrics.recoveryScore < 70
                        ? colors.caution
                        : colors.safe
                    }
                  />
                  <AlertStat
                    label="Fatigue"
                    value={athlete.bodyMetrics.fatigueScore.toString()}
                    color={
                      athlete.bodyMetrics.fatigueScore >= 50
                        ? colors.caution
                        : colors.safe
                    }
                  />
                </View>

                <View style={styles.alertStats}>
                  <AlertStat
                    label="Resting HR"
                    value={`${athlete.bodyMetrics.restingHeartRate}`}
                    color={colors.foreground}
                  />
                  <AlertStat
                    label="UV"
                    value={athlete.uvExposure.toFixed(1)}
                    color={athlete.uvExposure >= 6 ? colors.critical : colors.caution}
                  />
                  <AlertStat
                    label="Heat"
                    value={athlete.heatRisk.toUpperCase()}
                    color={
                      athlete.heatRisk === 'extreme'
                        ? colors.critical
                        : colors.caution
                    }
                  />
                  <AlertStat
                    label="H₂O"
                    value={athlete.hydrationStatus.toUpperCase()}
                    color={
                      athlete.hydrationStatus === 'critical'
                        ? colors.critical
                        : colors.caution
                    }
                  />
                </View>

                <Pressable
                  style={[
                    styles.respondBtn,
                    {
                      backgroundColor:
                        athlete.safetyLevel === 'critical'
                          ? colors.critical
                          : colors.caution,
                    },
                  ]}
                  onPress={() => setAlertAthlete(athlete)}
                >
                  <Feather name="zap" size={14} color="#fff" />
                  <Text style={styles.respondBtnText}>Take Action</Text>
                </Pressable>
              </Pressable>
            ))}
          </>
        )}

        {resolvedSystemAlerts.length > 0 && (
          <>
            <SectionTitle
              title="RECENTLY HANDLED"
              count={resolvedSystemAlerts.length}
              colors={colors}
            />

            {resolvedSystemAlerts.slice(0, 8).map((alert) => (
              <SystemAlertCard key={alert.id} alert={alert} colors={colors} />
            ))}
          </>
        )}

        {systemAlerts.length === 0 && liveRiskAthletes.length === 0 && (
          <View style={styles.allClear}>
            <View
              style={[styles.allClearIcon, { backgroundColor: colors.safeLight }]}
            >
              <Feather name="check-circle" size={40} color={colors.safe} />
            </View>
            <Text style={[styles.allClearTitle, { color: colors.foreground }]}>
              All Clear
            </Text>
            <Text style={[styles.allClearSub, { color: colors.mutedForeground }]}>
              No safety alerts for your athletes right now.
            </Text>
          </View>
        )}
      </ScrollView>

      <CriticalAlertModal
        athlete={alertAthlete}
        visible={!!alertAthlete}
        onClose={() => setAlertAthlete(null)}
      />
    </View>
  );
}

function SystemAlertCard({ alert, colors }: { alert: SafetyAlert; colors: any }) {
  const statusColors: Record<string, string> = {
    active: colors.critical,
    snoozed: colors.caution,
    hydrating: colors.recovery,
    resolved: colors.safe,
    ignored: colors.mutedForeground,
  };

  const statusColor = statusColors[alert.status] ?? colors.mutedForeground;
  const latestAction = alert.actions[0];

  return (
    <View
      style={[
        styles.systemCard,
        {
          backgroundColor: colors.card,
          borderColor: `${statusColor}66`,
        },
      ]}
    >
      <View style={styles.systemCardTop}>
        <View
          style={[
            styles.systemIcon,
            {
              backgroundColor:
                alert.type === 'hydration_required'
                  ? colors.recoveryLight
                  : colors.cautionLight,
            },
          ]}
        >
          <Feather
            name={alert.type === 'hydration_required' ? 'droplet' : 'alert-triangle'}
            size={18}
            color={
              alert.type === 'hydration_required' ? colors.recovery : colors.caution
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.systemTitle, { color: colors.foreground }]}>
            {alert.title}
          </Text>
          <Text style={[styles.systemTime, { color: colors.mutedForeground }]}>
            {new Date(alert.createdAt).toLocaleString('en-IN')}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusColor}18` },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {alert.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.systemMessage, { color: colors.foreground }]}>
        {alert.message}
      </Text>

      <Text style={[styles.systemReason, { color: colors.mutedForeground }]}>
        {alert.reason}
      </Text>

      <View style={[styles.athleteNamesBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.athleteNamesLabel, { color: colors.mutedForeground }]}>
          Affected athletes
        </Text>
        <Text style={[styles.athleteNames, { color: colors.foreground }]}>
          {alert.athleteNames.join(', ')}
        </Text>
      </View>

      {alert.status === 'snoozed' && alert.nextReminderAt && (
        <View style={styles.inlineRow}>
          <Feather name="clock" size={13} color={colors.caution} />
          <Text style={[styles.inlineText, { color: colors.caution }]}>
            Reminder at {new Date(alert.nextReminderAt).toLocaleTimeString()}
          </Text>
        </View>
      )}

      {latestAction && (
        <View style={styles.inlineRow}>
          <Feather name="check-circle" size={13} color={statusColor} />
          <Text style={[styles.inlineText, { color: colors.mutedForeground }]}>
            Latest action: {latestAction.label} · {latestAction.coachName}
          </Text>
        </View>
      )}
    </View>
  );
}

function SectionTitle({
  title,
  count,
  colors,
}: {
  title: string;
  count: number;
  colors: any;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.nav }]}>{title}</Text>
      <View style={[styles.countBadge, { backgroundColor: colors.primary + '16' }]}>
        <Text style={[styles.countText, { color: colors.primary }]}>{count}</Text>
      </View>
    </View>
  );
}

function AlertStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors = useColors();

  return (
    <View style={[asStyles.box, { backgroundColor: colors.background }]}>
      <Text style={[asStyles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[asStyles.value, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const asStyles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 7 },
  label: { fontSize: 8, fontWeight: '600', letterSpacing: 0.2 },
  value: { fontSize: 11, fontWeight: '700', marginTop: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 14 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
    marginTop: 5,
  },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { fontSize: 10, fontWeight: '800' },
  systemCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
    gap: 10,
  },
  systemCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  systemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemTitle: { fontSize: 15, fontWeight: '700' },
  systemTime: { fontSize: 10, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5 },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  systemMessage: { fontSize: 12, lineHeight: 18 },
  systemReason: { fontSize: 11, lineHeight: 17 },
  athleteNamesBox: { borderRadius: 10, padding: 10 },
  athleteNamesLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  athleteNames: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inlineText: { flex: 1, fontSize: 10, lineHeight: 15 },
  alertCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    gap: 12,
  },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 16, fontWeight: '700' },
  alertStatus: { fontSize: 12, marginTop: 2 },
  alertStats: { flexDirection: 'row', gap: 6 },
  respondBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 11,
  },
  respondBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  allClear: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  allClearIcon: { padding: 24, borderRadius: 50 },
  allClearTitle: { fontSize: 22, fontWeight: '700' },
  allClearSub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
