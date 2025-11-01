import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Linking } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsNavigationProp } from '../types/navigation';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { haptic } from '../utils/haptics';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { AIService } from '../services/aiService';
import { validateReplicateApiKey, validateKieAIApiKey } from '../config/apiKeys';

const ApiKeysSettingsScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp<'ApiKeysSettings'>>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = useScrollBottomPadding();
  const styles = createStyles(theme, insets, scrollBottomPadding);
  
  // API key state
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasKieAIKey, setHasKieAIKey] = useState(false);
  const [validatingReplicate, setValidatingReplicate] = useState(false);
  const [validatingKieAI, setValidatingKieAI] = useState(false);

  useEffect(() => {
    loadApiKeyStatus();
  }, []);

  // Reload API key status whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadApiKeyStatus();
    }, [])
  );

  const loadApiKeyStatus = async () => {
    const hasKey = await AIService.hasReplicateApiKey();
    const hasKieKey = await AIService.hasKieAIApiKey();
    setHasApiKey(hasKey);
    setHasKieAIKey(hasKieKey);
  };

  const handleValidateReplicateKey = async () => {
    haptic.light();
    setValidatingReplicate(true);
    
    try {
      const result = await validateReplicateApiKey();
      
      if (result.configured === false) {
        Alert.alert(
          'Validation Result',
          'Replicate API key is not configured.\n\nConfigure it via Settings → API Keys.',
          [{ text: 'OK' }]
        );
      } else if (result.valid === true) {
        haptic.success();
        Alert.alert(
          '✅ Validation Success',
          'Replicate API key is valid and working correctly!',
          [{ text: 'OK' }]
        );
      } else if (result.valid === false) {
        haptic.error();
        Alert.alert(
          '❌ Validation Failed',
          `Replicate API key is invalid:\n\n${result.error || 'Authentication failed'}\n\nPlease check your API key and try again.`,
          [{ text: 'OK' }]
        );
      } else {
        // valid is null - network error or couldn't test
        Alert.alert(
          '⚠️ Could Not Test',
          `Unable to test the API key:\n\n${result.error || 'Network error'}\n\nThis doesn't mean the key is invalid - it may be a network issue.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      haptic.error();
      Alert.alert('Error', `Failed to validate API key: ${error.message || 'Unknown error'}`);
    } finally {
      setValidatingReplicate(false);
    }
  };

  const handleValidateKieAIKey = async () => {
    haptic.light();
    setValidatingKieAI(true);
    
    try {
      const result = await validateKieAIApiKey();
      
      if (result.configured === false) {
        Alert.alert(
          'Validation Result',
          'Kie.ai API key is not configured.\n\nConfigure it via Settings → API Keys.',
          [{ text: 'OK' }]
        );
      } else if (result.valid === true) {
        haptic.success();
        Alert.alert(
          '✅ Validation Success',
          'Kie.ai API key is valid and working correctly!',
          [{ text: 'OK' }]
        );
      } else if (result.valid === false) {
        haptic.error();
        Alert.alert(
          '❌ Validation Failed',
          `Kie.ai API key is invalid:\n\n${result.error || 'Authentication failed'}\n\nPlease check your API key and try again.`,
          [{ text: 'OK' }]
        );
      } else {
        // valid is null - network error or couldn't test
        Alert.alert(
          '⚠️ Could Not Test',
          `Unable to test the API key:\n\n${result.error || 'Network error'}\n\nNote: Kie.ai API endpoint may need adjustment. Check their documentation.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      haptic.error();
      Alert.alert('Error', `Failed to validate API key: ${error.message || 'Unknown error'}`);
    } finally {
      setValidatingKieAI(false);
    }
  };

  const handleReplicateApiKeyPress = () => {
    haptic.medium();
    
    if (Platform.OS === 'ios') {
      // Use Alert.prompt for iOS
      Alert.prompt(
        'Replicate API Key',
        hasApiKey 
          ? 'Enter your Replicate API key to update it, or leave blank to view current status.'
          : 'Enter your Replicate API key to enable AI features. You can get your key from https://replicate.com/account/api-tokens',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: hasApiKey ? 'Update' : 'Save',
            onPress: async (apiKey) => {
              if (apiKey && apiKey.trim().length > 0) {
                try {
                  await AIService.setReplicateApiKey(apiKey.trim());
                  await loadApiKeyStatus();
                  haptic.success();
                  Alert.alert('Success', 'Replicate API key has been saved successfully.');
                } catch (error) {
                  haptic.error();
                  Alert.alert('Error', 'Failed to save API key. Please try again.');
                }
              } else if (hasApiKey) {
                // Show current status if user left it blank
                Alert.alert(
                  'API Key Status',
                  'API key is currently configured. To update it, enter a new key.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ],
        'plain-text'
      );
    } else {
      // For Android, use a simple alert with instructions
      Alert.alert(
        'API Key Configuration',
        hasApiKey
          ? 'API key is configured. To update it, please use the development build or configure via EAS Environment Variables for production builds.'
          : 'API key is not configured. For production builds, configure via EAS Environment Variables. For development, add it to app.json or set it programmatically.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleKieAIApiKeyPress = () => {
    haptic.medium();
    
    if (Platform.OS === 'ios') {
      // Use Alert.prompt for iOS
      Alert.prompt(
        'Kie.ai API Key',
        hasKieAIKey 
          ? 'Enter your Kie.ai API key to update it, or leave blank to view current status.'
          : 'Enter your Kie.ai API key to enable AI features. You can get your key from https://kie.ai',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: hasKieAIKey ? 'Update' : 'Save',
            onPress: async (apiKey) => {
              if (apiKey && apiKey.trim().length > 0) {
                try {
                  await AIService.setKieAIApiKey(apiKey.trim());
                  await loadApiKeyStatus();
                  haptic.success();
                  Alert.alert('Success', 'Kie.ai API key has been saved successfully.');
                } catch (error) {
                  haptic.error();
                  Alert.alert('Error', 'Failed to save API key. Please try again.');
                }
              } else if (hasKieAIKey) {
                // Show current status if user left it blank
                Alert.alert(
                  'API Key Status',
                  'API key is currently configured. To update it, enter a new key.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ],
        'plain-text'
      );
    } else {
      // For Android, use a simple alert with instructions
      Alert.alert(
        'API Key Configuration',
        hasKieAIKey
          ? 'API key is configured. To update it, please use the development build or configure via EAS Environment Variables for production builds.'
          : 'API key is not configured. For production builds, configure via EAS Environment Variables. For development, add it to app.json or set it programmatically.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MainHeader
        title="API Keys"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* INFORMATION Section */}
        <SectionHeader title="INFORMATION" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            <Card
              iconName="information-circle-outline"
              title="About API Keys"
              subtitle="API keys are stored securely on your device. For production builds, use EAS Environment Variables."
              showChevron={false}
              iconColor={theme.colors.primary}
              isFirstInGroup={true}
              isLastInGroup={true}
              showSeparator={false}
            />
          </View>
        </View>

        {/* REPLICATE API KEY Section */}
        <SectionHeader title="REPLICATE API" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            <Card
              iconName="key-outline"
              title="Replicate API Key"
              subtitle={hasApiKey ? "API key configured" : "Required for AI features"}
              value={hasApiKey ? "Configured" : "Not Set"}
              onPress={handleReplicateApiKeyPress}
              iconColor={hasApiKey ? theme.colors.success : theme.colors.warning}
              showChevron={true}
              isFirstInGroup={true}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              iconName="checkmark-circle-outline"
              title="Test Replicate Key"
              subtitle={validatingReplicate ? "Validating..." : "Verify API key is working"}
              value={validatingReplicate ? "Testing..." : "Test"}
              onPress={handleValidateReplicateKey}
              iconColor={theme.colors.primary}
              showChevron={false}
              isFirstInGroup={false}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              iconName="link-outline"
              title="Get Replicate API Key"
              subtitle="Visit replicate.com to get your API key"
              onPress={() => {
                haptic.light();
                // @ts-ignore - Linking.openURL is available
                Linking.openURL('https://replicate.com/account/api-tokens').catch(() => {
                  Alert.alert('Error', 'Could not open URL');
                });
              }}
              iconColor={theme.colors.primary}
              showChevron={true}
              isFirstInGroup={false}
              isLastInGroup={true}
              showSeparator={false}
            />
          </View>
        </View>

        {/* KIE.AI API KEY Section */}
        <SectionHeader title="KIE.AI API" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            <Card
              iconName="key-outline"
              title="Kie.ai API Key"
              subtitle={hasKieAIKey ? "API key configured" : "Required for AI features"}
              value={hasKieAIKey ? "Configured" : "Not Set"}
              onPress={handleKieAIApiKeyPress}
              iconColor={hasKieAIKey ? theme.colors.success : theme.colors.warning}
              showChevron={true}
              isFirstInGroup={true}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              iconName="checkmark-circle-outline"
              title="Test Kie.ai Key"
              subtitle={validatingKieAI ? "Validating..." : "Verify API key is working"}
              value={validatingKieAI ? "Testing..." : "Test"}
              onPress={handleValidateKieAIKey}
              iconColor={theme.colors.primary}
              showChevron={false}
              isFirstInGroup={false}
              isLastInGroup={false}
              showSeparator={true}
            />
            <Card
              iconName="link-outline"
              title="Get Kie.ai API Key"
              subtitle="Visit kie.ai to get your API key"
              onPress={() => {
                haptic.light();
                // @ts-ignore - Linking.openURL is available
                Linking.openURL('https://kie.ai').catch(() => {
                  Alert.alert('Error', 'Could not open URL');
                });
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

const createStyles = (theme: Theme, insets: any, scrollBottomPadding: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: scrollBottomPadding,
    },
    sectionContainer: {
      paddingHorizontal: theme.spacing.base,
      marginBottom: theme.spacing.lg,
    },
    categoryContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
      overflow: 'hidden',
    },
  });

export default ApiKeysSettingsScreen;

