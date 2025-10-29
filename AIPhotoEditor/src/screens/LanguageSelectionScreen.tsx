import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '../types/navigation';
import { Header } from '../components/Header';
import { SectionHeader } from '../components/SectionHeader';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { LanguageService, Language, LANGUAGES } from '../services/languageService';
import { haptic } from '../utils/haptics';

const LanguageSelectionScreen = () => {
  const navigation = useNavigation<NavigationProp<'LanguageSelection'>>();
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('automatic');

  const styles = createStyles(theme);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    const language = await LanguageService.getLanguage();
    setSelectedLanguage(language);
  };

  const handleLanguageChange = async (language: Language) => {
    haptic.medium();
    setSelectedLanguage(language);
    await LanguageService.setLanguage(language);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Header
        title="Language"
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
        <SectionHeader title="SELECT LANGUAGE" />
        <View style={styles.optionsContainer}>
          {LANGUAGES.map((languageOption) => {
            const isSelected = selectedLanguage === languageOption.code;
            return (
              <TouchableOpacity
                key={languageOption.code}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => handleLanguageChange(languageOption.code)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionTextContainer}>
                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                      {languageOption.nativeLabel}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {languageOption.label}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
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
      padding: theme.spacing.base,
      paddingBottom: theme.spacing['3xl'] + 60,
    },
    optionsContainer: {
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.lg,
    },
    optionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: theme.spacing.base,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 64,
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceElevated,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
      marginBottom: theme.spacing.xs / 2,
    },
    optionTitleSelected: {
      color: theme.colors.primary,
    },
    optionDescription: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.scaled.sm,
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: theme.spacing.base,
    },
    checkmarkText: {
      color: theme.colors.background,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

export default LanguageSelectionScreen;

