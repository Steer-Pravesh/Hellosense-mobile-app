import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

function NativeCoachTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'person.3', selected: 'person.3.fill' }} />
        <Label>Athletes</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="session">
        <Icon sf={{ default: 'play.circle', selected: 'play.circle.fill' }} />
        <Label>Session</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <Icon sf={{ default: 'bell', selected: 'bell.fill' }} />
        <Label>Alerts</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
        <Label>History</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicCoachTabs() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const { getAlertsCountForCoach, activeCoachId } = useApp();
  const alertsCount = getAlertsCountForCoach(activeCoachId);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Athletes',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.3" tintColor={color} size={22} /> : <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Session',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="play.circle" tintColor={color} size={22} /> : <Feather name="play-circle" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarBadge: alertsCount > 0 ? alertsCount : undefined,
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="bell" tintColor={color} size={22} /> : <Feather name="bell" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="clock" tintColor={color} size={22} /> : <Feather name="clock" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function CoachLayout() {
  if (isLiquidGlassAvailable()) return <NativeCoachTabs />;
  return <ClassicCoachTabs />;
}