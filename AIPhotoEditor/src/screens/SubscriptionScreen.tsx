import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { SubscriptionService, SubscriptionTier, SubscriptionDuration } from '../services/subscriptionService';
import { haptic } from '../utils/haptics';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { Ionicons } from '@expo/vector-icons';

interface TierInfo {
  id: SubscriptionTier;
  name: string;
  description: string;
  features: string[];
  emoji: string;
}

const TIERS: TierInfo[] = [
  {
    id: 'basic',
    name: 'Basic',
    emoji: '⭐',
    description: 'Perfect for casual users',
    features: [
      '10 credits/month',
      'All features unlocked',
      'Standard quality export',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    emoji: '💎',
    description: 'For creative professionals',
    features: [
      '50 credits/month',
      'All features unlocked',
      'High-quality export',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    emoji: '👑',
    description: 'Everything + exclusive features',
    features: [
      '150 credits/month',
      'All features unlocked',
      'Highest quality export (4K)',
      'Priority support',
      'Early access to new features',
    ],
  },
];

const getPrice = (tier: SubscriptionTier, duration: SubscriptionDuration): { price: string; period: string; savings: string | null } => {
  // Pricing matrix - adjust these to your actual pricing
  const pricing: Record<Exclude<SubscriptionTier, 'free'>, Record<SubscriptionDuration, { price: string; period: string; savings: string | null }>> = {
    basic: {
      '1month': { price: '$4.99', period: 'per month', savings: null },
      '3months': { price: '$4.49', period: 'per month', savings: 'Save 10%' },
      '6months': { price: '$3.99', period: 'per month', savings: 'Save 20%' },
      '1year': { price: '$39.99', period: 'per year', savings: 'Save 33%' },
    },
    pro: {
      '1month': { price: '$9.99', period: 'per month', savings: null },
      '3months': { price: '$8.99', period: 'per month', savings: 'Save 10%' },
      '6months': { price: '$7.49', period: 'per month', savings: 'Save 25%' },
      '1year': { price: '$79.99', period: 'per year', savings: 'Save 33%' },
    },
    premium: {
      '1month': { price: '$14.99', period: 'per month', savings: null },
      '3months': { price: '$13.49', period: 'per month', savings: 'Save 10%' },
      '6months': { price: '$11.99', period: 'per month', savings: 'Save 20%' },
      '1year': { price: '$119.99', period: 'per year', savings: 'Save 33%' },
    },
  };
  
  return pricing[tier][duration];
};

const SubscriptionScreen = () => {
  const { theme } = useTheme();
  const scrollBottomPadding = useScrollBottomPadding();
  const navigation = useNavigation<NavigationProp<'Subscription'>>();
  const styles = createStyles(theme, scrollBottomPadding);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [creditsAllocated, setCreditsAllocated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro');
  const [selectedDuration, setSelectedDuration] = useState<SubscriptionDuration>('6months');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    const info = await SubscriptionService.getSubscriptionInfo();
    setIsSubscribed(info.tier !== 'free');
    setCreditsRemaining(info.creditsRemaining);
    setCreditsAllocated(info.creditsAllocated);
    setLoading(false);
  };

  const handleTierSelect = (tier: SubscriptionTier) => {
    haptic.light();
    setSelectedTier(tier);
  };

  const handleDurationSelect = (duration: SubscriptionDuration) => {
    haptic.light();
    setSelectedDuration(duration);
  };

  const handleSubscribe = async () => {
    haptic.medium();
    const priceInfo = getPrice(selectedTier, selectedDuration);
    
    Alert.alert(
      'Complete Purchase',
      `You're about to purchase ${TIERS.find(t => t.id === selectedTier)?.name} Plan (${priceInfo.price} ${priceInfo.period}). Continue to App Store?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: async () => {
          const success = await SubscriptionService.purchaseSubscription(selectedTier, selectedDuration);
          if (success) {
            haptic.success();
            Alert.alert(
              'Purchase Successful! 🎉',
              `Thank you for upgrading to ${TIERS.find(t => t.id === selectedTier)?.name}!\n\nYou now have access to all ${TIERS.find(t => t.id === selectedTier)?.name.toLowerCase()} features.`,
              [{ text: 'Start Using Premium', onPress: async () => {
                await loadSubscriptionData();
              }}]
            );
          } else {
            haptic.error();
            Alert.alert('Error', 'Failed to process subscription. Please try again.');
          }
        }}
      ]
    );
  };

  const handleRestorePurchases = () => {
    haptic.medium();
    Alert.alert(
      'Restore Purchases',
      'This will restore any previous purchases on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => {
          haptic.success();
          Alert.alert('Restore Complete', 'Your purchases have been restored successfully!');
        }}
      ]
    );
  };

  const handleTermsPress = () => {
    Linking.openURL('https://example.com/terms').catch(() => {
      Alert.alert('Error', 'Could not open terms and conditions');
    });
  };

  const handleResetSubscription = async () => {
    haptic.medium();
    Alert.alert(
      'Reset Subscription',
      'This will cancel your premium subscription and reset your free transformations count. This is useful for testing.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            const success = await SubscriptionService.resetSubscription();
            if (success) {
              haptic.success();
              await loadSubscriptionData();
              Alert.alert('Subscription Reset', 'Your subscription has been reset. You\'re now on the free plan.');
            } else {
              haptic.error();
              Alert.alert('Error', 'Failed to reset subscription. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    haptic.light();
    navigation.goBack();
  };

  // Teal color for the subscription UI
  const tealColor = '#16A085';
  const lightTeal = '#E8F5F3';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={[]}>
        <MainHeader 
          title="Subscription" 
          showConnected={false} 
          backgroundColor={theme.colors.backgroundSecondary}
          onBack={handleBack}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSubscribed) {
    // Premium Active State
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={[]}>
        <MainHeader 
          title="Subscription" 
          showConnected={false} 
          backgroundColor={theme.colors.backgroundSecondary}
          onBack={handleBack}
        />
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.premiumContent}>
            <View style={[styles.statusCard, { backgroundColor: theme.colors.success + '20' }]}>
              <View style={styles.statusIconContainer}>
                <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
              </View>
              <Text style={[styles.statusTitle, { color: theme.colors.success }]}>Subscription Active</Text>
              <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
                {creditsRemaining.toFixed(1)} / {creditsAllocated} credits remaining this month
              </Text>
            </View>

            {/* Credits explanation */}
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.infoTitle, { color: theme.colors.text }]}>How credits work</Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                Credits are the units used for AI actions. Different tools use different amounts of
                credits based on complexity and resolution.
              </Text>
              <View style={styles.infoList}>
                <View style={styles.infoListItem}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.textTertiary} />
                  <Text style={[styles.infoBulletText, { color: theme.colors.textSecondary }]}>Credits refresh monthly with your plan.</Text>
                </View>
                <View style={styles.infoListItem}>
                  <Ionicons name="flash-outline" size={16} color={theme.colors.textTertiary} />
                  <Text style={[styles.infoBulletText, { color: theme.colors.textSecondary }]}>Unused credits do not roll over.</Text>
                </View>
                <View style={styles.infoListItem}>
                  <Ionicons name="help-circle-outline" size={16} color={theme.colors.textTertiary} />
                  <Text style={[styles.infoBulletText, { color: theme.colors.textSecondary }]}>You’ll see the cost before running each tool.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
              onPress={handleResetSubscription}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Reset Subscription (Dev)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const selectedTierInfo = TIERS.find(t => t.id === selectedTier)!;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={[]}>
      <MainHeader 
        title="Subscription" 
        showConnected={false} 
        backgroundColor={theme.colors.backgroundSecondary}
        onBack={handleBack}
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Title */}
          <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
            Unlock the full experience.
          </Text>

          {/* Tier Selection - iOS Segmented Control Style */}
          <View style={styles.tiersContainer}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>Choose Your Plan</Text>
            <View style={styles.segmentedControl}>
              {TIERS.map((tier, index) => {
                const isSelected = selectedTier === tier.id;
                const isFirst = index === 0;
                const isLast = index === TIERS.length - 1;
                
                return (
                  <TouchableOpacity
                    key={tier.id}
                    style={[
                      styles.segment,
                      isFirst && styles.segmentFirst,
                      isLast && styles.segmentLast,
                      isSelected && { backgroundColor: lightTeal },
                      !isSelected && { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={() => handleTierSelect(tier.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiText}>
                      {tier.emoji}
                    </Text>
                    <Text style={[
                      styles.segmentText,
                      { color: isSelected ? '#000000' : theme.colors.text }
                    ]}>
                      {tier.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Selected Tier Features */}
          <View style={[styles.featuresCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
              {selectedTierInfo.name} Features
            </Text>
            <View style={styles.featureListContainer}>
              {selectedTierInfo.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={tealColor} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Duration Selection */}
        <SectionHeader title="SELECT DURATION" />
        <View style={styles.sectionContainer}>
          <View style={styles.categoryContainer}>
            {(['1month', '3months', '6months', '1year'] as SubscriptionDuration[]).map((duration, index, array) => {
                const priceInfo = getPrice(selectedTier, duration);
                const isSelected = selectedDuration === duration;
                const durationLabel = duration === '1month' ? '1 month' : 
                                     duration === '3months' ? '3 months' :
                                     duration === '6months' ? '6 months' : '1 year';
                
                // Build subtitle - only savings/Best Value (period goes on right side with price)
                // Always provide a subtitle to ensure consistent card height (use non-breaking space if no content)
                const subtitleParts = [];
                if (duration === '1year') {
                  subtitleParts.push('Best Value');
                }
                if (priceInfo.savings) {
                  subtitleParts.push(priceInfo.savings);
                }
                // Use non-breaking space to reserve subtitle space for consistent height when no savings
                const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : '\u00A0';
                
                // Value with price and period stacked on the right
                const priceValue = (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ 
                      color: theme.colors.text, 
                      fontSize: theme.typography.scaled.base, 
                      fontWeight: theme.typography.weight.bold 
                    }}>
                      {priceInfo.price}
                    </Text>
                    <Text style={{ 
                      color: theme.colors.textSecondary, 
                      fontSize: theme.typography.scaled.sm 
                    }}>
                      {priceInfo.period}
                    </Text>
                  </View>
                );
                
                return (
                  <Card
                    key={duration}
                    title={durationLabel}
                    subtitle={subtitle}
                    value={priceValue}
                    onPress={() => handleDurationSelect(duration)}
                    isFirstInGroup={index === 0}
                    isLastInGroup={index === array.length - 1}
                    showSeparator={index < array.length - 1}
                    showChevron={false}
                    iconName={undefined}
                    rightIcon={
                      isSelected ? (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      ) : (
                        <Ionicons 
                          name="radio-button-off" 
                          size={24} 
                          color={theme.colors.textTertiary} 
                        />
                      )
                    }
                    style={[
                      { minHeight: 40 + theme.spacing.sm * 2 }, // Match icon height (40px) + vertical padding
                      isSelected
                        ? { backgroundColor: theme.colors.surfaceElevated }
                        : {}
                    ]}
                  />
                );
              })}
          </View>
        </View>

        {/* Subscribe Button */}
        <View style={styles.content}>
          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: tealColor }]}
            onPress={handleSubscribe}
            activeOpacity={0.8}
          >
            <Text style={styles.subscribeButtonText}>Try for free and subscribe</Text>
          </TouchableOpacity>

          {/* Footer Text */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              7 days trial, cancel anytime.{' '}
              <Text 
                style={[styles.footerLink, { color: tealColor }]}
                onPress={handleTermsPress}
              >
                Terms and conditions apply.
              </Text>
            </Text>
          </View>

          {/* Dev Options */}
          <View style={styles.devOptions}>
            <TouchableOpacity
              style={[styles.devButton, { backgroundColor: 'transparent' }]}
              onPress={handleRestorePurchases}
              activeOpacity={0.8}
            >
              <Text style={[styles.devButtonText, { color: theme.colors.textSecondary }]}>
                Restore Purchases
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.devButton, { backgroundColor: '#FF3B30', marginTop: theme.spacing.sm }]}
              onPress={handleResetSubscription}
              activeOpacity={0.8}
            >
              <Text style={styles.devButtonText}>Reset Subscription (Dev)</Text>
            </TouchableOpacity>
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
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      // Use proper padding that accounts for floating tab bar
      paddingBottom: scrollBottomPadding,
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing['2xl'],
    },
    premiumContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: theme.typography.scaled.base,
    },
    mainTitle: {
      fontSize: theme.typography.scaled['3xl'],
      fontWeight: theme.typography.weight.bold,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      lineHeight: 40,
    },
    sectionLabel: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.semibold,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.md,
      letterSpacing: 0.5,
    },
    tiersContainer: {
      marginBottom: theme.spacing.xl,
    },
    segmentedControl: {
      flexDirection: 'row',
      borderRadius: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    segment: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
    },
    segmentFirst: {
      borderTopLeftRadius: theme.spacing.md,
      borderBottomLeftRadius: theme.spacing.md,
    },
    segmentLast: {
      borderTopRightRadius: theme.spacing.md,
      borderBottomRightRadius: theme.spacing.md,
      borderRightWidth: 0,
    },
    segmentText: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
    },
    emojiText: {
      fontSize: 20,
      marginBottom: 4,
    },
    featuresCard: {
      borderRadius: theme.spacing.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    featuresTitle: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginBottom: theme.spacing.md,
    },
    featureListContainer: {
      gap: theme.spacing.sm,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    featureText: {
      fontSize: theme.typography.scaled.base,
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    sectionContainer: {
      marginBottom: theme.spacing.lg,
    },
    categoryContainer: {
      paddingHorizontal: theme.spacing.base,
    },
    inlineBadge: {
      backgroundColor: '#FFD700',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    inlineBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#000000',
    },
    planLeftSection: {
      flex: 1,
    },
    planTitle: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginBottom: 2,
    },
    planSavings: {
      fontSize: theme.typography.scaled.sm,
    },
    planRightSection: {
      alignItems: 'flex-end',
      marginRight: theme.spacing.lg,
    },
    planPrice: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginBottom: 2,
    },
    planPeriod: {
      fontSize: theme.typography.scaled.sm,
    },
    subscribeButton: {
      width: '100%',
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    subscribeButtonText: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
      color: '#FFFFFF',
    },
    footerContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    footerText: {
      fontSize: theme.typography.scaled.sm,
      textAlign: 'center',
    },
    footerLink: {
      textDecorationLine: 'underline',
    },
    statusCard: {
      borderRadius: theme.spacing.lg,
      padding: theme.spacing.xl,
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    statusIconContainer: {
      marginBottom: theme.spacing.md,
    },
    statusTitle: {
      fontSize: theme.typography.scaled['2xl'],
      fontWeight: theme.typography.weight.bold,
      marginBottom: theme.spacing.xs,
    },
    statusSubtitle: {
      fontSize: theme.typography.scaled.base,
      textAlign: 'center',
    },
    actionButton: {
      borderRadius: theme.spacing.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    actionButtonText: {
      color: theme.colors.background,
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
    },
    infoCard: {
      borderRadius: theme.spacing.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    infoTitle: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginBottom: theme.spacing.sm,
    },
    infoText: {
      fontSize: theme.typography.scaled.base,
      marginBottom: theme.spacing.md,
    },
    infoList: {
      gap: theme.spacing.sm,
    },
    infoListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    infoBulletText: {
      fontSize: theme.typography.scaled.base,
      flex: 1,
    },
    devOptions: {
      width: '100%',
      marginTop: theme.spacing.md,
    },
    devButton: {
      borderRadius: theme.spacing.md,
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    devButtonText: {
      color: theme.colors.background,
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
    },
  });

export default SubscriptionScreen;
