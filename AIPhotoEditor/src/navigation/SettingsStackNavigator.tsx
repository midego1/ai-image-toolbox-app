import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import AppearanceSettingsScreen from '../screens/AppearanceSettingsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import ApiKeysSettingsScreen from '../screens/ApiKeysSettingsScreen';
import RevenueCatPackagesTestScreen from '../screens/RevenueCatPackagesTestScreen';
import ResultScreenMockup from '../screens/ResultScreenMockup';
import WorkflowBetaScreen from '../screens/WorkflowBetaScreen';
import ProcessingScreen from '../screens/ProcessingScreen';
import ResultScreen from '../screens/ResultScreen';
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
        name="ApiKeysSettings" 
        component={ApiKeysSettingsScreen}
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
        name="RevenueCatPackagesTest"
        component={RevenueCatPackagesTestScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ResultScreenMockup"
        component={ResultScreenMockup}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="WorkflowBeta"
        component={WorkflowBetaScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </Navigator>
  );
};

