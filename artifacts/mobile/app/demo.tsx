import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DemoBooking, useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type Step = 'form' | 'slots' | 'summary' | 'confirmed';

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
const SPORTS = ['Football', 'Cricket', 'Athletics', 'Badminton', 'Basketball', 'Tennis', 'Swimming', 'Volleyball', 'Other'];

function getDates() {
  const dates: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    if (d.getDay() !== 0) dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function generateBookingRef() {
  return 'HS-' + Date.now().toString(36).toUpperCase().slice(-6);
}

export default function DemoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setDemoBooking } = useApp();

  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({
    fullName: '', academyName: '', role: '', phone: '', email: '',
    city: '', athleteCount: '', coachCount: '', sports: '', requirements: '',
  });
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dates = getDates();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.academyName.trim()) e.academyName = 'Required';
    if (!form.role.trim()) e.role = 'Required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit Indian mobile number';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter valid email';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.athleteCount.trim()) e.athleteCount = 'Required';
    if (!form.coachCount.trim()) e.coachCount = 'Required';
    if (selectedSports.length === 0) e.sports = 'Select at least one sport';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFormNext = () => {
    if (!validate()) return;
    setStep('slots');
  };

  const handleSlotNext = () => {
    if (!selectedDate || !selectedSlot) return;
    setStep('summary');
  };

  const handleConfirm = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const ref = generateBookingRef();
    setBookingRef(ref);
    const booking: DemoBooking = {
      id: ref,
      fullName: form.fullName,
      academyName: form.academyName,
      role: form.role,
      phone: form.phone,
      email: form.email,
      city: form.city,
      athleteCount: form.athleteCount,
      coachCount: form.coachCount,
      sports: selectedSports.join(', '),
      demoDate: selectedDate,
      timeSlot: selectedSlot,
      requirements: form.requirements,
      confirmedAt: new Date().toISOString(),
    };
    setDemoBooking(booking);
    setStep('confirmed');
  };

  const renderInput = (key: keyof typeof form, placeholder: string, props?: any) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{placeholder}</Text>
      <TextInput
        style={[styles.input, { borderColor: errors[key] ? colors.critical : colors.border, color: colors.foreground, backgroundColor: colors.input }]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={form[key]}
        onChangeText={(v) => { setForm((f) => ({ ...f, [key]: v })); if (errors[key]) setErrors((e) => { const ne = { ...e }; delete ne[key]; return ne; }); }}
        {...props}
      />
      {errors[key] && <Text style={[styles.errorText, { color: colors.critical }]}>{errors[key]}</Text>}
    </View>
  );

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) => prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]);
    if (errors.sports) setErrors((e) => { const ne = { ...e }; delete ne.sports; return ne; });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
          <Pressable onPress={() => step === 'form' ? router.back() : setStep(step === 'slots' ? 'form' : step === 'summary' ? 'slots' : 'form')} hitSlop={12}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Book a Free Demo</Text>
            <Text style={styles.headerSub}>HelioSense · Indian Standard Time (IST)</Text>
          </View>
        </View>

        {step !== 'confirmed' && (
          <View style={[styles.stepper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            {['Details', 'Select Slot', 'Confirm'].map((s, i) => {
              const stepIdx = step === 'form' ? 0 : step === 'slots' ? 1 : 2;
              const done = i < stepIdx;
              const active = i === stepIdx;
              return (
                <React.Fragment key={s}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepDot, { backgroundColor: done || active ? colors.primary : colors.border }]}>
                      {done ? <Feather name="check" size={10} color="#fff" /> : <Text style={styles.stepNum}>{i + 1}</Text>}
                    </View>
                    <Text style={[styles.stepLabel, { color: active ? colors.primary : colors.mutedForeground }]}>{s}</Text>
                  </View>
                  {i < 2 && <View style={[styles.stepLine, { backgroundColor: done ? colors.primary : colors.border }]} />}
                </React.Fragment>
              );
            })}
          </View>
        )}

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 24) + 16 }} showsVerticalScrollIndicator={false}>
          {step === 'form' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.nav }]}>Academy & Representative Details</Text>
              {renderInput('fullName', 'Full Name')}
              {renderInput('academyName', 'Academy Name')}
              {renderInput('role', 'Your Role (e.g. Director, Coach)')}
              {renderInput('phone', 'Phone Number', { keyboardType: 'phone-pad', maxLength: 10 })}
              {renderInput('email', 'Email Address', { keyboardType: 'email-address', autoCapitalize: 'none' })}
              {renderInput('city', 'City')}
              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  {renderInput('athleteCount', 'No. of Athletes', { keyboardType: 'number-pad' })}
                </View>
                <View style={{ flex: 1 }}>
                  {renderInput('coachCount', 'No. of Coaches', { keyboardType: 'number-pad' })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Sports Offered</Text>
                <View style={styles.sportsGrid}>
                  {SPORTS.map((sport) => {
                    const selected = selectedSports.includes(sport);
                    return (
                      <Pressable key={sport} style={[styles.sportChip, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]} onPress={() => toggleSport(sport)}>
                        <Text style={[styles.sportChipText, { color: selected ? '#fff' : colors.foreground }]}>{sport}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.sports && <Text style={[styles.errorText, { color: colors.critical }]}>{errors.sports}</Text>}
              </View>

              {renderInput('requirements', 'Additional Requirements (optional)', { multiline: true, numberOfLines: 3 })}

              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleFormNext}>
                <Text style={styles.primaryBtnText}>Continue to Slot Selection</Text>
                <Feather name="arrow-right" size={16} color="#fff" />
              </Pressable>
            </View>
          )}

          {step === 'slots' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.nav }]}>Select Demo Date</Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Available slots for the next 14 days (IST)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {dates.map((date) => {
                  const d = new Date(date);
                  const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
                  const num = d.getDate();
                  const month = d.toLocaleDateString('en-IN', { month: 'short' });
                  const active = selectedDate === date;
                  return (
                    <Pressable key={date} style={[styles.dateCard, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]} onPress={() => setSelectedDate(date)}>
                      <Text style={[styles.dateDay, { color: active ? 'rgba(255,255,255,0.75)' : colors.mutedForeground }]}>{day}</Text>
                      <Text style={[styles.dateNum, { color: active ? '#fff' : colors.foreground }]}>{num}</Text>
                      <Text style={[styles.dateMonth, { color: active ? 'rgba(255,255,255,0.75)' : colors.mutedForeground }]}>{month}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {selectedDate && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.nav, marginTop: 8 }]}>Select Time Slot</Text>
                  <View style={styles.slotsGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const active = selectedSlot === slot;
                      return (
                        <Pressable key={slot} style={[styles.slotBtn, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]} onPress={() => setSelectedSlot(slot)}>
                          <Feather name="clock" size={13} color={active ? 'rgba(255,255,255,0.8)' : colors.mutedForeground} />
                          <Text style={[styles.slotText, { color: active ? '#fff' : colors.foreground }]}>{slot}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <Pressable style={[styles.primaryBtn, { backgroundColor: selectedDate && selectedSlot ? colors.primary : colors.muted }]} onPress={handleSlotNext} disabled={!selectedDate || !selectedSlot}>
                <Text style={[styles.primaryBtnText, { color: selectedDate && selectedSlot ? '#fff' : colors.mutedForeground }]}>Review Booking Summary</Text>
                <Feather name="arrow-right" size={16} color={selectedDate && selectedSlot ? '#fff' : colors.mutedForeground} />
              </Pressable>
            </View>
          )}

          {step === 'summary' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.nav }]}>Booking Summary</Text>
              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[
                  { label: 'Name', value: form.fullName },
                  { label: 'Academy', value: form.academyName },
                  { label: 'Role', value: form.role },
                  { label: 'Phone', value: form.phone },
                  { label: 'Email', value: form.email },
                  { label: 'City', value: form.city },
                  { label: 'Athletes', value: form.athleteCount },
                  { label: 'Coaches', value: form.coachCount },
                  { label: 'Sports', value: selectedSports.join(', ') },
                  { label: 'Demo Date', value: formatDate(selectedDate) },
                  { label: 'Time Slot', value: `${selectedSlot} IST` },
                  ...(form.requirements ? [{ label: 'Requirements', value: form.requirements }] : []),
                ].map((row) => (
                  <View key={row.label} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.summaryValue, { color: colors.foreground }]}>{row.value}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.demoBanner, { backgroundColor: colors.cautionLight }]}>
                <Feather name="info" size={13} color={colors.caution} />
                <Text style={[styles.demoBannerText, { color: colors.cautionFg }]}>Demo data — no backend connected. Booking is stored locally.</Text>
              </View>
              <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleConfirm}>
                <Feather name="check-circle" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>Confirm Demo Booking</Text>
              </Pressable>
            </View>
          )}

          {step === 'confirmed' && (
            <View style={styles.section}>
              <View style={[styles.successIcon, { backgroundColor: colors.safeLight }]}>
                <Feather name="calendar" size={36} color={colors.safe} />
              </View>
              <Text style={[styles.confirmedTitle, { color: colors.foreground }]}>Demo Confirmed!</Text>
              <Text style={[styles.confirmedSub, { color: colors.mutedForeground }]}>
                Your demo has been booked. The HelioSense team will reach out to confirm.
              </Text>
              <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[
                  { label: 'Booking Ref', value: bookingRef },
                  { label: 'Academy', value: form.academyName },
                  { label: 'Demo Date', value: formatDate(selectedDate) },
                  { label: 'Time', value: `${selectedSlot} IST` },
                  { label: 'Contact', value: form.phone },
                  { label: 'Meeting Format', value: 'Online (Video Call)' },
                  { label: 'Next Step', value: 'HelioSense team will confirm via call/email within 24 hours.' },
                ].map((row) => (
                  <View key={row.label} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.summaryValue, { color: colors.foreground, flex: 1, textAlign: 'right' }]}>{row.value}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.actionBtns}>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.recovery }]}
                  onPress={() => {
                    const msg = encodeURIComponent(`Hello HelioSense, I have booked a product demo for ${form.academyName} on ${formatDate(selectedDate)} at ${selectedSlot} IST. My name is ${form.fullName}, and my contact number is ${form.phone}. Please confirm the booking. Booking Ref: ${bookingRef}`);
                    const url = `https://wa.me/[Official HelioSense WhatsApp Number]?text=${msg}`;
                  }}>
                  <Feather name="message-circle" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>Send on WhatsApp</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => router.replace('/')}>
                  <Feather name="home" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>Back to Home</Text>
                </Pressable>
              </View>
              <View style={[styles.support, { borderColor: colors.border }]}>
                <Feather name="mail" size={13} color={colors.mutedForeground} />
                <Text style={[styles.supportText, { color: colors.mutedForeground }]}>
                  HelioSense Support: [Official HelioSense Email]
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' as const },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: '#fff', fontSize: 11, fontWeight: '700' as const },
  stepLabel: { fontSize: 10, fontWeight: '600' as const },
  stepLine: { flex: 1, height: 1, marginHorizontal: 6 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700' as const },
  sectionSub: { fontSize: 12, marginTop: -8 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  errorText: { fontSize: 11 },
  row2: { flexDirection: 'row', gap: 10 },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  sportChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  sportChipText: { fontSize: 13, fontWeight: '500' as const },
  primaryBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 15, marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
  dateScroll: { marginHorizontal: -4 },
  dateCard: { width: 62, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 14, borderWidth: 1.5, gap: 2 },
  dateDay: { fontSize: 10, fontWeight: '600' as const },
  dateNum: { fontSize: 20, fontWeight: '800' as const },
  dateMonth: { fontSize: 10, fontWeight: '600' as const },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  slotText: { fontSize: 13, fontWeight: '600' as const },
  summaryCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  summaryLabel: { fontSize: 12, minWidth: 70 },
  summaryValue: { fontSize: 13, fontWeight: '600' as const, flex: 1, textAlign: 'right' },
  demoBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 10, padding: 10 },
  demoBannerText: { fontSize: 12, flex: 1 },
  successIcon: { alignSelf: 'center', padding: 24, borderRadius: 50 },
  confirmedTitle: { fontSize: 24, fontWeight: '800' as const, textAlign: 'center' },
  confirmedSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  actionBtns: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' as const },
  support: { flexDirection: 'row', gap: 8, alignItems: 'center', borderTopWidth: 1, paddingTop: 14 },
  supportText: { fontSize: 12 },
});
