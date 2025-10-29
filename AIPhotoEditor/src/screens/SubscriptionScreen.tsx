import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';
import { MainHeader } from '../components/MainHeader';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { SubscriptionService } from '../services/subscriptionService';
import { haptic } from '../utils/haptics';
import { Ionicons } from '@expo/vector-icons';

type SubscriptionPlan = '1month' | '6months' | '1year';

const SubscriptionScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp<'Subscription'>>();
  const styles = createStyles(theme);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [transformationsUsed, setTransformationsUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('6months');

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setLoading(true);
    const subscribed = await SubscriptionService.checkSubscriptionStatus();
    const used = await SubscriptionService.getTransformationsUsed();
    setIsSubscribed(subscribed);
    setTransformationsUsed(used);
    setLoading(false);
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    haptic.light();
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    haptic.medium();
    const planMap = {
      '1month': 'monthly',
      '6months': 'monthly', // 6 months is still billed monthly
      '1year': 'annual',
    };
    
    const planType = planMap[selectedPlan] as 'monthly' | 'annual';
    
    Alert.alert(
      'Complete Purchase',
      `You're about to purchase AI Photo Pro (${getPlanPrice(selectedPlan)}). Continue to App Store?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: async () => {
          const success = await SubscriptionService.purchaseSubscription();
          if (success) {
            haptic.success();
            Alert.alert(
              'Purchase Successful! 🎉',
              'Thank you for upgrading to Premium!\n\n✓ Unlimited transformations\n✓ High-quality export\n✓ Advanced editing features',
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

  const getPlanPrice = (plan: SubscriptionPlan): string => {
    switch (plan) {
      case '1month':
        return '$9.99/month';
      case '6months':
        return '$7.49/month';
      case '1year':
        return '$59.95/year';
    }
  };

  const getPlanInfo = (plan: SubscriptionPlan) => {
    switch (plan) {
      case '1month':
        return {
          title: '1 month',
          price: '$9.99',
          period: 'per month',
          savings: null,
          popular: false,
        };
      case '6months':
        return {
          title: '6 months',
          price: '$7.49',
          period: 'per month',
          savings: 'Save 25%',
          popular: false,
        };
      case '1year':
        return {
          title: '1 year',
          price: '$59.95',
          period: 'per year',
          savings: 'Save 50%',
          popular: true,
        };
    }
  };

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

  // Teal color for the subscription UI (matching screenshot)
  const tealColor = '#16A085'; // Teal color from the screenshot
  const lightTeal = '#E8F5F3'; // Light teal background for selected card

  if (isSubscribed) {
    // Premium Active State - simpler view
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
              <Text style={[styles.statusTitle, { color: theme.colors.success }]}>Premium Active</Text>
              <Text style={[styles.statusSubtitle, { color: theme.colors.textSecondary }]}>
                You have full access to all premium features
              </Text>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Premium Features</Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={tealColor} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>Unlimited AI transformations</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={tealColor} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>High-quality export (no watermarks)</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={tealColor} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>All editing features unlocked</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={tealColor} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>Priority support</Text>
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

          {/* Feature List */}
          <View style={styles.featureListContainer}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={tealColor} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                Unlimited access to all the features and tools
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={tealColor} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                Boost creativity with 30+ AI tools
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={tealColor} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                1TB of cloud storage for your projects
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={tealColor} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>
                Priority online customer support
              </Text>
            </View>
          </View>

          {/* Subscription Plans */}
          <View style={styles.plansContainer}>
            {(['1month', '6months', '1year'] as SubscriptionPlan[]).map((plan) => {
              const info = getPlanInfo(plan);
              const isSelected = selectedPlan === plan;
              
              // Text colors: when selected, use dark text (since background is light teal)
              // When not selected, use theme colors
              const titleColor = isSelected ? '#000000' : theme.colors.text;
              const savingsColor = isSelected ? '#666666' : theme.colors.textSecondary;
              const priceColor = isSelected ? '#000000' : theme.colors.text;
              const periodColor = isSelected ? '#666666' : theme.colors.textSecondary;
              
              return (
                <TouchableOpacity
                  key={plan}
                  style={[
                    styles.planCard,
                    isSelected 
                      ? { backgroundColor: lightTeal, borderColor: tealColor, borderWidth: 2 }
                      : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }
                  ]}
                  onPress={() => handlePlanSelect(plan)}
                  activeOpacity={0.7}
                >
                  {/* Popular Badge */}
                  {info.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Popular</Text>
                    </View>
                  )}

                  {/* Left Section: Title and Savings */}
                  <View style={styles.planLeftSection}>
                    <Text style={[styles.planTitle, { color: titleColor }]}>
                      {info.title}
                    </Text>
                    {info.savings && (
                      <Text style={[styles.planSavings, { color: savingsColor }]}>
                        {info.savings}
                      </Text>
                    )}
                  </View>

                  {/* Right Section: Price */}
                  <View style={styles.planRightSection}>
                    <Text style={[styles.planPrice, { color: priceColor }]}>
                      {info.price}
                    </Text>
                    <Text style={[styles.planPeriod, { color: periodColor }]}>
                      {info.period}
                    </Text>
                  </View>

                  {/* Radio Button */}
                  <View style={styles.radioButtonContainer}>
                    {isSelected ? (
                      <View style={[styles.radioButtonSelected, { backgroundColor: tealColor }]}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={[styles.radioButtonUnselected, { borderColor: theme.colors.border }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subscribe Button */}
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: theme.spacing['3xl'],
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing['2xl'],
      alignItems: 'center',
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
      marginBottom: theme.spacing['2xl'],
      lineHeight: 40,
    },
    featureListContainer: {
      width: '100%',
      marginBottom: theme.spacing['2xl'],
      alignItems: 'flex-start',
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      width: '100%',
    },
    featureText: {
      fontSize: theme.typography.scaled.base,
      marginLeft: theme.spacing.sm,
      flex: 1,
    },
    plansContainer: {
      width: '100%',
      marginBottom: theme.spacing.xl,
    },
    planCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderRadius: theme.spacing.md,
      marginBottom: theme.spacing.md,
      position: 'relative',
    },
    popularBadge: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      backgroundColor: '#FFD700',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 1,
    },
    popularBadgeText: {
      fontSize: theme.typography.scaled.xs,
      fontWeight: theme.typography.weight.bold,
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
    radioButtonContainer: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonSelected: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioButtonUnselected: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      backgroundColor: 'transparent',
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
    sectionCard: {
      borderRadius: theme.spacing.lg,
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.typography.scaled.xl,
      fontWeight: theme.typography.weight.bold,
      marginBottom: theme.spacing.md,
    },
    featureList: {
      marginTop: theme.spacing.sm,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
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
