import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface RoleCard {
  id: 'coach' | 'academy' | 'parent';
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  color: string;
}

export default function RoleSelectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setRole } = useApp();

  const roles: RoleCard[] = [
    {
      id: 'coach',
      title: 'Coach',
      subtitle: 'Monitor & respond to athlete risk',
      icon: 'users',
      description: 'View live athlete status, receive critical alerts, manage sessions and hydration.',
      color: colors.primary,
    },
    {
      id: 'academy',
      title: 'Academy Owner',
      subtitle: 'Academy-wide safety overview',
      icon: 'activity',
      description: 'See all athletes and coaches, academy analytics, safety incidents and parent subscriptions.',
      color: colors.secondary,
    },
    {
      id: 'parent',
      title: 'Parent',
      subtitle: "Your child's real-time session updates",
      icon: 'heart',
      description: 'Track your child\'s session, hydration, rest actions and safety alerts.',
      color: colors.recovery,
    },
  ];

  const handleSelect = (role: RoleCard) => {
    setRole(role.id);
    router.push(`/${role.id}` as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.nav, { backgroundColor: colors.nav, paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <View style={styles.navInner}>
          <View style={styles.logoRow}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.logoText}>HelioSense</Text>
              <Text style={styles.logoTagline}>Athlete Safety Platform</Text>
            </View>
          </View>
          <Pressable
            style={styles.demoBtn}
            onPress={() => router.push('/demo' as any)}
          >
            <Text style={styles.demoBtnText}>Book Demo</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accent + '22' }]}>
            <Feather name="shield" size={12} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>DEMO DATA · Interface Preview</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.nav }]}>
            Protect Every Athlete.{'\n'}Before Risk Becomes an Emergency.
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            HelioSense helps sports academies monitor athlete activity, UV exposure, heat risk, hydration needs, training intensity, and real-time safety alerts.
          </Text>

          <View style={styles.statsRow}>
            <StatBlock value="8" label="Athletes" color={colors.primary} icon="users" />
            <StatBlock value="2" label="Active Sessions" color={colors.safe} icon="activity" />
            <StatBlock value="1" label="Critical Alert" color={colors.critical} icon="alert-octagon" />
            <StatBlock value="7.2" label="UV Index" color={colors.caution} icon="sun" />
          </View>
        </View>

        <View style={styles.rolesSection}>
          <Text style={[styles.rolesSectionTitle, { color: colors.nav }]}>Select your role to continue</Text>
          {roles.map((role) => (
            <Pressable
              key={role.id}
              style={({ pressed }) => [
                styles.roleCard,
                { backgroundColor: colors.card, borderColor: role.color + '33', opacity: pressed ? 0.92 : 1 },
              ]}
              onPress={() => handleSelect(role)}
            >
              <View style={[styles.roleIconBox, { backgroundColor: role.color + '15' }]}>
                <Feather name={role.icon as any} size={26} color={role.color} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={[styles.roleTitle, { color: colors.foreground }]}>{role.title}</Text>
                <Text style={[styles.roleSub, { color: role.color }]}>{role.subtitle}</Text>
                <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{role.description}</Text>
              </View>
              <Feather name="arrow-right" size={18} color={role.color} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.trustSection, { backgroundColor: colors.nav }]}>
          <Text style={styles.trustTitle}>Built to Help Coaches Respond Before Athlete Risk Escalates.</Text>
          <View style={styles.trustGrid}>
            {[
              'Real-time athlete status monitoring',
              'UV and heat-risk awareness',
              'Hydration and recovery tracking',
              'Confirmable coach actions',
              'Parent session updates',
              'Recorded incident history',
            ].map((item) => (
              <View key={item} style={styles.trustItem}>
                <Feather name="check" size={13} color={colors.accent} />
                <Text style={styles.trustItemText}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.disclaimer, { borderTopColor: 'rgba(255,255,255,0.12)' }]}>
            <Text style={styles.disclaimerText}>
              HelioSense is an athlete-safety and decision-support platform. It does not replace professional medical assessment, emergency services, or qualified supervision.
            </Text>
          </View>
        </View>

        <View style={styles.demoSection}>
          <Text style={[styles.demoTitle, { color: colors.nav }]}>Ready to see HelioSense in action?</Text>
          <Text style={[styles.demoSub, { color: colors.mutedForeground }]}>Book a free demo with our team. Select an available slot for the next 14 days.</Text>
          <Pressable
            style={[styles.demoLargeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/demo' as any)}
          >
            <Feather name="calendar" size={16} color="#fff" />
            <Text style={styles.demoLargeBtnText}>Book a Free Demo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function StatBlock({ value, label, color, icon }: { value: string; label: string; color: string; icon: string }) {
  const colors = useColors();
  return (
    <View style={[sbStyles.block, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon as any} size={14} color={color} />
      <Text style={[sbStyles.value, { color }]}>{value}</Text>
      <Text style={[sbStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const sbStyles = StyleSheet.create({
  block: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, gap: 3 },
  value: { fontSize: 18, fontWeight: '800' as const },
  label: { fontSize: 10, fontWeight: '500' as const, textAlign: 'center' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: { paddingBottom: 12 },
  navInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 36, height: 36, borderRadius: 10 },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.3 },
  logoTagline: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '500' as const },
  demoBtn: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  demoBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' as const },
  scroll: { gap: 0 },
  heroSection: { padding: 20, gap: 14 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontWeight: '800' as const, lineHeight: 31, letterSpacing: -0.4 },
  heroSub: { fontSize: 14, lineHeight: 21 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rolesSection: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  rolesSectionTitle: { fontSize: 16, fontWeight: '700' as const, marginBottom: 4 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#1E3D59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  roleIconBox: { width: 54, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  roleInfo: { flex: 1, gap: 2 },
  roleTitle: { fontSize: 17, fontWeight: '700' as const },
  roleSub: { fontSize: 12, fontWeight: '600' as const },
  roleDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  trustSection: { paddingHorizontal: 20, paddingVertical: 24, gap: 16, marginHorizontal: 0 },
  trustTitle: { color: '#fff', fontSize: 17, fontWeight: '700' as const, lineHeight: 23 },
  trustGrid: { gap: 10 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustItemText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  disclaimer: { borderTopWidth: 1, paddingTop: 14, marginTop: 4 },
  disclaimerText: { color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 17 },
  demoSection: { padding: 20, gap: 10, alignItems: 'center' },
  demoTitle: { fontSize: 18, fontWeight: '700' as const, textAlign: 'center' },
  demoSub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  demoLargeBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 15, marginTop: 6 },
  demoLargeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
});
