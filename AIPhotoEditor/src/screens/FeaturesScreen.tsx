import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '../types/navigation';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { FeaturedBlock } from '../components/FeaturedBlock';
import { Card } from '../components/Card';
import { EditMode, EditModeCategory, getEditModesByCategory, PHASE1_FEATURES } from '../constants/editModes';
import { SubscriptionService } from '../services/subscriptionService';
import { ImageProcessingService } from '../services/imageProcessingService';
import { haptic } from '../utils/haptics';

const FeaturesScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp<'Camera'>>();
  const styles = createStyles(theme);
  const [isPremium, setIsPremium] = useState(false);

  const loadSubscriptionStatus = async () => {
    const premium = await SubscriptionService.checkSubscriptionStatus();
    setIsPremium(premium);
  };

  // Reload subscription status whenever the screen comes into focus
  // This ensures the status updates when navigating back from subscription screen
  useFocusEffect(
    React.useCallback(() => {
      loadSubscriptionStatus();
    }, [])
  );

  const handleFeaturePress = (editMode: EditMode, requiresPremium: boolean) => {
    haptic.medium();

    if (requiresPremium && !isPremium) {
      // Show upgrade prompt
      haptic.error();
      return;
    }

    // Transform should go to GenreSelection within the Features stack (keep tab bar)
    if (editMode === EditMode.TRANSFORM) {
      (navigation as any).navigate('GenreSelection', { editMode });
      return;
    }

    // Default: go to Camera with pre-selected edit mode
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Camera', { editMode });
    } else {
      navigation.navigate('Camera', { editMode });
    }
  };

  const handleUpgradePress = () => {
    haptic.medium();
    // Navigate to Subscription screen
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('Subscription');
    } else {
      // Fallback if getParent doesn't work
      navigation.navigate('Subscription' as any);
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
            const isNotWorking = !ImageProcessingService.isModeSupported(mode.id);
            const isDisabled = isLocked || isNotWorking;
            return (
              <Card
                key={mode.id}
                icon={mode.icon}
                title={mode.name}
                subtitle={mode.description}
                showPremiumBadge={mode.isPremium}
                rightIcon={isLocked ? 'lock' : 'chevron'}
                disabled={isDisabled}
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
        {/* Removed Featured Block */}

        {/* Subscription Status Banner */}
        {!isPremium && (
          <View style={styles.bannerContainer}>
            <TouchableOpacity
              onPress={handleUpgradePress}
              activeOpacity={0.85}
              style={styles.bannerTouchable}
            >
              <LinearGradient
                colors={[
                  theme.colors.primary + '20',
                  theme.colors.primary + '15',
                  theme.colors.primary + '10'
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerLeftSection}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '30' }]}>
                      <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.textSection}>
                      <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>
                        Upgrade to Pro
                      </Text>
                      <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
                        Unlock all premium features
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.arrowContainer, { backgroundColor: theme.colors.primary + '25' }]}>
                    <Text style={[styles.chevron, { color: theme.colors.primary }]}>
                      {'>'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
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
    bannerTouchable: {
      borderRadius: theme.spacing.md,
      overflow: 'hidden',
      // Subtle shadow/elevation matching cards
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    bannerGradient: {
      borderRadius: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
      paddingHorizontal: theme.spacing.base,
      paddingVertical: theme.spacing.sm,
    },
    bannerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bannerLeftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: theme.spacing.base,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.base,
    },
    textSection: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
      marginBottom: 2,
    },
    bannerSubtitle: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.medium,
    },
    arrowContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevron: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.medium,
    },
    categorySection: {
      marginBottom: theme.spacing.lg,
    },
    categoryContainer: {
      paddingHorizontal: theme.spacing.base,
    },
  });

export default FeaturesScreen;
