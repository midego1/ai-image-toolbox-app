import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';
import CameraScreen from './src/screens/CameraScreen';
import ImageSelectionScreen from './src/screens/ImageSelectionScreen';
import ImagePreviewScreen from './src/screens/ImagePreviewScreen';
import GenreSelectionScreen from './src/screens/GenreSelectionScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import ResultScreen from './src/screens/ResultScreen';
import AppearanceSettingsScreen from './src/screens/AppearanceSettingsScreen';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import { SubscriptionService } from './src/services/subscriptionService';
import { AIService } from './src/services/aiService';
import { getReplicateApiKey, isApiKeyConfigured } from './src/config/apiKeys';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Initialize subscription service
    SubscriptionService.init().catch(() => {
      // Service initialization failed - continue anyway
    });
    
    // Initialize Replicate API key from config (production-ready)
    // Key is loaded from EAS Secrets or app.json extra config
    const apiKey = getReplicateApiKey();
    
    if (apiKey) {
      // Key found in config - store it securely
      AIService.setReplicateApiKey(apiKey).catch((error: any) => {
        console.error('Failed to store Replicate API key:', error);
      });
    } else {
      // Key not configured - log warning
      console.warn('⚠️ Replicate API key not configured.');
      console.warn('For development: Add to app.json extra.replicateApiKey');
      console.warn('For production: Use EAS Secrets');
    }
    
    // Verify key is set
    AIService.hasReplicateApiKey().then((hasKey: boolean) => {
      if (hasKey) {
        console.log('✅ Replicate API key loaded successfully');
      }
    });
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const AppContent = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animation: 'slide_from_right',
        }}
        initialRouteName="MainTabs"
      >
        {/* Main tabs at root level */}
        <Stack.Screen 
          name="MainTabs" 
          component={BottomTabNavigator}
          options={{ 
            headerShown: false,
            gestureEnabled: false, // Disable swipe on root tab screen
          }}
        />
        {/* Settings screens */}
        <Stack.Screen 
          name="AppearanceSettings" 
          component={AppearanceSettingsScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: true,
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
        {/* Editing flow screens - these can be swiped back */}
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="ImageSelection" 
          component={ImageSelectionScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="ImagePreview" 
          component={ImagePreviewScreen}
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="GenreSelection" 
          component={GenreSelectionScreen}
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
            gestureEnabled: false, // Don't allow swipe back during processing
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
      </Stack.Navigator>
      <ThemeAwareStatusBar />
    </NavigationContainer>
  );
}

const ThemeAwareStatusBar = () => {
  const { theme } = useTheme();
  return <StatusBar style={theme.isDark ? "light" : "dark"} />;
}
