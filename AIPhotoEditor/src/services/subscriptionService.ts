// Credit-based subscription service with tier system
// Will use App Store Connect for real purchases in production
// For now, using local storage to track subscription tier and credits

import * as SecureStore from 'expo-secure-store';

// Storage keys
const SUBSCRIPTION_TIER_KEY = 'subscription_tier';
const SUBSCRIPTION_START_DATE_KEY = 'subscription_start_date';
const SUBSCRIPTION_END_DATE_KEY = 'subscription_end_date';
const SUBSCRIPTION_BILLING_PERIOD_KEY = 'subscription_billing_period';
const CREDITS_USED_THIS_MONTH_KEY = 'credits_used_this_month';
const LAST_CREDIT_RENEWAL_DATE_KEY = 'last_credit_renewal_date';

// Credit allocations per tier
export const FREE_TIER_CREDITS = 3;
export const BASIC_TIER_CREDITS = 10;
export const PRO_TIER_CREDITS = 50;
export const PREMIUM_TIER_CREDITS = 150;

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'premium';
export type SubscriptionDuration = '1month' | '3months' | '6months' | '1year';

export class SubscriptionService {
  /**
   * Initialize subscription service and check for credit renewal
   */
  static async init(): Promise<boolean> {
    try {
      await this.checkCreditRenewal();
      return true;
    } catch (error) {
      console.error('Failed to initialize subscription service:', error);
      return false;
    }
  }

  /**
   * Get current subscription tier
   */
  static async getSubscriptionTier(): Promise<SubscriptionTier> {
    try {
      const tier = await SecureStore.getItemAsync(SUBSCRIPTION_TIER_KEY);
      if (tier && ['free', 'basic', 'pro', 'premium'].includes(tier)) {
        return tier as SubscriptionTier;
      }
      
      // Check if subscription expired
      const endDate = await SecureStore.getItemAsync(SUBSCRIPTION_END_DATE_KEY);
      if (endDate) {
        const end = new Date(endDate);
        if (end < new Date()) {
          // Subscription expired, downgrade to free
          await this.downgradeToFree();
          return 'free';
        }
      }
      
      return 'free';
    } catch (error) {
      console.error('Failed to get subscription tier:', error);
      return 'free';
    }
  }

  /**
   * Get monthly credits allocated for current tier
   */
  static async getMonthlyCreditsAllocated(): Promise<number> {
    const tier = await this.getSubscriptionTier();
    
    switch (tier) {
      case 'basic':
        return BASIC_TIER_CREDITS;
      case 'pro':
        return PRO_TIER_CREDITS;
      case 'premium':
        return PREMIUM_TIER_CREDITS;
      case 'free':
      default:
        return FREE_TIER_CREDITS;
    }
  }

  /**
   * Get credits used this month
   */
  static async getCreditsUsedThisMonth(): Promise<number> {
    try {
      const used = await SecureStore.getItemAsync(CREDITS_USED_THIS_MONTH_KEY);
      return used ? parseFloat(used) : 0;
    } catch (error) {
      console.error('Failed to get credits used:', error);
      return 0;
    }
  }

  /**
   * Get remaining credits this month
   */
  static async getCreditsRemaining(): Promise<number> {
    const allocated = await this.getMonthlyCreditsAllocated();
    const used = await this.getCreditsUsedThisMonth();
    return Math.max(0, allocated - used);
  }

  /**
   * Check if user can use a feature (subscription + credits check)
   */
  static async canUseFeature(
    requiresSubscription: boolean = false,
    creditCost: number = 1
  ): Promise<{ canUse: boolean; reason?: string }> {
    const tier = await this.getSubscriptionTier();

    // Check subscription requirement
    if (requiresSubscription && tier === 'free') {
      return {
        canUse: false,
        reason: 'This feature requires a subscription',
      };
    }

    // Free features (no credits)
    if (creditCost === 0) {
      return { canUse: true };
    }

    // Check credits
    const remaining = await this.getCreditsRemaining();
    if (remaining < creditCost) {
      return {
        canUse: false,
        reason: remaining === 0 
          ? "You've used all your credits this month. Upgrade to get more!"
          : `Insufficient credits. This requires ${creditCost} credit${creditCost !== 1 ? 's' : ''}, but you have ${remaining.toFixed(1)} remaining.`,
      };
    }

    return { canUse: true };
  }

