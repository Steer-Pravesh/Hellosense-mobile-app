import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { useColors } from '@/hooks/useColors';

function NativeAcademyTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <Label>Overview</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="athletes">
        <Icon sf={{ default: 'person.3', selected: 'person.3.fill' }} />
        <Label>Athletes</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="coaches">
        <Icon sf={{ default: 'person.badge.shield.checkmark', selected: 'person.badge.shield.checkmark.fill' }} />
        <Label>Coaches</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reports">
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Reports</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicAcademyTabs() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

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
          isIOS ? <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : null,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Overview', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="chart.bar" tintColor={color} size={22} /> : <Feather name="bar-chart-2" size={22} color={color} /> }} />
      <Tabs.Screen name="athletes" options={{ title: 'Athletes', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.3" tintColor={color} size={22} /> : <Feather name="users" size={22} color={color} /> }} />
      <Tabs.Screen name="coaches" options={{ title: 'Coaches', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.badge.shield.checkmark" tintColor={color} size={22} /> : <Feather name="user-check" size={22} color={color} /> }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="doc.text" tintColor={color} size={22} /> : <Feather name="file-text" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function AcademyLayout() {
  if (isLiquidGlassAvailable()) return <NativeAcademyTabs />;
  return <ClassicAcademyTabs />;
}
