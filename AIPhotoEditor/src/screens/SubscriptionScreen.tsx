import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { MainHeader } from '../components/MainHeader';
import { SectionHeader } from '../components/SectionHeader';
import { Card } from '../components/Card';
import { MediaTypeTabs, MediaTypeTabConfig } from '../components/MediaTypeTabs';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { SubscriptionService, SubscriptionTier, SubscriptionDuration, CREDIT_PACKS, CreditPack } from '../services/subscriptionService';
import { iapService } from '../services/iapService';
import { revenueCatService } from '../services/revenueCatService';
import { Offering } from 'react-native-purchases';
import { EDIT_MODES } from '../constants/editModes';
import { EditModeData } from '../types/editModes';
import { haptic } from '../utils/haptics';
import { useScrollBottomPadding } from '../utils/scrollPadding';
import { Ionicons } from '@expo/vector-icons';
import { formatCreditCost } from '../utils/creditCost';

type SubscriptionTabType = 'credits' | 'subscriptions';

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

// Memoize pricing lookup
const PRICING: Record<Exclude<SubscriptionTier, 'free'>, Record<SubscriptionDuration, { price: string; period: string; savings: string | null }>> = {
  basic: {
    'weekly': { price: '$0.99', period: 'per week', savings: null },
    '1month': { price: '$0.99', period: 'per month', savings: null },
    '3months': { price: '$2.97', period: 'total', savings: 'Save 5%' },
  },
  pro: {
    'weekly': { price: '$3.99', period: 'per week', savings: null },
    '1month': { price: '$4.99', period: 'per month', savings: null },
    '3months': { price: '$14.37', period: 'total', savings: 'Save 5%' },
  },
  premium: {
    'weekly': { price: '$11.99', period: 'per week', savings: null },
    '1month': { price: '$14.99', period: 'per month', savings: null },
    '3months': { price: '$43.47', period: 'total', savings: 'Save 5%' },
  },
};

const getPrice = (tier: SubscriptionTier, duration: SubscriptionDuration, iapLoaded: boolean = false): { price: string; period: string; savings: string | null } => {
  // Skip IAP for free tier
  if (tier === 'free') {
    return { price: '$0.00', period: 'free', savings: null };
  }

  // Only try to get IAP prices if IAP has been loaded
  if (iapLoaded) {
    try {
      const iapPrice = iapService.getSubscriptionPrice(tier, duration);

      if (iapPrice && iapPrice.price && iapPrice.price !== '$0.00') {
        // Calculate period and savings based on duration
        let period = 'per month';
        if (duration === 'weekly') period = 'per week';
        else if (duration === '3months') period = 'total';

        let savings = null;
        if (duration === '3months') savings = 'Save 5%';

        return {
          price: iapPrice.price,
          period,
          savings,
        };
      }
    } catch (error) {
      console.warn('[SubscriptionScreen] Error getting IAP price:', error);
    }
  }

  // Fallback to hardcoded pricing
  const fallbackPrice = PRICING[tier]?.[duration];
  if (fallbackPrice) {
    return fallbackPrice;
  }

  // Ultimate fallback if something goes wrong
  return { price: '$0.00', period: 'per month', savings: null };
};

// Memoize tier lookup map
const TIER_MAP = new Map(TIERS.map(tier => [tier.id, tier]));

const TEAL_COLOR = '#16A085';
const LIGHT_TEAL = '#E8F5F3';

// Duration labels lookup
const DURATION_LABELS: Record<SubscriptionDuration, string> = {
  'weekly': 'Weekly',
  '1month': 'Monthly',
  '3months': '3 months',
};

const SUBSCRIPTION_DURATIONS: SubscriptionDuration[] = ['weekly', '1month', '3months'];

const SUBSCRIPTION_TABS: MediaTypeTabConfig<SubscriptionTabType>[] = [
  { id: 'credits', label: 'Credits', icon: 'wallet-outline' },
  // Subscriptions tab temporarily disabled for testing credit packs
  // { id: 'subscriptions', label: 'Subscriptions', icon: 'card-outline' },
];

