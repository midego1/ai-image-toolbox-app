import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, Share, Platform, LayoutAnimation } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { haptic, updateVibrationsCache } from '../utils/haptics';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { AnalyticsService } from '../services/analyticsService';
import { ThemeMode } from '../services/themeService';
import { LanguageService, Language, LANGUAGES } from '../services/languageService';
import { AIService } from '../services/aiService';

const SettingsScreen = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const settingsNavigation = useNavigation<SettingsNavigationProp<any>>();
  const rootNavigation = useNavigation<NavigationProp<'Subscription'>>();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const styles = createStyles(theme, insets, scrollBottomPadding);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastTabPressTimeRef = useRef<number>(0);
  
  // Subscription state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [transformationsUsed, setTransformationsUsed] = useState(0);
  
  // Auto-save originals state
  const [autoSaveOriginals, setAutoSaveOriginals] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  
  // Appearance and language state
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  // Vibration state
  const [vibrationsEnabled, setVibrationsEnabled] = useState(true);
  
  // API key state (just for display in main settings)
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasKieAIKey, setHasKieAIKey] = useState(false);

  useEffect(() => {
    loadAutoSaveSetting();
    loadAnalyticsConsent();
    loadLanguage();
    loadVibrationsSetting();
    loadApiKeyStatus();
  }, []);

  // Handle double-tap on tab to scroll to top
  useEffect(() => {
    // Get the parent tab navigator to listen to tab press events
    const parentTabNavigator = rootNavigation.getParent();
    
    if (!parentTabNavigator) return;

    const unsubscribe = parentTabNavigator.addListener('tabPress', (e: any) => {
      // Check if this screen is already focused (meaning tab was pressed while active)
      if (rootNavigation.isFocused()) {
        const now = Date.now();
        const timeSinceLastPress = now - lastTabPressTimeRef.current;
        
        // If tab was pressed within 500ms of last press, scroll to top
        if (timeSinceLastPress < 500) {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          haptic.light();
        }
        
        lastTabPressTimeRef.current = now;
      }
    });

    return unsubscribe;
  }, [rootNavigation]);

  // Reload subscription data whenever the screen comes into focus
  // This ensures the status updates when navigating back from subscription screen
  useFocusEffect(
    React.useCallback(() => {
      loadSubscriptionData();
      loadLanguage();
      loadVibrationsSetting();
      loadApiKeyStatus();
    }, [])
  );
  
  const loadApiKeyStatus = async () => {
    const hasKey = await AIService.hasReplicateApiKey();
    const hasKieKey = await AIService.hasKieAIApiKey();
    setHasApiKey(hasKey);
    setHasKieAIKey(hasKieKey);
  };
  

  const loadLanguage = async () => {
    const language = await LanguageService.getLanguage();
    setCurrentLanguage(language);
  };

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

  const loadVibrationsSetting = async () => {
    const enabled = await SettingsService.getVibrationsEnabled();
    setVibrationsEnabled(enabled);
  };

  const handleVibrationsToggle = async () => {
    const newValue = !vibrationsEnabled;
    try {
      await SettingsService.setVibrationsEnabled(newValue);
      setVibrationsEnabled(newValue);
      // Update the haptics cache so changes take effect immediately
      await updateVibrationsCache();
      // Only provide haptic feedback if vibrations are being enabled
      if (newValue) {
        haptic.light();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update vibrations setting');
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
          onPress: async () => {
            try {
              const cacheDir = FileSystem.cacheDirectory ?? '';
              if (cacheDir) {
                try {
                  await FileSystem.deleteAsync(cacheDir, { idempotent: true });
                } catch {}
                // Re-create cache directory by touching it with a no-op
                try {
                  await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
                } catch {}
              }
              haptic.success();
              Alert.alert('Cache Cleared', 'Temporary files have been removed.');
            } catch (e) {
              haptic.error();
              Alert.alert('Error', 'Failed to clear cache.');
            }
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
      
      // App store URL - Update this with your actual App Store URL
      // You can get this URL after publishing your app to the App Store
      const appStoreUrl = 'https://apps.apple.com/app/your-app-id'; // Replace with your iOS App Store URL
      
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

  // Cycle through theme modes: system -> light -> dark -> system
  const handleThemeToggle = async () => {
    haptic.medium();
    let nextMode: ThemeMode;
    
    if (themeMode === 'system') {
      nextMode = 'light';
    } else if (themeMode === 'light') {
      nextMode = 'dark';
    } else {
      nextMode = 'system';
    }
    
    await setThemeMode(nextMode);
    
    // Reload to get updated language if needed
    const updatedLanguage = await LanguageService.getLanguage();
    setCurrentLanguage(updatedLanguage);
  };

  const handleLanguagePress = () => {
    haptic.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const handleLanguageSelect = async (language: Language, disabled?: boolean) => {
    if (disabled) {
      haptic.error();
      return;
    }
    haptic.medium();
    setCurrentLanguage(language);
    await LanguageService.setLanguage(language);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowLanguageDropdown(false);
  };

  const getThemeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
      default:
        return 'System';
    }
  };

  // Theme icon component - changes based on theme mode
  const ThemeIcon = () => {
    if (themeMode === 'light') {
      return (
        <View style={styles.themeIconWrapper}>
          <Ionicons 
            name="sunny" 
            size={24} 
            color={theme.colors.primary} 
          />
        </View>
      );
    } else if (themeMode === 'dark') {
      return (
        <View style={styles.themeIconWrapper}>
          <Ionicons 
            name="moon" 
            size={24} 
            color={theme.colors.primary} 
          />
        </View>
      );
    } else {
      // System mode - uses device settings
      return (
        <View style={styles.themeIconWrapper}>
          <Ionicons
            name="phone-portrait-outline"
            size={24}
            color={theme.colors.primary}
          />
        </View>
      );
    }
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
        ref={scrollViewRef}
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
            <Card
              iconName={getSubscriptionIcon() as keyof typeof Ionicons.glyphMap}
              title="Subscription Status"
              subtitle={getSubscriptionText()}
              onPress={handleSubscriptionPress}
              iconColor={isSubscribed ? theme.colors.success : theme.colors.warning}
              showChevron={true}
              value={isSubscribed ? 'Premium' : 'Upgrade'}
              isFirstInGroup={true}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              icon={<ThemeIcon />}
              title="Appearance"
              subtitle="Match system settings"
              value={getThemeLabel(themeMode)}
              onPress={handleThemeToggle}
              showChevron={false}
              iconColor={theme.colors.primary}
              isFirstInGroup={false}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              iconName="pulse-outline"
              title="Vibrations"
              subtitle="Haptic feedback"
              value={vibrationsEnabled ? 'On' : 'Off'}
              onPress={handleVibrationsToggle}
              showChevron={false}
              iconColor={theme.colors.primary}
              isFirstInGroup={false}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              iconName="language-outline"
              title="Current Language"
              value={LanguageService.getLanguageDisplayText(currentLanguage)}
              onPress={handleLanguagePress}
              showChevron={false}
              iconColor={theme.colors.primary}
              isFirstInGroup={false}
              isLastInGroup={!showLanguageDropdown}
              showSeparator={false}
              rightIcon={
                <Ionicons
                  name={showLanguageDropdown ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textTertiary}
                />
              }
            />
            {showLanguageDropdown && (
              <>
                {LANGUAGES.map((languageOption, index, array) => {
                  const isSelected = currentLanguage === languageOption.code;
                  const isDisabled = languageOption.disabled;
                  return (
                    <Card
                      key={languageOption.code}
                      title={languageOption.nativeLabel}
                      subtitle={languageOption.label}
                      onPress={() => handleLanguageSelect(languageOption.code, isDisabled)}
                      isFirstInGroup={false}
                      isLastInGroup={index === array.length - 1}
                      showSeparator={index < array.length - 1}
                      showChevron={false}
                      rightIcon={
                        isSelected ? (
                          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                        ) : undefined
                      }
                      style={[
                        isSelected
                          ? { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.primary, borderWidth: 2 }
                          : {},
                        isDisabled
                          ? { opacity: 0.5 }
                          : {}
                      ]}
                    />
                  );
                })}
              </>
            )}
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
                showChevron: false,
              },
              {
                iconName: 'save-outline' as const,
                title: 'Auto-save Originals',
                subtitle: 'Keep original photos',
                value: autoSaveOriginals ? 'On' : 'Off',
                onPress: handleAutoSaveToggle,
                iconColor: theme.colors.primary,
                showChevron: false,
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
                showChevron: false,
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

        {/* DEVELOPER Section */}
        <SectionHeader title="DEVELOPER" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            <Card
              iconName="git-network-outline"
              title="Multi-Step Workflows (Beta)"
              subtitle="Test chaining multiple AI tools together"
              value="Beta"
              onPress={() => {
                haptic.medium();
                settingsNavigation.navigate('WorkflowBeta');
              }}
              iconColor={theme.colors.primary}
              showChevron={true}
              isFirstInGroup={true}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              iconName="key-outline"
              title="API Keys"
              subtitle={hasApiKey && hasKieAIKey ? "All API keys configured" : "Configure Replicate & Kie.ai API keys"}
              value={hasApiKey && hasKieAIKey ? "Configured" : hasApiKey || hasKieAIKey ? "Partial" : "Not Set"}
              onPress={() => {
                haptic.medium();
                settingsNavigation.navigate('ApiKeysSettings');
              }}
              iconColor={hasApiKey && hasKieAIKey ? theme.colors.success : theme.colors.warning}
              showChevron={true}
              isFirstInGroup={false}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              iconName="image-outline"
              title="Result Screen Mockup"
              subtitle="Interactive demo of the redesigned result screen"
              onPress={() => {
                haptic.medium();
                settingsNavigation.navigate('ResultScreenMockup');
              }}
              iconColor={theme.colors.primary}
              showChevron={true}
              isFirstInGroup={false}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              iconName="cube-outline"
              title="RevenueCat Packages"
              subtitle="Test and view all subscription packages"
              onPress={() => {
                haptic.medium();
                settingsNavigation.navigate('RevenueCatPackagesTest');
              }}
              iconColor={theme.colors.primary}
              showChevron={true}
              isFirstInGroup={false}
              isLastInGroup={true}
              showSeparator={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, insets: { bottom: number }, scrollBottomPadding: number) =>
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
      // Use proper padding that accounts for floating tab bar
      paddingBottom: scrollBottomPadding,
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
    themeIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    themeIconHalf: {
      flex: 1,
    },
    themeIconRight: {
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
    },
  });

export default SettingsScreen;
