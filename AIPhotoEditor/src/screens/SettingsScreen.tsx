import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NavigationProp, SettingsNavigationProp } from '../types/navigation';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { MainHeader } from '../components/MainHeader';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { SubscriptionService } from '../services/subscriptionService';
import { SettingsService } from '../services/settingsService';
import { haptic } from '../utils/haptics';
import { AnalyticsService } from '../services/analyticsService';

const SettingsScreen = () => {
  const { theme } = useTheme();
  const settingsNavigation = useNavigation<SettingsNavigationProp<any>>();
  const rootNavigation = useNavigation<NavigationProp<'Subscription'>>();
  const styles = createStyles(theme);
  
  // Subscription state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [transformationsUsed, setTransformationsUsed] = useState(0);
  
  // Auto-save originals state
  const [autoSaveOriginals, setAutoSaveOriginals] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    loadAutoSaveSetting();
    loadAnalyticsConsent();
  }, []);

  // Reload subscription data whenever the screen comes into focus
  // This ensures the status updates when navigating back from subscription screen
  useFocusEffect(
    React.useCallback(() => {
      loadSubscriptionData();
    }, [])
  );

  const loadAutoSaveSetting = async () => {
    const enabled = await SettingsService.getAutoSaveOriginals();
    setAutoSaveOriginals(enabled);
  };

  const handleAutoSaveToggle = async () => {
    const newValue = !autoSaveOriginals;
    try {
      await SettingsService.setAutoSaveOriginals(newValue);
      setAutoSaveOriginals(newValue);
      haptic.light();
    } catch (error) {
      Alert.alert('Error', 'Failed to update auto-save setting');
    }
  };

  const loadAnalyticsConsent = async () => {
    const consent = await AnalyticsService.getConsent();
    setAnalyticsConsent(consent);
  };

  const handleAnalyticsConsentToggle = async () => {
    const next = !analyticsConsent;
    try {
      await AnalyticsService.setConsent(next);
      setAnalyticsConsent(next);
      haptic.light();
    } catch (e) {
      Alert.alert('Error', 'Failed to update analytics sharing setting');
    }
  };

  const handleAnalyticsReset = async () => {
    Alert.alert(
      'Reset Analytics',
      'This will clear local usage counters. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AnalyticsService.reset();
              haptic.success();
              Alert.alert('Done', 'Analytics data has been reset.');
            } catch {
              Alert.alert('Error', 'Failed to reset analytics data');
            }
          },
        },
      ]
    );
  };

  const handleAnalyticsExport = async () => {
    try {
      const data = await AnalyticsService.export();
      const json = JSON.stringify(data, null, 2);
      await Share.share({ message: json, title: 'AI Photo Editor Analytics Export' });
      haptic.success();
    } catch (e) {
      haptic.error();
      Alert.alert('Error', 'Unable to export analytics data');
    }
  };

  const loadSubscriptionData = async () => {
    const subscribed = await SubscriptionService.checkSubscriptionStatus();
    const used = await SubscriptionService.getTransformationsUsed();
    setIsSubscribed(subscribed);
    setTransformationsUsed(used);
  };

  const handleSubscriptionPress = async () => {
    haptic.medium();
    // Reload subscription data before navigating
    await loadSubscriptionData();
    // Navigate to subscription screen (still in root stack)
    rootNavigation.navigate('Subscription');
  };


  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will delete temporary files and free up storage space. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // Implement cache clearing
            Alert.alert('Cache Cleared', 'Temporary files have been removed.');
          }
        }
      ]
    );
  };

  const handleRateApp = () => {
    // In a real app, this would open the App Store
    Alert.alert('Rate App', 'This would open the App Store for rating.');
  };

  const handleShareApp = async () => {
    try {
      haptic.light();
      
      // App store URLs - Update these with your actual App Store and Google Play Store URLs
      // You can get these URLs after publishing your app to the stores
      const appStoreUrl = Platform.select({
        ios: 'https://apps.apple.com/app/your-app-id', // Replace with your iOS App Store URL
        android: 'https://play.google.com/store/apps/details?id=com.aiphotoeditor.app', // Replace with your Android Play Store URL
        default: 'https://apps.apple.com/app/your-app-id', // Fallback to iOS URL
      });
      
      const shareMessage = `Check out AI Photo Editor! Transform your photos with AI-powered editing tools.\n\nDownload it here: ${appStoreUrl}`;
      
      const result = await Share.share({
        message: shareMessage,
        // On iOS, you can also specify a title
        ...(Platform.OS === 'ios' && { title: 'Share AI Photo Editor' }),
      });
      
      // Optional: Handle share result
      if (result.action === Share.sharedAction) {
        haptic.success();
      } else if (result.action === Share.dismissedAction) {
        // User dismissed the share sheet
      }
    } catch (error) {
      console.error('Error sharing app:', error);
      haptic.error();
      Alert.alert('Error', 'Unable to share the app. Please try again.');
    }
  };

  const handleAppearance = () => {
    settingsNavigation.navigate('AppearanceSettings');
  };

  const handleStatistics = () => {
    settingsNavigation.navigate('Statistics');
  };

  const handleSupport = () => {
    Linking.openURL('https://github.com/slopus/happy').catch(() => {
      Alert.alert('Error', 'Could not open support page');
    });
  };

  const getSubscriptionText = () => {
    if (isSubscribed) return 'Premium Active';
    return `${transformationsUsed}/3 Free Used`;
  };

  const getSubscriptionIcon = () => {
    return isSubscribed ? 'checkmark-circle' : 'ellipse-outline';
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <MainHeader title="Settings" showConnected={false} backgroundColor={theme.colors.backgroundSecondary} />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.backgroundSecondary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Developer Info */}
        <View style={[styles.sectionContainer, { paddingHorizontal: theme.spacing.base }]}>
          <View style={[styles.asciiCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.developerText, { color: theme.colors.text }]}>
              Built by MIDEGO
            </Text>
            <Text style={[styles.developerSubtext, { color: theme.colors.textSecondary }]}>
              This application is currently in development
            </Text>
          </View>
        </View>

        {/* USER ACCOUNT Section */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            {[
              {
                iconName: getSubscriptionIcon() as keyof typeof Ionicons.glyphMap,
                title: 'Subscription Status',
                subtitle: getSubscriptionText(),
                onPress: handleSubscriptionPress,
                iconColor: isSubscribed ? theme.colors.success : theme.colors.warning,
                showChevron: true,
                value: isSubscribed ? 'Premium' : 'Upgrade',
              },
              {
                iconName: 'color-palette-outline' as const,
                title: 'Appearance',
                subtitle: 'Theme and language',
                onPress: handleAppearance,
                iconColor: theme.colors.primary,
                showChevron: true,
              },
            ].map((item, index, array) => (
              <Card
                key={item.title}
                iconName={item.iconName}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
                iconColor={item.iconColor}
                showChevron={item.showChevron}
                value={item.value}
                isFirstInGroup={index === 0}
                isLastInGroup={index === array.length - 1}
                showSeparator={index < array.length - 1}
              />
            ))}
          </View>
        </View>

        {/* PHOTO EDITING Section */}
        <SectionHeader title="PHOTO EDITING" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            {[
              {
                iconName: 'image-outline' as const,
                title: 'Default Export Quality',
                subtitle: 'High quality (recommended)',
                value: 'High',
                onPress: () => {
                  Alert.alert('Quality Settings', 'Export quality options coming soon!');
                },
                iconColor: theme.colors.primary,
                showChevron: true,
              },
              {
                iconName: 'save-outline' as const,
                title: 'Auto-save Originals',
                subtitle: 'Keep original photos',
                value: autoSaveOriginals ? 'On' : 'Off',
                onPress: handleAutoSaveToggle,
                iconColor: theme.colors.primary,
                showChevron: true,
              },
              {
                iconName: 'cloud-upload-outline' as const,
                title: 'Cloud Sync',
                subtitle: 'Backup edits to iCloud',
                value: 'Off',
                onPress: () => {
                  Alert.alert('Cloud Sync', 'iCloud backup features coming soon!');
                },
                iconColor: theme.colors.primary,
                showChevron: true,
              },
            ].map((item, index, array) => (
              <Card
                key={item.title}
                iconName={item.iconName}
                title={item.title}
                subtitle={item.subtitle}
                value={item.value}
                onPress={item.onPress}
                iconColor={item.iconColor}
                showChevron={item.showChevron}
                isFirstInGroup={index === 0}
                isLastInGroup={index === array.length - 1}
                showSeparator={index < array.length - 1}
              />
            ))}
          </View>
        </View>

        {/* PRIVACY & DATA Section */}
        <SectionHeader title="PRIVACY & DATA" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            {[
              {
                iconName: 'stats-chart-outline' as const,
                title: 'Statistics',
                subtitle: 'App storage and usage',
                onPress: handleStatistics,
                iconColor: theme.colors.primary,
                showChevron: true,
              },
              {
                iconName: 'shield-checkmark-outline' as const,
                title: 'Analytics Sharing',
                subtitle: 'Anonymous local metrics only',
                value: analyticsConsent ? 'On' : 'Off',
                onPress: handleAnalyticsConsentToggle,
                iconColor: theme.colors.primary,
                showChevron: true,
              },
              {
                iconName: 'trash-outline' as const,
                title: 'Clear Cache',
                subtitle: 'Free up storage space',
                onPress: handleClearCache,
                iconColor: theme.colors.warning,
                showChevron: false,
              },
              {
                iconName: 'refresh-outline' as const,
                title: 'Reset Analytics Data',
                subtitle: 'Clear local usage counters',
                onPress: handleAnalyticsReset,
                iconColor: theme.colors.warning,
                showChevron: false,
              },
              {
                iconName: 'download-outline' as const,
                title: 'Export Analytics JSON',
                subtitle: 'Share local counters as JSON',
                onPress: handleAnalyticsExport,
                iconColor: theme.colors.primary,
                showChevron: false,
              },
            ].map((item, index, array) => (
              <Card
                key={item.title}
                iconName={item.iconName}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
                iconColor={item.iconColor}
                showChevron={item.showChevron}
                isFirstInGroup={index === 0}
                isLastInGroup={index === array.length - 1}
                showSeparator={index < array.length - 1}
              />
            ))}
          </View>
        </View>

        {/* ABOUT & SUPPORT Section */}
        <SectionHeader title="ABOUT & SUPPORT" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            {[
              {
                iconName: 'heart' as const,
                title: 'Support us',
                subtitle: 'Support project development',
                onPress: handleSupport,
                iconColor: '#FF3B30',
                showChevron: false,
              },
              {
                iconName: 'star-outline' as const,
                title: 'Rate the App',
                subtitle: 'Share your feedback',
                onPress: handleRateApp,
                iconColor: '#FFD700',
                showChevron: false,
              },
              {
                iconName: 'share-outline' as const,
                title: 'Share the App',
                subtitle: 'Tell your friends',
                onPress: handleShareApp,
                iconColor: theme.colors.primary,
                showChevron: false,
              },
            ].map((item, index, array) => (
              <Card
                key={item.title}
                iconName={item.iconName}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
                iconColor={item.iconColor}
                showChevron={item.showChevron}
                isFirstInGroup={index === 0}
                isLastInGroup={index === array.length - 1}
                showSeparator={index < array.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: theme.spacing.xl,
    },
    asciiCard: {
      borderRadius: theme.spacing.md,
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.base,
      alignItems: 'center',
    },
    developerText: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    developerSubtext: {
      fontSize: theme.typography.scaled.base,
      textAlign: 'center',
    },
    sectionContainer: {
      marginBottom: theme.spacing.lg, // Match categorySection marginBottom from Features
    },
    categoryContainer: {
      paddingHorizontal: theme.spacing.base, // Match Features page categoryContainer exactly
    },
  });

export default SettingsScreen;
