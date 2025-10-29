import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '../types/navigation';
import { SettingsHeader } from '../components/SettingsHeader';
import { SectionHeader } from '../components/SectionHeader';
import { SettingItem } from '../components/SettingItem';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { ThemeMode } from '../services/themeService';
import { LanguageService, Language } from '../services/languageService';
import { haptic } from '../utils/haptics';

const AppearanceSettingsScreen = () => {
  const navigation = useNavigation<NavigationProp<'AppearanceSettings'>>();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('automatic');

  const styles = createStyles(theme);

  useEffect(() => {
    loadLanguage();
  }, []);

  // Reload language when screen comes into focus (e.g., returning from language selection)
  useFocusEffect(
    React.useCallback(() => {
      loadLanguage();
    }, [])
  );

  const loadLanguage = async () => {
    const language = await LanguageService.getLanguage();
    setCurrentLanguage(language);
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
    navigation.navigate('LanguageSelection');
  };

  const getThemeLabel = (mode: ThemeMode): string => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
      default:
        return 'Adaptive';
    }
  };

  // Theme icon component - half blue, half white circle
  const ThemeIcon = () => (
    <View style={styles.themeIconContainer}>
      <View style={[styles.themeIconHalf, { backgroundColor: theme.colors.primary }]} />
      <View style={[styles.themeIconHalf, styles.themeIconRight, { backgroundColor: theme.colors.surface }]} />
    </View>
  );

  // Language icon component - A with 文 character
  const LanguageIcon = () => (
    <View style={styles.languageIconContainer}>
      <Text style={[styles.languageIconText, { color: theme.colors.primary }]}>A</Text>
      <Text style={[styles.languageIconCharacter, { color: theme.colors.primary }]}>文</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SettingsHeader
        title="Appearance"
        leftAction={{
          icon: 'chevron-back-outline',
          onPress: () => navigation.goBack(),
        }}
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.backgroundSecondary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* THEME Section */}
        <SectionHeader title="THEME" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            <SettingItem
              icon={<ThemeIcon />}
              title="Appearance"
              subtitle="Match system settings"
              value={getThemeLabel(themeMode)}
              onPress={handleThemeToggle}
              showChevron={false}
              iconColor={theme.colors.primary}
              isFirstInGroup={true}
              isLastInGroup={true}
            />
          </View>
        </View>

        {/* LANGUAGE Section */}
        <SectionHeader title="LANGUAGE" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            <SettingItem
              icon={<LanguageIcon />}
              title="Current Language"
              value={LanguageService.getLanguageDisplayText(currentLanguage)}
              onPress={handleLanguagePress}
              showChevron={true}
              iconColor={theme.colors.primary}
              isFirstInGroup={true}
              isLastInGroup={true}
            />
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
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: theme.spacing.lg, // Spacing between header and first card
      paddingBottom: theme.spacing['3xl'] + 60, // Extra padding for tab bar
    },
    sectionContainer: {
      marginBottom: theme.spacing.lg,
    },
    categoryContainer: {
      paddingHorizontal: theme.spacing.base,
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
    languageIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    languageIconText: {
      fontSize: 18,
      fontWeight: 'bold',
      position: 'absolute',
      left: 8,
      top: 6,
    },
    languageIconCharacter: {
      fontSize: 16,
      fontWeight: 'bold',
      position: 'absolute',
      right: 6,
      bottom: 6,
    },
  });

export default AppearanceSettingsScreen;
