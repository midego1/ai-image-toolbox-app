import React from 'react';
import { Platform } from 'react-native';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { useTheme } from '../theme/ThemeProvider';
import { TabParamList } from '../types/navigation';
import { FeaturesStackNavigator } from './FeaturesStackNavigator';
import { HistoryStackNavigator } from './HistoryStackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';

const Tab = createNativeBottomTabNavigator<TabParamList>();

export const BottomTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          ...(Platform.OS === 'ios' && {
            shadowColor: '#000',
          }),
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.scaled.xs,
          fontWeight: '500',
        },
        ...(Platform.OS === 'ios' && {
          tabBarBlurEffect: 'systemMaterial',
        }),
      }}
    >
      <Tab.Screen
        name="Features"
        component={FeaturesStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Tools',
          ...(Platform.OS === 'ios' && {
            tabBarSystemItem: 'featured',
          }),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackNavigator}
        options={{
          headerShown: false,
          ...(Platform.OS === 'ios' && {
            // System item provides both icon and label ('Recents')
            tabBarSystemItem: 'recents',
          }),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          headerShown: false,
          ...(Platform.OS === 'ios' && {
            // System item provides both icon and label ('More')
            tabBarSystemItem: 'more',
          }),
        }}
      />
    </Tab.Navigator>
  );
};