const SubscriptionScreen = () => {
  const { theme } = useTheme();
  const scrollBottomPadding = useScrollBottomPadding();
  const navigation = useNavigation<NavigationProp<'Subscription'>>();
  
  const [activeTab, setActiveTab] = useState<SubscriptionTabType>('credits');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [creditsAllocated, setCreditsAllocated] = useState(0);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro');
  const [selectedDuration, setSelectedDuration] = useState<SubscriptionDuration>('weekly');
  const [isCancelled, setIsCancelled] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | undefined>();
  const [currentBillingPeriod, setCurrentBillingPeriod] = useState<SubscriptionDuration | undefined>();
  const [selectedPackDetail, setSelectedPackDetail] = useState<string | null>(null);
  const [expandedTier, setExpandedTier] = useState<SubscriptionTier | null>('pro');
  const [iapPricesLoaded, setIapPricesLoaded] = useState(false);
  const [revenueCatOffering, setRevenueCatOffering] = useState<Offering | null>(null);

  // Memoize styles to avoid recalculation on every render
  const styles = useMemo(() => createStyles(theme, scrollBottomPadding), [theme, scrollBottomPadding]);

  // Memoize selected tier info
  const selectedTierInfo = useMemo(() => TIER_MAP.get(selectedTier) || TIERS[1], [selectedTier]);
  const currentTierInfo = useMemo(() => TIER_MAP.get(subscriptionTier), [subscriptionTier]);

  useEffect(() => {
    loadSubscriptionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSubscriptionData = useCallback(async () => {
    setLoading(true);
    try {
      // Parallelize API calls for better performance
      const [info, purchased] = await Promise.all([
        SubscriptionService.getSubscriptionInfo(),
        SubscriptionService.getPurchasedCredits(),
        iapService.initialize(), // Initialize IAP and fetch prices
      ]);

      setIsSubscribed(info.tier !== 'free');
      setSubscriptionTier(info.tier);
      setCreditsRemaining(info.creditsRemaining);
      setCreditsAllocated(info.creditsAllocated);
      setPurchasedCredits(purchased);
      setIsCancelled(info.isCancelled ?? false);
      setSubscriptionEndDate(info.endDate);
      setCurrentBillingPeriod(info.billingPeriod);
      setIapPricesLoaded(true);

      // Load RevenueCat offerings if available
      if (revenueCatService.isReady()) {
        try {
          const offering = await revenueCatService.getOfferings();
          setRevenueCatOffering(offering);
          console.log('[SubscriptionScreen] RevenueCat offerings loaded successfully');
        } catch (error) {
          console.warn('[SubscriptionScreen] Failed to load RevenueCat offerings:', error);
        }
      }

      // Auto-select current tier when subscribed, but keep weekly as default duration
      if (info.tier !== 'free') {
        setSelectedTier(info.tier);
        setExpandedTier(info.tier); // Also expand the current tier
        // Note: We don't set selectedDuration here - weekly remains the default
        // This ensures all plans preview with weekly pricing regardless of current subscription
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      setIapPricesLoaded(true); // Still set to true to use fallback prices
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTierSelect = useCallback((tier: SubscriptionTier) => {
    haptic.light();
    setSelectedTier(tier);
    // Toggle expanded state: if clicking the same tier, collapse it; otherwise expand the new tier
    setExpandedTier(prev => prev === tier ? null : tier);
  }, []);

  const handleDurationSelect = useCallback((duration: SubscriptionDuration) => {
    haptic.light();
    setSelectedDuration(duration);
  }, []);

  const handleSubscribe = useCallback(async () => {
    haptic.medium();
    const priceInfo = getPrice(selectedTier, selectedDuration, iapPricesLoaded);

    // Safety check: ensure priceInfo exists
    if (!priceInfo || !priceInfo.price) {
      Alert.alert('Error', 'Unable to retrieve pricing information. Please try again.');
      return;
    }

    const tierName = selectedTierInfo.name;

    Alert.alert(
      'Complete Purchase',
      `You're about to purchase ${tierName} Plan (${priceInfo.price} ${priceInfo.period}). Continue to App Store?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: async () => {
          try {
            let success = false;

            // If RevenueCat is available, use it for purchase
            if (revenueCatService.isReady() && revenueCatOffering) {
              console.log('[SubscriptionScreen] Using RevenueCat for purchase');

              // Find the right package based on tier and duration
              // Product ID format: com.midego.aiphotoeditor.[tier].[duration]
              const productId = `com.midego.aiphotoeditor.${selectedTier}.${selectedDuration}`;
              console.log('[SubscriptionScreen] Looking for product:', productId);

              // Search through all available packages
              const allPackages = revenueCatOffering.availablePackages;
              const matchingPackage = allPackages.find(pkg =>
                pkg.product.identifier === productId
              );

              if (matchingPackage) {
                console.log('[SubscriptionScreen] Found matching package:', matchingPackage.identifier);

                // Purchase through RevenueCat
                const customerInfo = await revenueCatService.purchasePackage(matchingPackage);

                // Verify purchase was successful by checking entitlements
                const hasPurchase = customerInfo.entitlements.active[selectedTier] !== undefined;

                if (hasPurchase) {
                  success = true;
                  console.log('[SubscriptionScreen] RevenueCat purchase successful');

                  // Refresh subscription data to sync with RevenueCat
                  await loadSubscriptionData();
                } else {
                  console.warn('[SubscriptionScreen] Purchase completed but entitlement not active');
                }
              } else {
                console.warn('[SubscriptionScreen] Package not found for:', productId);
                console.warn('[SubscriptionScreen] Available packages:', allPackages.map(p => p.product.identifier));
                Alert.alert(
                  'Product Not Available',
                  'This subscription package is not currently available. Please try a different option or contact support.'
                );
                return;
              }
            } else {
              // Fallback to local-only purchase (for Expo Go or when RevenueCat not available)
              console.log('[SubscriptionScreen] Using local storage for purchase (RevenueCat not available)');
              success = await SubscriptionService.purchaseSubscription(selectedTier, selectedDuration);

              if (success) {
                await loadSubscriptionData();
              }
            }

            if (success) {
              haptic.success();
              Alert.alert(
                'Purchase Successful! 🎉',
                `Thank you for upgrading to ${tierName}!\n\nYou now have access to all ${tierName.toLowerCase()} features.`,
                [{ text: 'Start Using Premium' }]
              );
            } else {
              haptic.error();
              Alert.alert('Error', 'Failed to process subscription. Please try again.');
            }
          } catch (error: any) {
            console.error('[SubscriptionScreen] Purchase error:', error);
            haptic.error();

            // Handle user cancellation gracefully
            if (error.code === '1' || error.userCancelled) {
              console.log('[SubscriptionScreen] User cancelled purchase');
              return;
            }

            Alert.alert(
              'Purchase Failed',
              error.message || 'An error occurred while processing your purchase. Please try again.'
            );
          }
        }}
      ]
    );
  }, [selectedTier, selectedDuration, selectedTierInfo, loadSubscriptionData, revenueCatOffering]);

  const handleBuyCreditPack = useCallback(async (pack: CreditPack) => {
    haptic.medium();
    Alert.alert(
      'Purchase Credit Pack',
      `You're about to purchase ${pack.name} (${pack.credits} credits) for ${pack.price}. Continue to App Store?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: async () => {
          const success = await SubscriptionService.purchaseCreditPack(pack.id);
          if (success) {
            haptic.success();
            Alert.alert(
              'Purchase Successful! 🎉',
              `You've purchased ${pack.credits} credits! They're available now and never expire.`,
              [{ text: 'Great!', onPress: loadSubscriptionData }]
            );
          } else {
            haptic.error();
            Alert.alert('Error', 'Failed to process purchase. Please try again.');
          }
        }}
      ]
    );
  }, [loadSubscriptionData]);

  const handleCancelSubscription = useCallback(async () => {
    haptic.medium();
    Alert.alert(
      'Cancel Subscription',
      'Your subscription will remain active until the end of the current billing period. Unused credits will be preserved. Continue?',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { text: 'Cancel Subscription', style: 'destructive', onPress: async () => {
          const success = await SubscriptionService.cancelSubscription();
          if (success) {
            haptic.success();
            Alert.alert('Subscription Cancelled', 'Your subscription will remain active until the end of the current period.');
            await loadSubscriptionData();
          } else {
            haptic.error();
            Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
          }
        }}
      ]
    );
  }, [loadSubscriptionData]);

  const handleRestorePurchases = useCallback(() => {
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
  }, []);

  const handleTermsPress = useCallback(() => {
    Linking.openURL('https://example.com/terms').catch(() => {
      Alert.alert('Error', 'Could not open terms and conditions');
    });
  }, []);

  const handleResetSubscription = useCallback(async () => {
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
  }, [loadSubscriptionData]);

  const handleBack = useCallback(() => {
    haptic.light();
    navigation.goBack();
  }, [navigation]);

  // Memoize credit packs with calculated prices (using IAP if available)
  const creditPacksWithPrices = useMemo(() => {
    return CREDIT_PACKS.map(pack => {
      // Try to get localized price from IAP
      const iapPrice = iapPricesLoaded ? iapService.getCreditPackPrice(pack.id) : null;
      const price = iapPrice && iapPrice.price !== '$0.00' ? iapPrice.price : pack.price;

      const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
      const pricePerCredit = (priceNum / pack.credits).toFixed(2);
      return { ...pack, price, pricePerCredit };
    });
  }, [iapPricesLoaded]);

  // Calculate average price per credit (weighted by pack popularity/use)
  const averagePricePerCredit = useMemo(() => {
    const totalPrice = creditPacksWithPrices.reduce((sum, pack) => {
      return sum + parseFloat(pack.price.replace(/[^0-9.]/g, ''));
    }, 0);
    const totalCredits = creditPacksWithPrices.reduce((sum, pack) => sum + pack.credits, 0);
    return totalPrice / totalCredits;
  }, [creditPacksWithPrices]);

  // Get tools with credit costs (excluding free tools)
  const toolsWithCosts = useMemo(() => {
    return Object.values(EDIT_MODES)
      .filter(mode => mode.creditCost && mode.creditCost > 0)
      .sort((a, b) => {
        // Sort by credit cost, then alphabetically
        if (a.creditCost !== b.creditCost) {
          return (a.creditCost || 0) - (b.creditCost || 0);
        }
        return a.name.localeCompare(b.name);
      })
      .map(mode => {
        const creditCost = mode.creditCost || 0;
        const dollarCost = creditCost * averagePricePerCredit;
        const imagesPerDollar = dollarCost > 0 ? (1 / dollarCost) : 0;

        return {
          name: mode.name,
          icon: mode.icon,
          creditCost,
          dollarCost: dollarCost.toFixed(3),
          imagesPerDollar: imagesPerDollar >= 1 ? Math.floor(imagesPerDollar) : imagesPerDollar.toFixed(1),
          isPremium: mode.isPremium || false,
        };
      });
  }, [averagePricePerCredit]);

  // Memoize duration options with price info
  const durationOptions = useMemo(() => {
    return SUBSCRIPTION_DURATIONS.map(duration => {
      const priceInfo = getPrice(selectedTier, duration, iapPricesLoaded);
      const isSelected = selectedDuration === duration;
      const subtitleParts = [];
      if (duration === '3months') {
        subtitleParts.push('Best Value');
      }
      if (priceInfo.savings) {
        subtitleParts.push(priceInfo.savings);
      }
      const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : '\u00A0';
      
      return {
        duration,
        priceInfo,
        isSelected,
        label: DURATION_LABELS[duration],
        subtitle,
      };
    });
  }, [selectedTier, selectedDuration, iapPricesLoaded]);

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

  // Render Credits Tab Content
  const renderCreditsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.content}>
        {/* Credit Balance Summary - With Stacked Progress Bar */}
        <View style={styles.balanceCardsContainer}>
          {/* Main Credit Balance Card */}
          <View style={[styles.mainBalanceCard, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.balanceCardHeader}>
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
              <Text style={styles.balanceCardLabel}>Available Credits</Text>
            </View>
            <Text style={styles.balanceCardValue}>{creditsRemaining.toFixed(1)}</Text>
            <Text style={styles.balanceCardSubtext}>credits ready to use</Text>

            {/* Stacked Progress Bar - Only show if subscribed or has purchased credits */}
            {(isSubscribed || purchasedCredits > 0) && (
              <View style={styles.creditBreakdownContainer}>
                <View style={styles.stackedProgressBar}>
                  {/* Monthly credits segment */}
                  {isSubscribed && creditsAllocated > 0 && (
                    <View
                      style={[
                        styles.progressSegment,
                        {
                          flex: creditsAllocated,
                          backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        }
                      ]}
                    />
                  )}
                  {/* Purchased credits segment */}
                  {purchasedCredits > 0 && (
                    <View
                      style={[
                        styles.progressSegment,
                        {
                          flex: purchasedCredits,
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        }
                      ]}
                    />
                  )}
                </View>

                {/* Labels below the bar */}
                <View style={styles.creditBreakdownLabels}>
                  {isSubscribed && creditsAllocated > 0 && (
                    <View style={styles.breakdownLabelItem}>
                      <View style={[styles.breakdownDot, { backgroundColor: 'rgba(255, 255, 255, 0.85)' }]} />
                      <Text style={styles.breakdownLabelText}>{creditsAllocated} monthly</Text>
                    </View>
                  )}
                  {purchasedCredits > 0 && (
                    <View style={styles.breakdownLabelItem}>
                      <View style={[styles.breakdownDot, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }]} />
                      <Text style={styles.breakdownLabelText}>{purchasedCredits.toFixed(1)} purchased</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Credit Packs - 2x2 Grid */}
        <Text style={[styles.sectionTitleCompact, { color: theme.colors.text }]}>Buy Credit Packs</Text>
        <View style={styles.creditPacksGrid}>
          {creditPacksWithPrices.map((pack) => {
            const isSelected = selectedPackDetail === pack.id;

            return (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.creditPackWrapper,
                  styles.creditPackCard,
                  {
                    backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  }
                ]}
                onPress={() => setSelectedPackDetail(pack.id)}
                activeOpacity={0.7}
              >
                {pack.popular && (
                  <View style={[styles.popularTag, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
                    <Text style={styles.popularTagText}>Best</Text>
                  </View>
                )}

                <View style={[styles.packIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Ionicons name="diamond" size={24} color={theme.colors.primary} />
                </View>

                <Text style={[styles.packCreditsAmount, { color: theme.colors.text }]}>
                  {pack.credits}
                </Text>
                <Text style={[styles.packCreditsLabel, { color: theme.colors.textSecondary }]}>
                  credits
                </Text>

                <Text style={[styles.packPrice, { color: theme.colors.text }]}>
                  {pack.price}
                </Text>
                <Text style={[styles.packPricePerCredit, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>
                  ${pack.pricePerCredit}/credit
                </Text>

                <TouchableOpacity
                  style={[styles.packButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleBuyCreditPack(pack)}
                >
                  <Text style={styles.packButtonText}>Purchase</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Single Info Section for Selected Pack */}
        {selectedPackDetail && (() => {
          const selectedPack = creditPacksWithPrices.find(p => p.id === selectedPackDetail);
          if (!selectedPack) return null;

          // Get currency symbol from price (works for any currency)
          const currencyMatch = selectedPack.price.match(/[^\d.,]+/);
          const currencySymbol = currencyMatch ? currencyMatch[0] : '$';
          const priceNum = parseFloat(selectedPack.price.replace(/[^0-9.]/g, ''));
          const per10 = (priceNum / selectedPack.credits * 10).toFixed(2);
          const per100 = (priceNum / selectedPack.credits * 100).toFixed(2);
          const creditsPerUnit = (selectedPack.credits / priceNum).toFixed(1);

          // Get user's currency from IAP (if available)
          const userCurrency = iapPricesLoaded ? iapService.getUserCurrency() : 'USD';

          return (
            <View style={[styles.packDetailsExternal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.packDetailsHeader}>
                <Text style={[styles.packDetailsTitle, { color: theme.colors.text }]}>
                  💎 {selectedPack.credits} Credits Pack Details
                </Text>
                <TouchableOpacity onPress={() => setSelectedPackDetail(null)}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.packDetailsDescription, { color: theme.colors.textSecondary }]}>
                See how much value you get with this credit pack
              </Text>

              <View style={styles.packDetailsSection}>
                <Text style={[styles.packDetailsSectionTitle, { color: theme.colors.text }]}>Bulk Pricing</Text>
                <View style={styles.packDetailsRow}>
                  <Text style={[styles.packDetailsLabel, { color: theme.colors.textSecondary }]}>10 credits</Text>
                  <Text style={[styles.packDetailsValue, { color: theme.colors.text }]}>{currencySymbol}{per10}</Text>
                </View>
                <View style={styles.packDetailsRow}>
                  <Text style={[styles.packDetailsLabel, { color: theme.colors.textSecondary }]}>100 credits</Text>
                  <Text style={[styles.packDetailsValue, { color: theme.colors.text }]}>{currencySymbol}{per100}</Text>
                </View>
              </View>

              <View style={[styles.packDetailsSection, { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.md }]}>
                <Text style={[styles.packDetailsSectionTitle, { color: theme.colors.text }]}>Value</Text>
                <View style={styles.packDetailsRow}>
                  <Text style={[styles.packDetailsLabel, { color: theme.colors.textSecondary }]}>Credits per {currencySymbol}1 {userCurrency}</Text>
                  <Text style={[styles.packDetailsValue, { color: theme.colors.primary, fontWeight: theme.typography.weight.bold }]}>{creditsPerUnit}</Text>
                </View>
              </View>

              <Text style={[styles.packDetailsNote, { color: theme.colors.textTertiary }]}>
                💡 Credits never expire and can be used on any AI-powered tool
              </Text>
            </View>
          );
        })()}

        {/* Credits Explanation - Full Width */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.infoHeaderWithIcon}>
            <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              How Credits Work
            </Text>
          </View>

          <View style={styles.infoPointsContainer}>
            <View style={styles.infoPoint}>
              <View style={[styles.infoBulletCircle, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="flash" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.infoPointContent}>
                <Text style={[styles.infoPointTitle, { color: theme.colors.text }]}>Pay per use</Text>
                <Text style={[styles.infoPointText, { color: theme.colors.textSecondary }]}>
                  Credits are consumed only when processing succeeds
                </Text>
              </View>
            </View>

            <View style={styles.infoPoint}>
              <View style={[styles.infoBulletCircle, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="sync" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.infoPointContent}>
                <Text style={[styles.infoPointTitle, { color: theme.colors.text }]}>Monthly renewal</Text>
                <Text style={[styles.infoPointText, { color: theme.colors.textSecondary }]}>
                  Subscription credits refresh every billing cycle
                </Text>
              </View>
            </View>

            <View style={styles.infoPoint}>
              <View style={[styles.infoBulletCircle, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="infinite" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.infoPointContent}>
                <Text style={[styles.infoPointTitle, { color: theme.colors.text }]}>No expiration</Text>
                <Text style={[styles.infoPointText, { color: theme.colors.textSecondary }]}>
                  Purchased credits never expire and roll over
                </Text>
              </View>
            </View>

            <View style={styles.infoPoint}>
              <View style={[styles.infoBulletCircle, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="gift" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.infoPointContent}>
                <Text style={[styles.infoPointTitle, { color: theme.colors.text }]}>Free tools included</Text>
                <Text style={[styles.infoPointText, { color: theme.colors.textSecondary }]}>
                  Basic editing tools like Crop & Rotate are always free
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cost Per Tool - Redesigned with Cards */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, marginTop: theme.spacing.lg }]}>
          <View style={styles.infoHeaderWithIcon}>
            <View style={[styles.infoIconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="calculator" size={24} color={theme.colors.primary} />
            </View>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              Cost Per Tool
            </Text>
          </View>

          <Text style={[styles.costSubtitle, { color: theme.colors.textSecondary }]}>
            Approximate costs based on current credit pack pricing
          </Text>

          <View style={styles.toolCardsContainer}>
            {toolsWithCosts.map((tool, index) => {
              const imagesPerDollar = parseFloat(tool.imagesPerDollar);
              const valueText = imagesPerDollar >= 1
                ? `${Math.floor(imagesPerDollar)} images per ${iapPricesLoaded ? iapService.getUserCurrency() : 'USD'}`
                : `${tool.imagesPerDollar} images per ${iapPricesLoaded ? iapService.getUserCurrency() : 'USD'}`;

              return (
                <View
                  key={`tool-${index}`}
                  style={[
                    styles.toolCard,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    }
                  ]}
                >
                  <View style={styles.toolCardHeader}>
                    <View style={styles.toolCardLeft}>
                      <Text style={styles.toolCardIcon}>{tool.icon}</Text>
                      <View style={styles.toolCardNameContainer}>
                        <Text style={[styles.toolCardName, { color: theme.colors.text }]} numberOfLines={1}>
                          {tool.name}
                        </Text>
                        {tool.isPremium && (
                          <View style={[styles.premiumBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Ionicons name="star" size={10} color={theme.colors.primary} />
                            <Text style={[styles.premiumBadgeText, { color: theme.colors.primary }]}>Premium</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.toolCardCredits}>
                      <Text style={[styles.toolCardCreditsValue, { color: theme.colors.primary }]}>
                        {formatCreditCost(tool.creditCost)}
                      </Text>
                      <Text style={[styles.toolCardCreditsLabel, { color: theme.colors.textSecondary }]}>
                        credits
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.toolCardDivider, { backgroundColor: theme.colors.border }]} />

                  <View style={styles.toolCardFooter}>
                    <View style={styles.toolCardCost}>
                      <Text style={[styles.toolCardCostLabel, { color: theme.colors.textSecondary }]}>
                        Est. Cost
                      </Text>
                      <Text style={[styles.toolCardCostValue, { color: theme.colors.text }]}>
                        ~${tool.dollarCost}
                      </Text>
                    </View>
                    <View style={styles.toolCardValue}>
                      <Text style={[styles.toolCardValueLabel, { color: theme.colors.textSecondary }]}>
                        Value
                      </Text>
                      <Text style={[styles.toolCardValueText, { color: theme.colors.success }]} numberOfLines={1}>
                        {valueText}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.costNoteContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.textTertiary} />
            <Text style={[styles.costNoteText, { color: theme.colors.textTertiary }]}>
              Prices vary based on credit pack purchased. Costs shown are estimates.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Render Subscriptions Tab Content
  const renderSubscriptionsTab = () => (
    <View style={styles.tabContent}>
      {isSubscribed ? (
        // Subscribed State - Compact Version
        <View style={styles.premiumContent}>
          <View style={[
            styles.statusCardCompact,
            {
              backgroundColor: isCancelled ? '#FF9500' + '15' : theme.colors.success + '15',
              borderColor: isCancelled ? '#FF9500' : theme.colors.success,
            }
          ]}>
            <View style={styles.statusCardContent}>
              <Ionicons
                name={isCancelled ? "alert-circle" : "checkmark-circle"}
                size={24}
                color={isCancelled ? '#FF9500' : theme.colors.success}
              />
              <View style={styles.statusTextContainer}>
                <Text style={[
                  styles.statusTitleCompact,
                  { color: isCancelled ? '#FF9500' : theme.colors.success }
                ]}>
                  {isCancelled
                    ? 'Subscription Cancelled'
                    : `${currentTierInfo?.emoji} ${currentTierInfo?.name || 'Subscription'} Active`}
                </Text>
                <Text style={[styles.statusSubtitleCompact, { color: theme.colors.textSecondary }]}>
                  {`${creditsRemaining.toFixed(1)} / ${creditsAllocated} credits remaining`}
                </Text>
                {subscriptionEndDate && (
                  <Text style={[styles.statusSubtitleCompact, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                    {isCancelled
                      ? (() => {
                          const endDate = new Date(subscriptionEndDate);
                          const formattedDate = endDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });
                          return `Expires ${formattedDate}`;
                        })()
                      : (() => {
                          const renewDate = new Date(subscriptionEndDate);
                          const formattedDate = renewDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });
                          return `Renews ${formattedDate} • +${creditsAllocated} credits`;
                        })()}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {!isCancelled && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: '#FF3B30' }]}
              onPress={handleCancelSubscription}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: '#FF3B30' }]}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* When cancelled, show a clearer resubscribe section */}
      {isSubscribed && isCancelled && (
        <View style={styles.premiumContent}>
          <Text style={[styles.resubscribeTitle, { color: theme.colors.text }]}>
            Don't lose your premium access
          </Text>
          <Text style={[styles.resubscribeSubtitle, { color: theme.colors.textSecondary }]}>
            Resubscribe now to continue enjoying all features
          </Text>
        </View>
      )}

      <View style={isSubscribed ? styles.changePlanContainer : styles.content}>
        {/* Title */}
        {!isSubscribed && (
          <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
            Unlock the full experience.
          </Text>
        )}

        {/* Tier Selection with Inline Duration - Vertical List */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: theme.spacing.sm }]}>
          {isCancelled ? 'Resubscribe to a Plan' : isSubscribed ? 'Change Your Plan' : 'Choose Your Plan'}
        </Text>
        <View style={styles.tiersList}>
          {TIERS.map((tier, index) => {
            const isExpanded = expandedTier === tier.id;
            const isCurrentTier = isSubscribed && subscriptionTier === tier.id;
            const priceInfo = getPrice(tier.id, selectedDuration, iapPricesLoaded);

            // Safety check: ensure priceInfo exists
            if (!priceInfo || !priceInfo.price) {
              return null;
            }

            // Calculate total price for multi-month durations
            let totalPrice = null;
            if (selectedDuration === '3months') {
              // 3-month prices are already total prices, not per-month
              totalPrice = `${priceInfo.price} total`;
            }

            return (
              <View key={tier.id}>
                <TouchableOpacity
                  style={[
                    styles.tierListCard,
                    {
                      backgroundColor: isExpanded ? theme.colors.primary + '10' : theme.colors.surface,
                      borderColor: isExpanded ? theme.colors.primary : theme.colors.border,
                      borderWidth: isExpanded ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleTierSelect(tier.id)}
                  activeOpacity={0.7}
                >
                  {/* Left side - Icon and Selection */}
                  <View style={styles.tierListLeft}>
                    <View style={[
                      styles.tierIconCircle,
                      {
                        backgroundColor: isExpanded ? theme.colors.primary + '20' : theme.colors.background,
                      }
                    ]}>
                      <Text style={styles.tierEmojiList}>{tier.emoji}</Text>
                    </View>
                    {isExpanded && (
                      <View style={[styles.selectedCheckmark, { backgroundColor: theme.colors.primary }]}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  {/* Center - Tier Info */}
                  <View style={styles.tierListCenter}>
                    <View style={styles.tierListHeader}>
                      <Text style={[styles.tierListName, { color: theme.colors.text }]}>{tier.name}</Text>
                      {isCurrentTier && !isCancelled && (
                        <View style={[styles.currentBadgeSmall, { backgroundColor: theme.colors.success }]}>
                          <Text style={styles.currentBadgeTextSmall}>Current</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.tierListDescription, { color: theme.colors.textSecondary }]}>
                      {tier.description}
                    </Text>
                    <View style={styles.tierListFeatures}>
                      {tier.features.slice(0, 2).map((feature, idx) => (
                        <View key={idx} style={styles.tierListFeature}>
                          <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary} />
                          <Text style={[styles.tierListFeatureText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Right - Price */}
                  <View style={styles.tierListRight}>
                    <Text style={[styles.tierListPrice, { color: theme.colors.text }]}>
                      {priceInfo.price}
                    </Text>
                    <Text style={[styles.tierListPeriod, { color: theme.colors.textSecondary }]}>
                      {priceInfo.period}
                    </Text>
                    {totalPrice && (
                      <Text style={[styles.tierListTotal, { color: theme.colors.textSecondary }]}>
                        {totalPrice}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Duration Selection - Shown when tier is expanded */}
                {isExpanded && (
                  <View style={[styles.durationSelector, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.durationLabel, { color: theme.colors.textSecondary }]}>
                      Select Duration
                    </Text>
                    <View style={styles.durationList}>
                      {SUBSCRIPTION_DURATIONS.map((duration) => {
                        const durationPrice = getPrice(tier.id, duration, iapPricesLoaded);
                        
                        // Safety check: ensure durationPrice exists
                        if (!durationPrice || !durationPrice.price) {
                          return null;
                        }
                        
                        const isDurationSelected = selectedDuration === duration;
                        const savings = durationPrice.savings;

                        // Calculate total price for multi-month durations
                        let totalPrice = null;
                        // 3-month prices are already total prices, not per-month
                        if (duration === '3months') {
                          totalPrice = `${durationPrice.price} total`;
                        }

                        return (
                          <TouchableOpacity
                            key={duration}
                            style={[
                              styles.durationListItem,
                              {
                                backgroundColor: isDurationSelected ? theme.colors.primary + '15' : theme.colors.surface,
                                borderColor: isDurationSelected ? theme.colors.primary : theme.colors.border,
                              }
                            ]}
                            onPress={() => handleDurationSelect(duration)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.durationListLeft}>
                              <View style={[
                                styles.durationRadio,
                                {
                                  borderColor: isDurationSelected ? theme.colors.primary : theme.colors.border,
                                  backgroundColor: isDurationSelected ? theme.colors.primary : 'transparent',
                                }
                              ]}>
                                {isDurationSelected && (
                                  <View style={styles.durationRadioInner} />
                                )}
                              </View>
                              <View style={styles.durationListInfo}>
                                <Text style={[
                                  styles.durationListLabel,
                                  { color: theme.colors.text, fontWeight: isDurationSelected ? theme.typography.weight.bold : theme.typography.weight.medium }
                                ]}>
                                  {DURATION_LABELS[duration]}
                                </Text>
                                {savings && (
                                  <Text style={[
                                    styles.durationListSavings,
                                    { color: theme.colors.success }
                                  ]}>
                                    {savings}
                                  </Text>
                                )}
                              </View>
                            </View>
                            <View style={styles.durationListPriceContainer}>
                              <Text style={[
                                styles.durationListPrice,
                                { color: theme.colors.text, fontWeight: isDurationSelected ? theme.typography.weight.bold : theme.typography.weight.semibold }
                              ]}>
                                {durationPrice.price}
                              </Text>
                              {totalPrice && (
                                <Text style={[
                                  styles.durationListTotal,
                                  { color: theme.colors.textSecondary }
                                ]}>
                                  {totalPrice}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Subscribe Button */}
      <View style={styles.subscribeButtonContainer}>
        {(() => {
          const isCurrentPlan = isSubscribed && 
            !isCancelled && 
            selectedTier === subscriptionTier && 
            selectedDuration === currentBillingPeriod;
          
          return (
            <TouchableOpacity
              style={[
                styles.subscribeButton, 
                { 
                  backgroundColor: isCurrentPlan ? theme.colors.surface : TEAL_COLOR,
                  opacity: isCurrentPlan ? 0.6 : 1,
                }
              ]}
              onPress={isCurrentPlan ? undefined : handleSubscribe}
              activeOpacity={isCurrentPlan ? 1 : 0.8}
              disabled={isCurrentPlan}
            >
              <Text style={[
                styles.subscribeButtonText,
                isCurrentPlan && { color: theme.colors.textSecondary }
              ]}>
                {isCancelled 
                  ? 'Resubscribe Now' 
                  : isSubscribed 
                    ? isCurrentPlan
                      ? 'Current Plan'
                      : 'Update Subscription'
                    : 'Try for free and subscribe'}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Footer Text */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            7 days trial, cancel anytime.{' '}
            <Text 
              style={[styles.footerLink, { color: TEAL_COLOR }]}
              onPress={handleTermsPress}
            >
              Terms and conditions apply.
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={[]}>
      <MainHeader 
        title="Subscription" 
        showConnected={false} 
        backgroundColor={theme.colors.backgroundSecondary}
        onBack={handleBack}
      />

      {/* Tabbed Interface */}
      <MediaTypeTabs<SubscriptionTabType>
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={SUBSCRIPTION_TABS}
        containerStyle={{ backgroundColor: theme.colors.background }}
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'credits' ? renderCreditsTab() : renderSubscriptionsTab()}
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
      paddingBottom: scrollBottomPadding,
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing['2xl'],
    },
    tabContent: {
      flex: 1,
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
    summaryCard: {
      borderRadius: theme.spacing.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    summaryTitle: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginBottom: theme.spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.sm,
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: theme.typography.scaled.sm,
      marginBottom: theme.spacing.xs,
    },
    summaryValue: {
      fontSize: theme.typography.scaled.xl,
      fontWeight: theme.typography.weight.bold,
    },
    summaryNote: {
      fontSize: theme.typography.scaled.sm,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
      fontStyle: 'italic',
    },
    popularBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    popularBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    tiersContainer: {
      marginBottom: theme.spacing.md,
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
      marginBottom: theme.spacing.md,
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
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
    },
    packsContainer: {
      marginBottom: theme.spacing.md,
    },
    packCard: {
      marginHorizontal: theme.spacing.xl,
    },
    changePlanContainer: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
      paddingBottom: 0,
    },
    contentCompact: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
    },
    subscribeButtonContainer: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
    },
    resubscribeTitle: {
      fontSize: theme.typography.scaled.xl,
      fontWeight: theme.typography.weight.bold,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    resubscribeSubtitle: {
      fontSize: theme.typography.scaled.base,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
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
      marginBottom: theme.spacing.xl,
    },
    actionButtonText: {
      color: theme.colors.background,
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
    },
    // New Enhanced Styles - Compact Version
    balanceCardsContainer: {
      marginBottom: theme.spacing.lg,
    },
    mainBalanceCard: {
      borderRadius: theme.spacing.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
      alignItems: 'center',
    },
    balanceCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    balanceCardLabel: {
      color: '#FFFFFF',
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.semibold,
      marginLeft: theme.spacing.xs,
      opacity: 0.9,
    },
    balanceCardValue: {
      color: '#FFFFFF',
      fontSize: 48,
      fontWeight: theme.typography.weight.bold,
      lineHeight: 52,
      marginBottom: 2,
    },
    balanceCardSubtext: {
      color: '#FFFFFF',
      fontSize: theme.typography.scaled.sm,
      opacity: 0.8,
      marginBottom: theme.spacing.md,
    },
    // Stacked Progress Bar Styles
    creditBreakdownContainer: {
      width: '100%',
      marginTop: theme.spacing.md,
    },
    stackedProgressBar: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginBottom: theme.spacing.sm,
    },
    progressSegment: {
      height: '100%',
    },
    creditBreakdownLabels: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
    },
    breakdownLabelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    breakdownDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    breakdownLabelText: {
      color: '#FFFFFF',
      fontSize: theme.typography.scaled.xs,
      opacity: 0.9,
    },
    breakdownCards: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    breakdownCard: {
      flex: 1,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.sm,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    breakdownIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xs,
    },
    breakdownValue: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginBottom: 2,
    },
    breakdownLabel: {
      fontSize: theme.typography.scaled.xs,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: theme.typography.scaled.xl,
      fontWeight: theme.typography.weight.bold,
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    sectionTitleCompact: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    creditPacksGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    creditPackWrapper: {
      width: '48%',
      maxWidth: 180,
    },
    creditPackCard: {
      borderRadius: theme.spacing.md,
      padding: theme.spacing.sm,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      alignItems: 'center',
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    popularTag: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    popularTagText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: theme.typography.weight.bold,
    },
    packIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xs,
    },
    packCreditsAmount: {
      fontSize: 24,
      fontWeight: theme.typography.weight.bold,
      lineHeight: 28,
    },
    packCreditsLabel: {
      fontSize: theme.typography.scaled.xs,
      marginBottom: theme.spacing.xs,
    },
    packPricing: {
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    packPrice: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
      marginBottom: 2,
    },
    packPricePerCredit: {
      fontSize: theme.typography.scaled.xs,
    },
    packButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 6,
      borderRadius: theme.spacing.sm,
      width: '100%',
      alignItems: 'center',
    },
    packButtonText: {
      color: '#FFFFFF',
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.semibold,
    },
    packDetailsExternal: {
      marginTop: theme.spacing.sm,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    packDetailsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    packDetailsTitle: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
      flex: 1,
    },
    packDetailsDescription: {
      fontSize: theme.typography.scaled.xs,
      marginBottom: theme.spacing.md,
      lineHeight: 18,
    },
    packDetailsSection: {
      marginBottom: theme.spacing.md,
    },
    packDetailsSectionTitle: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.semibold,
      marginBottom: theme.spacing.sm,
    },
    packDetailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    packDetailsLabel: {
      fontSize: theme.typography.scaled.xs,
    },
    packDetailsValue: {
      fontSize: theme.typography.scaled.xs,
      fontWeight: theme.typography.weight.medium,
    },
    packDetailsNote: {
      fontSize: theme.typography.scaled.xs,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: theme.spacing.xs,
    },
    // New Vertical Tier List
    tiersList: {
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    tierListCard: {
      borderRadius: theme.spacing.md,
      padding: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    tierListLeft: {
      marginRight: theme.spacing.md,
      position: 'relative',
    },
    tierIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tierEmojiList: {
      fontSize: 28,
    },
    selectedCheckmark: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    tierListCenter: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    tierListHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    tierListName: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.bold,
      marginRight: theme.spacing.xs,
    },
    currentBadgeSmall: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    currentBadgeTextSmall: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: theme.typography.weight.bold,
    },
    tierListDescription: {
      fontSize: theme.typography.scaled.xs,
      marginBottom: theme.spacing.xs,
    },
    tierListFeatures: {
      gap: 4,
    },
    tierListFeature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tierListFeatureText: {
      fontSize: theme.typography.scaled.xs,
      flex: 1,
    },
    tierListRight: {
      alignItems: 'flex-end',
      minWidth: 70,
    },
    tierListPrice: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginBottom: 2,
    },
    tierListPeriod: {
      fontSize: theme.typography.scaled.xs,
    },
    tierListTotal: {
      fontSize: theme.typography.scaled.xs,
      marginTop: 2,
    },
    // Inline Duration Selector
    durationSelector: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.spacing.md,
    },
    durationLabel: {
      fontSize: theme.typography.scaled.xs,
      fontWeight: theme.typography.weight.semibold,
      textTransform: 'uppercase',
      marginBottom: theme.spacing.sm,
      letterSpacing: 0.5,
    },
    durationList: {
      gap: theme.spacing.xs,
    },
    durationListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      borderWidth: 1,
    },
    durationListLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    durationRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
    },
    durationRadioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FFFFFF',
    },
    durationListInfo: {
      flex: 1,
    },
    durationListLabel: {
      fontSize: theme.typography.scaled.sm,
      marginBottom: 2,
    },
    durationListSavings: {
      fontSize: theme.typography.scaled.xs,
      fontWeight: theme.typography.weight.semibold,
    },
    durationListPriceContainer: {
      alignItems: 'flex-end',
      marginLeft: theme.spacing.sm,
    },
    durationListPrice: {
      fontSize: theme.typography.scaled.base,
    },
    durationListTotal: {
      fontSize: theme.typography.scaled.xs,
      marginTop: 2,
    },
    infoCard: {
      borderRadius: theme.spacing.lg,
      padding: theme.spacing.lg,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    infoHeaderWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    infoIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    infoTitle: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
    },
    infoSubtitle: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
    },
    infoText: {
      fontSize: theme.typography.scaled.sm,
      lineHeight: 20,
    },
    infoNote: {
      fontSize: theme.typography.scaled.xs,
      fontStyle: 'italic',
    },
    // How Credits Work - Points
    infoPointsContainer: {
      gap: theme.spacing.md,
    },
    infoPoint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    infoBulletCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
      marginTop: 2,
    },
    infoPointContent: {
      flex: 1,
    },
    infoPointTitle: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
      marginBottom: 4,
    },
    infoPointText: {
      fontSize: theme.typography.scaled.sm,
      lineHeight: 20,
    },
    // Cost Per Tool - Cards
    costSubtitle: {
      fontSize: theme.typography.scaled.sm,
      marginBottom: theme.spacing.lg,
      lineHeight: 20,
    },
    toolCardsContainer: {
      gap: theme.spacing.md,
    },
    toolCard: {
      borderRadius: theme.spacing.md,
      borderWidth: 1,
      padding: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    toolCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    toolCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: theme.spacing.md,
    },
    toolCardIcon: {
      fontSize: 28,
      marginRight: theme.spacing.md,
      width: 32,
      textAlign: 'center',
    },
    toolCardNameContainer: {
      flex: 1,
    },
    toolCardName: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
      marginBottom: 4,
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      alignSelf: 'flex-start',
      gap: 4,
    },
    premiumBadgeText: {
      fontSize: 10,
      fontWeight: theme.typography.weight.bold,
    },
    toolCardCredits: {
      alignItems: 'flex-end',
    },
    toolCardCreditsValue: {
      fontSize: theme.typography.scaled.xl,
      fontWeight: theme.typography.weight.bold,
      lineHeight: 28,
    },
    toolCardCreditsLabel: {
      fontSize: theme.typography.scaled.xs,
    },
    toolCardDivider: {
      height: 1,
      marginVertical: theme.spacing.sm,
    },
    toolCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    toolCardCost: {
      flex: 1,
    },
    toolCardCostLabel: {
      fontSize: theme.typography.scaled.xs,
      marginBottom: 4,
    },
    toolCardCostValue: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
    },
    toolCardValue: {
      flex: 1,
      alignItems: 'flex-end',
    },
    toolCardValueLabel: {
      fontSize: theme.typography.scaled.xs,
      marginBottom: 4,
    },
    toolCardValueText: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.medium,
      textAlign: 'right',
    },
    costNoteContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.sm,
      borderWidth: 1,
      gap: theme.spacing.sm,
    },
    costNoteText: {
      flex: 1,
      fontSize: theme.typography.scaled.xs,
      lineHeight: 18,
    },
    toolsList: {
      gap: theme.spacing.sm,
    },
    toolRow: {
      paddingVertical: theme.spacing.xs,
    },
    toolInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    toolIcon: {
      fontSize: 20,
      width: 28,
      textAlign: 'center',
      marginRight: theme.spacing.xs,
    },
    toolDetails: {
      flex: 1,
    },
    toolName: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.medium,
    },
    toolCost: {
      fontSize: theme.typography.scaled.xs,
      marginTop: 2,
    },
    premiumTag: {
      fontSize: theme.typography.scaled.xs,
    },
    premiumTagSmall: {
      fontSize: 9,
      fontWeight: theme.typography.weight.semibold,
      marginTop: 2,
    },
    // Table Styles
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      borderBottomWidth: 1,
      marginBottom: 2,
    },
    tableHeaderCell1: {
      flex: 2.5,
      justifyContent: 'center',
    },
    tableHeaderCell2: {
      flex: 1.2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tableHeaderCell3: {
      flex: 1.2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tableHeaderCell4: {
      flex: 1.3,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tableHeaderText: {
      fontSize: theme.typography.scaled.xs,
      fontWeight: theme.typography.weight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    toolsTable: {
      borderRadius: theme.spacing.sm,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
      alignItems: 'center',
      borderBottomWidth: 0.5,
    },
    tableCell1: {
      flex: 2.5,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tableCell2: {
      flex: 1.2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tableCell3: {
      flex: 1.2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tableCell4: {
      flex: 1.3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tableCellText: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.medium,
    },
    tableCellTextValue: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.bold,
    },
    tableCellTextValueLabel: {
      fontSize: theme.typography.scaled.xs,
      marginTop: 2,
    },
    // Compact Status Card
    statusCardCompact: {
      borderRadius: theme.spacing.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      alignItems: 'center',
    },
    statusCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusTextContainer: {
      marginLeft: theme.spacing.sm,
      alignItems: 'center',
    },
    statusTitleCompact: {
      fontSize: theme.typography.scaled.base,
      fontWeight: theme.typography.weight.semibold,
      marginBottom: 2,
      textAlign: 'center',
    },
    statusSubtitleCompact: {
      fontSize: theme.typography.scaled.xs,
      textAlign: 'center',
    },
    cancelButton: {
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      marginBottom: theme.spacing.md,
    },
    cancelButtonText: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.medium,
    },
  });

export default SubscriptionScreen;
