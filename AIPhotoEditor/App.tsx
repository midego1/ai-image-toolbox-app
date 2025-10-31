import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import { SubscriptionService } from './src/services/subscriptionService';
import { AIService } from './src/services/aiService';
import { getReplicateApiKey, isApiKeyConfigured } from './src/config/apiKeys';
import { RootStackParamList } from './src/types/navigation';
import { AnalyticsService } from './src/services/analyticsService';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // Initialize subscription service
    SubscriptionService.init().catch(() => {
      // Service initialization failed - continue anyway
    });

    // Local analytics: app open and session start
    AnalyticsService.increment('app_open').catch(() => {});
    AnalyticsService.increment('session_start').catch(() => {});
    
    // Initialize Replicate API key from config (production-ready)
    // Key is loaded from EAS Secrets or app.json extra config
    const initializeApiKey = async () => {
      try {
        console.log('🔍 Initializing Replicate API key...');
        
        // Check all possible sources
        const camelCase = Constants.expoConfig?.extra?.replicateApiKey;
        const uppercase = Constants.expoConfig?.extra?.REPLICATE_API_KEY;
        
        console.log('📋 Configuration sources check:');
        console.log('   - extra.replicateApiKey (camelCase):', 
          camelCase ? `${typeof camelCase} (length: ${camelCase.length})` : 'missing');
        console.log('   - extra.REPLICATE_API_KEY (uppercase):', 
          uppercase ? `${typeof uppercase} (length: ${uppercase.length})` : 'missing');
        
        const apiKey = getReplicateApiKey();
        
        // Log what we found (masked for security)
        if (apiKey) {
          console.log('🔑 Replicate API key found:', apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 3));
          console.log('   Key length:', apiKey.length);
          
          // Store it securely in SecureStore
          console.log('💾 Storing API key in SecureStore...');
          await AIService.setReplicateApiKey(apiKey);
          
          // Verify it was stored correctly
          const hasKey = await AIService.hasReplicateApiKey();
          if (hasKey) {
            console.log('✅ Replicate API key loaded and stored successfully');
            console.log('   Ready for AI features');
          } else {
            console.error('❌ Failed to verify API key after storage');
            console.error('   This may indicate a SecureStore issue');
          }
        } else {
          // Key not configured - log detailed warning
          console.error('⚠️ Replicate API key not configured.');
          console.error('📝 Configuration check:');
          console.error('   - Constants.expoConfig?.extra?.replicateApiKey:', 
            camelCase ? `"${camelCase.substring(0, 10)}..." (${camelCase.length} chars)` : 'missing');
          console.error('   - Constants.expoConfig?.extra?.REPLICATE_API_KEY:', 
            uppercase ? `"${uppercase.substring(0, 10)}..." (${uppercase.length} chars)` : 'missing');
          console.error('   - Constants.expoConfig?.extra keys:', 
            Object.keys(Constants.expoConfig?.extra || {}).join(', ') || 'none');
          console.error('');
          console.error('💡 Solutions:');
          console.error('   1. For TestFlight: Set EAS Environment Variable in Expo Dashboard');
          console.error('      - Go to expo.dev → Your Project → Environment Variables');
          console.error('      - Add REPLICATE_API_KEY for "production" and "preview" environments');
          console.error('   2. Rebuild after setting: eas build --platform ios --profile production-ios');
          console.error('   3. For development: Manually enter key in Settings → Developer → Replicate API Key');
        }
      } catch (error: any) {
        console.error('❌ Error initializing Replicate API key:', error);
        console.error('   Error details:', JSON.stringify(error, null, 2));
      }
    };
    
    initializeApiKey();
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
      {/* @ts-ignore - React Navigation v7 type definitions issue */}
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
      </Stack.Navigator>
      <ThemeAwareStatusBar />
    </NavigationContainer>
  );
}

const ThemeAwareStatusBar = () => {
  const { theme } = useTheme();
  return <StatusBar style={theme.isDark ? "light" : "dark"} />;
}
