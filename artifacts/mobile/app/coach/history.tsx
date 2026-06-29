import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafetyAlert, SessionHistory, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const COACH_ID = 'c1';

export default function CoachHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessionHistory, getAlertsForCoach } = useApp();

  const alertHistory = getAlertsForCoach(COACH_ID).filter(
    (alert) => alert.actions.length > 0
  );

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
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>
          {sessionHistory.length} sessions · {alertHistory.length} safety events
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.nav }]}>
          SAFETY ACTION HISTORY
        </Text>

        {alertHistory.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="shield" size={30} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No coach safety actions recorded yet
            </Text>
          </View>
        ) : (
          alertHistory.map((alert) => (
            <AlertHistoryCard key={alert.id} alert={alert} colors={colors} />
          ))
        )}

        <Text style={[styles.sectionTitle, { color: colors.nav, marginTop: 10 }]}>
          SESSION HISTORY
        </Text>

        {sessionHistory.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="clock" size={30} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No sessions recorded yet
            </Text>
          </View>
        ) : (
          sessionHistory.map((session) => (
            <SessionCard key={session.id} session={session} colors={colors} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function AlertHistoryCard({ alert, colors }: { alert: SafetyAlert; colors: any }) {
  const statusColor =
    alert.status === 'resolved'
      ? colors.safe
      : alert.status === 'ignored'
        ? colors.mutedForeground
        : alert.status === 'snoozed'
          ? colors.caution
          : colors.recovery;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: `${statusColor}55`,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {alert.title}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {new Date(alert.createdAt).toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {alert.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[styles.summaryBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>
          ATHLETES
        </Text>
        <Text style={[styles.summaryText, { color: colors.foreground }]}>
          {alert.athleteNames.join(', ')}
        </Text>
      </View>

      <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>
        ACTION TIMELINE
      </Text>

      {alert.actions.map((action, index) => (
        <View key={action.id} style={styles.timelineRow}>
          <View style={styles.timelineMarkerWrap}>
            <View style={[styles.timelineDot, { backgroundColor: statusColor }]} />
            {index < alert.actions.length - 1 && (
              <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
            )}
          </View>

          <View style={{ flex: 1, paddingBottom: 10 }}>
            <Text style={[styles.timelineTitle, { color: colors.foreground }]}>
              {action.label}
            </Text>
            <Text style={[styles.timelineMeta, { color: colors.mutedForeground }]}>
              {action.coachName} · {new Date(action.timestamp).toLocaleString('en-IN')}
            </Text>
            {!!action.note && (
              <Text style={[styles.timelineNote, { color: colors.mutedForeground }]}>
                {action.note}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function SessionCard({
  session,
  colors,
}: {
  session: SessionHistory;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {session.athleteName}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {session.sport} · {session.coachName}
          </Text>
        </View>

        <View
          style={[
            styles.incidentBadge,
            {
              backgroundColor:
                session.safetyIncidents > 0
                  ? colors.cautionLight
                  : colors.safeLight,
            },
          ]}
        >
          <Feather
            name={session.safetyIncidents > 0 ? 'alert-triangle' : 'check'}
            size={12}
            color={
              session.safetyIncidents > 0 ? colors.caution : colors.safe
            }
          />
          <Text
            style={[
              styles.incidentText,
              {
                color:
                  session.safetyIncidents > 0
                    ? colors.cautionFg
                    : colors.safeFg,
              },
            ]}
          >
            {session.safetyIncidents} incident
            {session.safetyIncidents !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.cardStats}>
        <StatItem
          icon="calendar"
          label="Date"
          value={new Date(session.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
          colors={colors}
        />
        <StatItem
          icon="clock"
          label="Duration"
          value={`${session.duration} min`}
          colors={colors}
        />
      </View>

      <View style={[styles.summaryBox, { backgroundColor: colors.background }]}>
        <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
          {session.summary}
        </Text>
      </View>
    </View>
  );
}

function StatItem({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.statItem}>
      <Feather name={icon as any} size={13} color={colors.mutedForeground} />
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}:
      </Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 14 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 9, fontWeight: '800' },
  incidentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  incidentText: { fontSize: 11, fontWeight: '600' },
  cardStats: { flexDirection: 'row', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 12, fontWeight: '600' },
  summaryBox: { borderRadius: 10, padding: 10 },
  summaryText: { fontSize: 12, lineHeight: 18 },
  smallLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  timelineRow: { flexDirection: 'row', gap: 9 },
  timelineMarkerWrap: { width: 12, alignItems: 'center' },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  timelineLine: { width: 1, flex: 1, marginTop: 3 },
  timelineTitle: { fontSize: 12, fontWeight: '700' },
  timelineMeta: { fontSize: 9, marginTop: 2 },
  timelineNote: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 9 },
  emptyText: { fontSize: 13, textAlign: 'center' },
});
