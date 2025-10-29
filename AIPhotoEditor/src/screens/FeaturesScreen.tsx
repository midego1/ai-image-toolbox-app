import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { FeaturedBlock } from '../components/FeaturedBlock';
import { SettingItem } from '../components/SettingItem';
import { EditMode, EditModeCategory, getEditModesByCategory, PHASE1_FEATURES } from '../constants/editModes';
import { SubscriptionService } from '../services/subscriptionService';
import { haptic } from '../utils/haptics';

const FeaturesScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp<'Camera'>>();
  const styles = createStyles(theme);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    const premium = await SubscriptionService.checkSubscriptionStatus();
    setIsPremium(premium);
  };

  const handleFeaturePress = (editMode: EditMode, requiresPremium: boolean) => {
    haptic.medium();

    if (requiresPremium && !isPremium) {
      // Show upgrade prompt
      haptic.error();
      return;
    }

    // Navigate to camera with pre-selected edit mode
    // Use getParent() to navigate to the stack navigator's Camera screen, not the tab's Camera
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Camera', { editMode });
    } else {
      // Fallback if getParent doesn't work
      navigation.navigate('Camera', { editMode });
    }
  };


  const renderCategory = (categoryName: string, category: EditModeCategory) => {
    const modes = getEditModesByCategory(category);

    if (modes.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <SectionHeader title={categoryName} />
        <View style={styles.categoryContainer}>
          {modes.map((mode, index) => {
            const isLocked = mode.isPremium && !isPremium;
            return (
              <SettingItem
                key={mode.id}
                icon={mode.icon}
                title={mode.name}
                subtitle={mode.description}
                showPremiumBadge={mode.isPremium}
                rightIcon={isLocked ? 'lock' : 'chevron'}
                disabled={isLocked}
                onPress={() => handleFeaturePress(mode.id, mode.isPremium)}
                iconColor={theme.colors.primary}
                isFirstInGroup={index === 0}
                isLastInGroup={index === modes.length - 1}
                showSeparator={index < modes.length - 1}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <MainHeader title="Features" backgroundColor={theme.colors.backgroundSecondary} />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.backgroundSecondary }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Block */}
        <FeaturedBlock
          editMode={PHASE1_FEATURES[0]}
          onPress={() => handleFeaturePress(PHASE1_FEATURES[0], false)}
          beforeImage={require('../../assets/images/featured/200x_before.jpg')}
          afterImage={require('../../assets/images/featured/200x_after.jpg')}
        />

        {/* Subscription Status Banner */}
        {!isPremium && (
          <View style={styles.bannerContainer}>
            <View style={[styles.banner, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}>
              <Text style={[styles.bannerText, { color: theme.colors.primary }]}>
                ✨ Upgrade to Pro to unlock all features
              </Text>
            </View>
          </View>
        )}

        {/* Transform Category */}
        {renderCategory('🎨 TRANSFORM', EditModeCategory.TRANSFORM)}

        {/* Edit Category */}
        {renderCategory('✏️ EDIT', EditModeCategory.EDIT)}

        {/* Enhance Category */}
        {renderCategory('✨ ENHANCE', EditModeCategory.ENHANCE)}

        {/* Stylize Category */}
        {renderCategory('🖌️ STYLIZE', EditModeCategory.STYLIZE)}
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
      paddingTop: theme.spacing.base,
    },
    bannerContainer: {
      paddingHorizontal: theme.spacing.base,
      marginBottom: theme.spacing.lg,
    },
    banner: {
      padding: theme.spacing.base,
      borderRadius: theme.spacing.md,
      borderWidth: 1,
      alignItems: 'center',
    },
    bannerText: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.semibold,
    },
    categorySection: {
      marginBottom: theme.spacing.lg,
    },
    categoryContainer: {
      paddingHorizontal: theme.spacing.base,
    },
  });

export default FeaturesScreen;
