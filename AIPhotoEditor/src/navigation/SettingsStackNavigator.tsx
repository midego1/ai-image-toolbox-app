import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import AppearanceSettingsScreen from '../screens/AppearanceSettingsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ToolMockupScreen from '../screens/ToolMockupScreen';
import RemoveBackgroundMockupDetailScreen from '../screens/RemoveBackgroundMockupDetailScreen';
import { SettingsStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<SettingsStackParamList>();
const Navigator: any = (Stack as any).Navigator;

export const SettingsStackNavigator = () => {
  return (
    <Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
      }}
      initialRouteName="SettingsMain"
    >
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="LanguageSelection" 
        component={LanguageSelectionScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Subscription" 
        component={SubscriptionScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="AppearanceSettings" 
        component={AppearanceSettingsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ToolMockup"
        component={ToolMockupScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="RemoveBackgroundMockupDetail"
        component={RemoveBackgroundMockupDetailScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </Navigator>
  );
};