  /**
   * Consume credit after successful operation
   */
  static async consumeCredit(creditCost: number = 1): Promise<boolean> {
    try {
      const currentUsed = await this.getCreditsUsedThisMonth();
      const newUsed = currentUsed + creditCost;
      await SecureStore.setItemAsync(CREDITS_USED_THIS_MONTH_KEY, newUsed.toString());
      return true;
    } catch (error) {
      console.error('Failed to consume credit:', error);
      return false;
    }
  }

  /**
   * Purchase subscription (tier + duration)
   */
  static async purchaseSubscription(
    tier: SubscriptionTier,
    duration: SubscriptionDuration
  ): Promise<boolean> {
    try {
      const now = new Date();
      const endDate = new Date(now);

      // Calculate end date based on duration
      switch (duration) {
        case '1month':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case '3months':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case '6months':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case '1year':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      // TODO: Implement real in-app purchase validation
      // For MVP, simulate successful purchase
      
      await SecureStore.setItemAsync(SUBSCRIPTION_TIER_KEY, tier);
      await SecureStore.setItemAsync(SUBSCRIPTION_START_DATE_KEY, now.toISOString());
      await SecureStore.setItemAsync(SUBSCRIPTION_END_DATE_KEY, endDate.toISOString());
      await SecureStore.setItemAsync(SUBSCRIPTION_BILLING_PERIOD_KEY, duration);

      // Reset credits for new subscription
      await SecureStore.setItemAsync(CREDITS_USED_THIS_MONTH_KEY, '0');
      await SecureStore.setItemAsync(LAST_CREDIT_RENEWAL_DATE_KEY, now.toISOString());

      return true;
    } catch (error) {
      console.error('Failed to purchase subscription:', error);
      return false;
    }
  }

  /**
   * Check subscription status (legacy compatibility)
   */
  static async checkSubscriptionStatus(): Promise<boolean> {
    const tier = await this.getSubscriptionTier();
    return tier !== 'free';
  }

  /**
   * Check and handle credit renewal if new month started
   */
  static async checkCreditRenewal(): Promise<void> {
    try {
      const lastRenewal = await SecureStore.getItemAsync(LAST_CREDIT_RENEWAL_DATE_KEY);
      const now = new Date();

      if (!lastRenewal) {
        // First time, set current date
        await SecureStore.setItemAsync(LAST_CREDIT_RENEWAL_DATE_KEY, now.toISOString());
        return;
      }

      const lastRenewalDate = new Date(lastRenewal);
      const lastRenewalMonth = lastRenewalDate.getMonth();
      const lastRenewalYear = lastRenewalDate.getFullYear();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Check if new month started
      if (
        currentYear > lastRenewalYear ||
        (currentYear === lastRenewalYear && currentMonth > lastRenewalMonth)
      ) {
        // New month, reset credits
        await SecureStore.setItemAsync(CREDITS_USED_THIS_MONTH_KEY, '0');
        await SecureStore.setItemAsync(LAST_CREDIT_RENEWAL_DATE_KEY, now.toISOString());
      }

      // Check if subscription expired
      const endDateStr = await SecureStore.getItemAsync(SUBSCRIPTION_END_DATE_KEY);
      if (endDateStr) {
        const endDate = new Date(endDateStr);
        if (endDate < now) {
          await this.downgradeToFree();
        }
      }
    } catch (error) {
      console.error('Failed to check credit renewal:', error);
    }
  }

  /**
   * Downgrade to free tier (subscription expired)
   */
  private static async downgradeToFree(): Promise<void> {
    try {
      await SecureStore.setItemAsync(SUBSCRIPTION_TIER_KEY, 'free');
      // Keep credits used for free tier limit
      // Reset to free tier credits allocation
      const currentUsed = await this.getCreditsUsedThisMonth();
      const freeCredits = FREE_TIER_CREDITS;
      if (currentUsed > freeCredits) {
        await SecureStore.setItemAsync(CREDITS_USED_THIS_MONTH_KEY, freeCredits.toString());
      }
    } catch (error) {
      console.error('Failed to downgrade to free:', error);
    }
  }

  /**
   * Get transformations used (legacy compatibility)
   */
  static async getTransformationsUsed(): Promise<number> {
    return this.getCreditsUsedThisMonth();
  }

  /**
   * Increment transformations used (legacy compatibility)
   */
  static async incrementTransformationsUsed(): Promise<void> {
    await this.consumeCredit(1);
  }

  /**
   * Can use transformation (legacy compatibility)
   */
  static async canUseTransformation(): Promise<boolean> {
    const result = await this.canUseFeature(false, 1);
    return result.canUse;
  }

  /**
   * Can transform (legacy compatibility)
   */
  static async canTransform(): Promise<boolean> {
    return this.canUseTransformation();
  }

  /**
   * Increment transformations (legacy compatibility)
   */
  static async incrementTransformations(): Promise<void> {
    await this.incrementTransformationsUsed();
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(): Promise<boolean> {
    try {
      // Don't delete immediately, let it expire naturally
      // This allows access until end date
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  /**
   * Reset subscription (dev/testing only)
   */
  static async resetSubscription(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(SUBSCRIPTION_TIER_KEY);
      await SecureStore.deleteItemAsync(SUBSCRIPTION_START_DATE_KEY);
      await SecureStore.deleteItemAsync(SUBSCRIPTION_END_DATE_KEY);
      await SecureStore.deleteItemAsync(SUBSCRIPTION_BILLING_PERIOD_KEY);
      await SecureStore.deleteItemAsync(CREDITS_USED_THIS_MONTH_KEY);
      await SecureStore.deleteItemAsync(LAST_CREDIT_RENEWAL_DATE_KEY);
      
      // Set to free tier
      await SecureStore.setItemAsync(SUBSCRIPTION_TIER_KEY, 'free');
      await SecureStore.setItemAsync(CREDITS_USED_THIS_MONTH_KEY, '0');
      await SecureStore.setItemAsync(LAST_CREDIT_RENEWAL_DATE_KEY, new Date().toISOString());
      
      return true;
    } catch (error) {
      console.error('Failed to reset subscription:', error);
      return false;
    }
  }

  /**
   * Get subscription info for display
   */
  static async getSubscriptionInfo(): Promise<{
    tier: SubscriptionTier;
    creditsAllocated: number;
    creditsUsed: number;
    creditsRemaining: number;
    endDate?: string;
    billingPeriod?: SubscriptionDuration;
  }> {
    const tier = await this.getSubscriptionTier();
    const allocated = await this.getMonthlyCreditsAllocated();
    const used = await this.getCreditsUsedThisMonth();
    const remaining = await this.getCreditsRemaining();

    let endDate: string | undefined;
    let billingPeriod: SubscriptionDuration | undefined;

    if (tier !== 'free') {
      try {
        endDate = await SecureStore.getItemAsync(SUBSCRIPTION_END_DATE_KEY) || undefined;
        billingPeriod = (await SecureStore.getItemAsync(SUBSCRIPTION_BILLING_PERIOD_KEY) || undefined) as SubscriptionDuration | undefined;
      } catch (error) {
        console.error('Failed to get subscription dates:', error);
      }
    }

    return {
      tier,
      creditsAllocated: allocated,
      creditsUsed: used,
      creditsRemaining: remaining,
      endDate,
      billingPeriod,
    };
  }
}



