import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentModal } from '@/components/PaymentModal';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ParentSubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes, parentAthleteId, hasParentSubscription, setHasParentSubscription } = useApp();
  const child = athletes.find((a) => a.id === parentAthleteId);
  const [showPayment, setShowPayment] = useState(false);
  const [txnRef, setTxnRef] = useState('');

  const renewDate = new Date();
  renewDate.setMonth(renewDate.getMonth() + 1);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <Text style={styles.headerTitle}>Parent Safety Plan</Text>
        <Text style={styles.headerSub}>₹199/month per athlete</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : insets.bottom) }}
        showsVerticalScrollIndicator={false}
      >
        {hasParentSubscription ? (
          <View style={[styles.activeCard, { backgroundColor: colors.safeLight, borderColor: colors.safe + '44' }]}>
            <View style={styles.activeTop}>
              <View style={[styles.activeIcon, { backgroundColor: colors.safe }]}>
                <Feather name="check-circle" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activeTitle, { color: colors.safeFg }]}>Subscription Active</Text>
                <Text style={[styles.activeSub, { color: colors.safeFg + 'AA' }]}>Plan renews {renewDate.toLocaleDateString('en-IN')}</Text>
              </View>
            </View>
            {txnRef.length > 0 && (
              <View style={[styles.txnRow, { borderTopColor: colors.safe + '33' }]}>
                <Text style={[styles.txnLabel, { color: colors.safeFg }]}>Transaction Ref</Text>
                <Text style={[styles.txnValue, { color: colors.safeFg }]}>{txnRef}</Text>
              </View>
            )}
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: colors.criticalLight, borderColor: colors.critical + '44' }]}
              onPress={() => setHasParentSubscription(false)}
            >
              <Text style={[styles.cancelBtnText, { color: colors.critical }]}>Cancel Subscription</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.planTop}>
                <View>
                  <Text style={[styles.planName, { color: colors.foreground }]}>Parent Safety Plan</Text>
                  <Text style={[styles.planPrice, { color: colors.primary }]}>₹199<Text style={styles.planPer}>/month</Text></Text>
                  <Text style={[styles.planNote, { color: colors.mutedForeground }]}>Compulsory for HelioSense-enabled academies</Text>
                </View>
                <View style={[styles.planBadge, { backgroundColor: colors.recovery + '18' }]}>
                  <Feather name="shield" size={18} color={colors.recovery} />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {[
                'Child session start and end time',
                'Hydration and rest updates',
                'Safety alerts and critical notices',
                'Session completion notifications',
                'Reduced intensity and pause alerts',
                'Basic activity summary',
              ].map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Feather name="check-circle" size={15} color={colors.recovery} />
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.athleteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.athleteLabel, { color: colors.mutedForeground }]}>Activating for athlete</Text>
              <View style={styles.athleteRow}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {child?.name.split(' ').map((n) => n[0]).join('').slice(0, 2) ?? 'AS'}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.athleteName, { color: colors.foreground }]}>{child?.name ?? 'Athlete'}</Text>
                  <Text style={[styles.athleteSport, { color: colors.mutedForeground }]}>{child?.sport ?? ''} · Age {child?.age ?? ''}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.paymentNote, { backgroundColor: colors.cautionLight, borderColor: colors.caution + '33' }]}>
              <Feather name="lock" size={13} color={colors.caution} />
              <Text style={[styles.paymentNoteText, { color: colors.cautionFg }]}>
                Payments are processed via Razorpay. Supports UPI, Debit/Credit Card, and Net Banking. Demo mode — no real money is charged.
              </Text>
            </View>

            <Pressable
              style={[styles.activateBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowPayment(true)}
            >
              <Feather name="shield" size={16} color="#fff" />
              <Text style={styles.activateBtnText}>Activate Parent Access · ₹199/month</Text>
            </Pressable>
          </>
        )}

        <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.faqTitle, { color: colors.nav }]}>About the Parent Safety Plan</Text>
          {[
            { q: 'Is the parent plan compulsory?', a: 'The Parent Safety Plan is required for athletes enrolled in HelioSense-enabled academies. This ensures all parents receive timely safety updates.' },
            { q: 'What does the plan include?', a: 'Live session status, hydration updates, rest and intensity actions, safety alerts, and session completion notifications for your child.' },
            { q: 'Can I see other athletes?', a: 'No. Parents can only view information related to their own child, based on role-based access control.' },
            { q: 'When does the plan renew?', a: 'The plan auto-renews monthly. You can cancel at any time from this screen.' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.faqItem, { borderTopColor: colors.border }]}>
              <Text style={[styles.faqQ, { color: colors.foreground }]}>{item.q}</Text>
              <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{item.a}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <PaymentModal
        visible={showPayment}
        athleteName={child?.name ?? 'Athlete'}
        parentName="Parent User"
        onClose={() => setShowPayment(false)}
        onSuccess={(ref) => {
          setTxnRef(ref);
          setHasParentSubscription(true);
          setShowPayment(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' as const, marginTop: 14 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  activeCard: { borderRadius: 18, borderWidth: 1.5, padding: 16, gap: 14 },
  activeTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  activeTitle: { fontSize: 18, fontWeight: '700' as const },
  activeSub: { fontSize: 12, marginTop: 2 },
  txnRow: { borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  txnLabel: { fontSize: 13 },
  txnValue: { fontSize: 13, fontWeight: '700' as const },
  cancelBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600' as const },
  planCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { fontSize: 17, fontWeight: '700' as const },
  planPrice: { fontSize: 28, fontWeight: '800' as const, marginTop: 4 },
  planPer: { fontSize: 14, fontWeight: '400' as const },
  planNote: { fontSize: 11, marginTop: 4 },
  planBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 13 },
  athleteCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  athleteLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
  athleteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' as const },
  athleteName: { fontSize: 15, fontWeight: '600' as const },
  athleteSport: { fontSize: 12 },
  paymentNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, padding: 12 },
  paymentNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  activateBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 15 },
  activateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
  faqCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  faqTitle: { fontSize: 15, fontWeight: '700' as const, padding: 14 },
  faqItem: { borderTopWidth: 1, padding: 14, gap: 6 },
  faqQ: { fontSize: 13, fontWeight: '600' as const },
  faqA: { fontSize: 12, lineHeight: 18 },
});
