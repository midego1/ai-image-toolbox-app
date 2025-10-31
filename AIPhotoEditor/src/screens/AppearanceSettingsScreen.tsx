import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsNavigationProp } from '../types/navigation';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { ThemeMode } from '../services/themeService';
import { LanguageService, Language, LANGUAGES } from '../services/languageService';
import { haptic } from '../utils/haptics';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { Ionicons } from '@expo/vector-icons';

const AppearanceSettingsScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp<'AppearanceSettings'>>();
  const { theme, themeMode, setThemeMode } = useTheme();
  const scrollBottomPadding = useScrollBottomPadding();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('automatic');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const styles = createStyles(theme, scrollBottomPadding);

  useEffect(() => {
    loadLanguage();
  }, []);

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
    haptic.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const handleLanguageSelect = async (language: Language) => {
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
        return 'Adaptive';
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
      // System/Adaptive mode - half blue, half white circle
      return (
        <View style={styles.themeIconContainer}>
          <View style={[styles.themeIconHalf, { backgroundColor: theme.colors.primary }]} />
          <View style={[styles.themeIconHalf, styles.themeIconRight, { backgroundColor: theme.colors.surface }]} />
        </View>
      );
    }
  };

  // Language icon component - A with 文 character
  const LanguageIcon = () => (
    <View style={styles.languageIconContainer}>
      <Text style={[styles.languageIconText, { color: theme.colors.primary }]}>A</Text>
      <Text style={[styles.languageIconCharacter, { color: theme.colors.primary }]}>文</Text>
    </View>
  );

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <MainHeader
        title="Appearance"
        onBack={handleBack}
        backgroundColor={theme.colors.backgroundSecondary}
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
            <Card
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
            <Card
              icon={<LanguageIcon />}
              title="Current Language"
              value={LanguageService.getLanguageDisplayText(currentLanguage)}
              onPress={handleLanguagePress}
              showChevron={false}
              iconColor={theme.colors.primary}
              isFirstInGroup={true}
              isLastInGroup={!showLanguageDropdown}
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
                  return (
                    <Card
                      key={languageOption.code}
                      title={languageOption.nativeLabel}
                      subtitle={languageOption.label}
                      onPress={() => handleLanguageSelect(languageOption.code)}
                      isFirstInGroup={false}
                      isLastInGroup={index === array.length - 1}
                      showSeparator={index < array.length - 1}
                      showChevron={false}
                      rightIcon={
                        isSelected ? (
                          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                        ) : undefined
                      }
                      style={
                        isSelected
                          ? { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.primary, borderWidth: 2 }
                          : {}
                      }
                    />
                  );
                })}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, scrollBottomPadding: number) =>
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
      // Use proper padding that accounts for floating tab bar
      paddingBottom: scrollBottomPadding,
    },
    sectionContainer: {
      marginBottom: theme.spacing.lg,
    },
    categoryContainer: {
      paddingHorizontal: theme.spacing.base,
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
