import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '../types/navigation';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { LanguageService, Language, LANGUAGES } from '../services/languageService';
import { haptic } from '../utils/haptics';
import { Ionicons } from '@expo/vector-icons';

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

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <MainHeader
        title="Language"
        onBack={handleBack}
        backgroundColor={theme.colors.backgroundSecondary}
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.backgroundSecondary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="SELECT LANGUAGE" />
        <View style={styles.categoryContainer}>
          {LANGUAGES.map((languageOption, index, array) => {
            const isSelected = selectedLanguage === languageOption.code;
            return (
              <Card
                key={languageOption.code}
                title={languageOption.nativeLabel}
                subtitle={languageOption.label}
                onPress={() => handleLanguageChange(languageOption.code)}
                isFirstInGroup={index === 0}
                isLastInGroup={index === array.length - 1}
                showSeparator={index < array.length - 1}
                showChevron={false}
                rightIcon={
                  isSelected ? (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
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
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing['3xl'] + 60,
    },
    categoryContainer: {
      paddingHorizontal: theme.spacing.base,
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default LanguageSelectionScreen;

