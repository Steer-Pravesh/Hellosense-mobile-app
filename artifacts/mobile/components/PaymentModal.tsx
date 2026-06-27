import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  athleteName: string;
  parentName: string;
  onClose: () => void;
  onSuccess: (txnRef: string) => void;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking';
type PaymentStep = 'method' | 'details' | 'processing' | 'success' | 'failed';

export function PaymentModal({ visible, athleteName, parentName, onClose, onSuccess }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<PaymentStep>('method');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [failTest, setFailTest] = useState(false);

  const renewDate = new Date();
  renewDate.setMonth(renewDate.getMonth() + 1);

  const reset = () => {
    setStep('method');
    setUpiId('');
    setCardNo('');
    setExpiry('');
    setCvv('');
    setFailTest(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePay = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('processing');
    const ref = 'HS' + Date.now().toString().slice(-8).toUpperCase();
    setTxnRef(ref);
    setTimeout(() => {
      if (failTest) {
        setStep('failed');
      } else {
        setStep('success');
        onSuccess(ref);
      }
    }, 2500);
  };

  const METHODS: { id: PaymentMethod; label: string; icon: string; desc: string }[] = [
    { id: 'upi', label: 'UPI', icon: 'smartphone', desc: 'Pay via UPI ID or QR code' },
    { id: 'card', label: 'Debit / Credit Card', icon: 'credit-card', desc: 'Visa, Mastercard, RuPay' },
    { id: 'netbanking', label: 'Net Banking', icon: 'globe', desc: 'All major Indian banks' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Parent Safety Plan</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={[styles.planBanner, { backgroundColor: colors.primary + '11' }]}>
            <Text style={[styles.planAmount, { color: colors.primary }]}>₹199<Text style={styles.planPer}>/month</Text></Text>
            <View>
              <Text style={[styles.planFor, { color: colors.foreground }]}>Athlete: <Text style={{ fontWeight: '700' as const }}>{athleteName}</Text></Text>
              <Text style={[styles.planNote, { color: colors.mutedForeground }]}>Demo Payment — No real money charged.</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {step === 'method' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Payment Method</Text>
                {METHODS.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[
                      styles.methodBtn,
                      { borderColor: method === m.id ? colors.primary : colors.border, backgroundColor: method === m.id ? colors.primary + '08' : colors.card },
                    ]}
                    onPress={() => setMethod(m.id)}
                  >
                    <Feather name={m.icon as any} size={20} color={method === m.id ? colors.primary : colors.mutedForeground} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.methodLabel, { color: colors.foreground }]}>{m.label}</Text>
                      <Text style={[styles.methodDesc, { color: colors.mutedForeground }]}>{m.desc}</Text>
                    </View>
                    {method === m.id && <Feather name="check-circle" size={18} color={colors.primary} />}
                  </Pressable>
                ))}
                <View style={[styles.testRow, { borderColor: colors.border }]}>
                  <Text style={[styles.testLabel, { color: colors.mutedForeground }]}>Test failure scenario</Text>
                  <Pressable
                    style={[styles.toggle, { backgroundColor: failTest ? colors.critical : colors.muted }]}
                    onPress={() => setFailTest((f) => !f)}
                  >
                    <View style={[styles.toggleKnob, { marginLeft: failTest ? 18 : 2 }]} />
                  </Pressable>
                </View>
                <Pressable style={[styles.payBtn, { backgroundColor: colors.primary }]} onPress={() => setStep('details')}>
                  <Text style={styles.payBtnText}>Continue</Text>
                </Pressable>
              </View>
            )}

            {step === 'details' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Details</Text>
                {method === 'upi' && (
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                    placeholder="Enter UPI ID (e.g. name@upi)"
                    placeholderTextColor={colors.mutedForeground}
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                )}
                {method === 'card' && (
                  <>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                      placeholder="Card Number"
                      placeholderTextColor={colors.mutedForeground}
                      value={cardNo}
                      onChangeText={setCardNo}
                      keyboardType="number-pad"
                      maxLength={19}
                    />
                    <View style={styles.row2}>
                      <TextInput
                        style={[styles.input, styles.inputHalf, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                        placeholder="MM/YY"
                        placeholderTextColor={colors.mutedForeground}
                        value={expiry}
                        onChangeText={setExpiry}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                      <TextInput
                        style={[styles.input, styles.inputHalf, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
                        placeholder="CVV"
                        placeholderTextColor={colors.mutedForeground}
                        value={cvv}
                        onChangeText={setCvv}
                        keyboardType="number-pad"
                        maxLength={3}
                        secureTextEntry
                      />
                    </View>
                  </>
                )}
                {method === 'netbanking' && (
                  <View style={[styles.bankBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                    <Text style={[styles.bankText, { color: colors.mutedForeground }]}>
                      You will be redirected to your bank's secure portal to complete payment.
                    </Text>
                  </View>
                )}
                <View style={styles.secureRow}>
                  <Feather name="lock" size={12} color={colors.safe} />
                  <Text style={[styles.secureText, { color: colors.mutedForeground }]}>Secured by Razorpay · 256-bit SSL Encryption</Text>
                </View>
                <Pressable style={[styles.payBtn, { backgroundColor: colors.primary }]} onPress={handlePay}>
                  <Feather name="lock" size={16} color="#fff" />
                  <Text style={styles.payBtnText}>Pay ₹199</Text>
                </Pressable>
                <Pressable onPress={() => setStep('method')} style={styles.backBtn}>
                  <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>← Back</Text>
                </Pressable>
              </View>
            )}

            {step === 'processing' && (
              <View style={styles.centerSection}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.processingText, { color: colors.foreground }]}>Processing Payment…</Text>
                <Text style={[styles.processingNote, { color: colors.mutedForeground }]}>Do not close this window</Text>
              </View>
            )}

            {step === 'success' && (
              <View style={styles.section}>
                <View style={[styles.successIcon, { backgroundColor: colors.safeLight }]}>
                  <Feather name="check-circle" size={40} color={colors.safe} />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground }]}>Payment Successful</Text>
                <DetailLine label="Transaction Ref" value={txnRef} colors={colors} />
                <DetailLine label="Athlete" value={athleteName} colors={colors} />
                <DetailLine label="Parent Name" value={parentName} colors={colors} />
                <DetailLine label="Amount Paid" value="₹199.00" colors={colors} />
                <DetailLine label="Payment Method" value={method.toUpperCase()} colors={colors} />
                <DetailLine label="Start Date" value={new Date().toLocaleDateString('en-IN')} colors={colors} />
                <DetailLine label="Next Renewal" value={renewDate.toLocaleDateString('en-IN')} colors={colors} />
                <View style={[styles.demoNote, { backgroundColor: colors.cautionLight }]}>
                  <Feather name="info" size={13} color={colors.caution} />
                  <Text style={[styles.demoNoteText, { color: colors.cautionFg }]}>Demo Payment — No real money charged.</Text>
                </View>
                <Pressable style={[styles.payBtn, { backgroundColor: colors.primary }]} onPress={handleClose}>
                  <Text style={styles.payBtnText}>Go to Parent Dashboard</Text>
                </Pressable>
              </View>
            )}

            {step === 'failed' && (
              <View style={styles.section}>
                <View style={[styles.successIcon, { backgroundColor: colors.criticalLight }]}>
                  <Feather name="x-circle" size={40} color={colors.critical} />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground }]}>Payment Failed</Text>
                <Text style={[styles.failedNote, { color: colors.mutedForeground }]}>
                  Your payment could not be processed. Please try a different method or check your details.
                </Text>
                <Pressable style={[styles.payBtn, { backgroundColor: colors.primary }]} onPress={() => { setStep('method'); setFailTest(false); }}>
                  <Text style={styles.payBtnText}>Try Again</Text>
                </Pressable>
                <Pressable onPress={handleClose} style={styles.backBtn}>
                  <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailLine({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={dlStyles.row}>
      <Text style={[dlStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[dlStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const dlStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e5e5' },
  label: { fontSize: 13 },
  value: { fontSize: 13, fontWeight: '600' as const },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700' as const },
  planBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  planAmount: { fontSize: 28, fontWeight: '800' as const },
  planPer: { fontSize: 14, fontWeight: '400' as const },
  planFor: { fontSize: 13, color: '#333' },
  planNote: { fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600' as const, marginBottom: 4 },
  methodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 14, padding: 14,
  },
  methodLabel: { fontSize: 14, fontWeight: '600' as const },
  methodDesc: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 13, fontSize: 14 },
  row2: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1 },
  bankBox: { borderWidth: 1, borderRadius: 12, padding: 14 },
  bankText: { fontSize: 13, lineHeight: 20 },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  secureText: { fontSize: 11 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 15, marginTop: 4,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
  backBtn: { alignItems: 'center', paddingVertical: 8 },
  backBtnText: { fontSize: 14 },
  centerSection: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  processingText: { fontSize: 18, fontWeight: '600' as const },
  processingNote: { fontSize: 13 },
  successIcon: { alignSelf: 'center', padding: 20, borderRadius: 50, marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: '700' as const, textAlign: 'center' },
  failedNote: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  demoNote: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 10, padding: 10 },
  demoNoteText: { fontSize: 12, flex: 1 },
  testRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  testLabel: { fontSize: 13 },
  toggle: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
});
