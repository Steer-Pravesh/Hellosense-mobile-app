import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { useColors } from '@/hooks/useColors';

function NativeParentTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>My Child</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="subscription">
        <Icon sf={{ default: 'creditcard', selected: 'creditcard.fill' }} />
        <Label>Subscription</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicParentTabs() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.recovery,
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Child',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house" tintColor={color} size={22} /> : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Subscription',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="creditcard" tintColor={color} size={22} /> : <Feather name="credit-card" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function ParentLayout() {
  if (isLiquidGlassAvailable()) return <NativeParentTabs />;
  return <ClassicParentTabs />;
}
