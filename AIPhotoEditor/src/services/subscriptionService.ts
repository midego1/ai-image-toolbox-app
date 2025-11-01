// Credit-based subscription service with tier system
// Now uses RevenueCat for subscription and virtual currency management
// Supports hybrid model: subscriptions + one-time credit packs
// Integrates with Supabase for backend sync (optional)

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SubscriptionBackendService } from './subscriptionBackendService';
import { AuthService } from './authService';
import { revenueCatService } from './revenueCatService';
import { formatCreditCost } from '../utils/creditCost';

// Storage keys
const SUBSCRIPTION_TIER_KEY = 'subscription_tier';
const SUBSCRIPTION_START_DATE_KEY = 'subscription_start_date';
const SUBSCRIPTION_END_DATE_KEY = 'subscription_end_date';
const SUBSCRIPTION_BILLING_PERIOD_KEY = 'subscription_billing_period';
const SUBSCRIPTION_CANCELLED_KEY = 'subscription_cancelled';
const CREDITS_USED_THIS_MONTH_KEY = 'credits_used_this_month';
const LAST_CREDIT_RENEWAL_DATE_KEY = 'last_credit_renewal_date';
const PURCHASED_CREDITS_KEY = 'purchased_credits'; // One-time purchased credits (never expire)
const UNUSED_SUBSCRIPTION_CREDITS_KEY = 'unused_subscription_credits'; // Preserved credits from cancelled subscription

// Credit allocations per tier
export const FREE_TIER_CREDITS = 3;
export const BASIC_TIER_CREDITS = 10;
export const PRO_TIER_CREDITS = 50;
export const PREMIUM_TIER_CREDITS = 150;

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'premium';
export type SubscriptionDuration = 'weekly' | '1month' | '3months';

// Credit pack definitions (one-time purchases)
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: string;
  productId: string; // App Store Connect product ID
  popular?: boolean; // Mark popular packs
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_10',
    name: 'Small Pack',
    credits: 10,
    price: '$0.99',
    productId: 'com.midego.aiphotoeditor.credits.10',
  },
  {
    id: 'pack_25',
    name: 'Medium Pack',
    credits: 25,
    price: '$2.19',
    productId: 'com.midego.aiphotoeditor.credits.25',
    popular: true,
  },
  {
    id: 'pack_50',
    name: 'Large Pack',
    credits: 50,
    price: '$4.19',
    productId: 'com.midego.aiphotoeditor.credits.50',
  },
  {
    id: 'pack_100',
    name: 'Mega Pack',
    credits: 100,
    price: '$7.99',
    productId: 'com.midego.aiphotoeditor.credits.100',
  },
];

export class SubscriptionService {
  /**
   * Initialize subscription service and check for credit renewal
   * Now initializes RevenueCat first
   */
  static async init(): Promise<boolean> {
    try {
      // Initialize RevenueCat first
      const revenueCatReady = await revenueCatService.initialize();
      if (!revenueCatReady) {
        console.warn('[SubscriptionService] RevenueCat not ready, falling back to local storage');
      }
      
      // Still check local credit renewal for backward compatibility
      await this.checkCreditRenewal();
      
      // Try to sync from Supabase if available
      // This runs in background and doesn't block initialization
      this.syncFromServer().catch(error => {
        console.warn('[SubscriptionService] Background sync failed:', error);
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize subscription service:', error);
      return false;
    }
  }

  /**
   * Sync subscription and credit data from Supabase (background)
   */
  static async syncFromServer(): Promise<void> {
    try {
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        return; // Not authenticated, skip sync
      }

      await SubscriptionBackendService.syncFromServer();
      // Additional sync logic can be added here
    } catch (error) {
      console.warn('[SubscriptionService] Sync from server failed:', error);
    }
  }

  /**
   * Sync subscription and credit data to Supabase (background)
   */
  static async syncToServer(): Promise<void> {
    try {
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        return;
      }

      const tier = await this.getSubscriptionTier();
      const endDate = await SecureStore.getItemAsync(SUBSCRIPTION_END_DATE_KEY) || '';
      const billingPeriod = (await SecureStore.getItemAsync(SUBSCRIPTION_BILLING_PERIOD_KEY) || '1month') as SubscriptionDuration;
      const isCancelled = (await SecureStore.getItemAsync(SUBSCRIPTION_CANCELLED_KEY)) === 'true';

      await SubscriptionBackendService.syncToServer(tier, endDate, billingPeriod, isCancelled);

      // Sync credit balances
      const subscriptionCredits = await this.getCurrentPeriodSubscriptionCreditsRemaining();
      const subscriptionCreditsUsed = await this.getCurrentPeriodSubscriptionCreditsUsed();
      const purchasedCredits = await this.getPurchasedCredits();
      const unusedSubscriptionCredits = await this.getUnusedSubscriptionCredits();
      const lastRenewalDate = await SecureStore.getItemAsync(LAST_CREDIT_RENEWAL_DATE_KEY) || new Date().toISOString();

      await SubscriptionBackendService.syncCreditsToServer(
        subscriptionCredits,
        subscriptionCreditsUsed,
        purchasedCredits,
        unusedSubscriptionCredits,
        lastRenewalDate
      );
    } catch (error) {
      console.warn('[SubscriptionService] Sync to server failed:', error);
    }
  }

  /**
   * Get current subscription tier
   * Now prioritizes RevenueCat, falls back to local storage
   */
  static async getSubscriptionTier(): Promise<SubscriptionTier> {
    try {
      // If RevenueCat is ready, use it as source of truth
      if (revenueCatService.isReady()) {
        const rcTier = await revenueCatService.getSubscriptionTier();
        // Sync to local storage for backward compatibility
        await SecureStore.setItemAsync(SUBSCRIPTION_TIER_KEY, rcTier);
        return rcTier;
      }
      
      // Fallback to local storage if RevenueCat not ready
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
   * Now includes all credit sources: subscription, purchased, and preserved unused credits
   */
  static async getCreditsRemaining(): Promise<number> {
    // Current period subscription credits remaining
    const subscriptionCredits = await this.getCurrentPeriodSubscriptionCreditsRemaining();
    
    // Purchased credits (never expire)
    const purchasedCredits = await this.getPurchasedCredits();
    
    // Unused subscription credits from cancelled subscriptions
    const unusedSubscriptionCredits = await this.getUnusedSubscriptionCredits();
    
    return subscriptionCredits + purchasedCredits + unusedSubscriptionCredits;
  }

  /**
   * Get purchased credits (one-time purchases, never expire)
   */
  static async getPurchasedCredits(): Promise<number> {
    try {
      const credits = await SecureStore.getItemAsync(PURCHASED_CREDITS_KEY);
      return credits ? parseFloat(credits) : 0;
    } catch (error) {
      console.error('Failed to get purchased credits:', error);
      return 0;
    }
  }

  /**
   * Get unused subscription credits (preserved from cancelled subscriptions)
   */
  static async getUnusedSubscriptionCredits(): Promise<number> {
    try {
      const credits = await SecureStore.getItemAsync(UNUSED_SUBSCRIPTION_CREDITS_KEY);
      return credits ? parseFloat(credits) : 0;
    } catch (error) {
      console.error('Failed to get unused subscription credits:', error);
      return 0;
    }
  }

  /**
   * Get current period subscription credits remaining (monthly allocation minus used)
   */
  static async getCurrentPeriodSubscriptionCreditsRemaining(): Promise<number> {
    const allocated = await this.getMonthlyCreditsAllocated();
    const used = await this.getCurrentPeriodSubscriptionCreditsUsed();
    return Math.max(0, allocated - used);
  }

  /**
   * Get current period subscription credits used
   */
  static async getCurrentPeriodSubscriptionCreditsUsed(): Promise<number> {
    return this.getCreditsUsedThisMonth();
  }

  /**
   * Check if user can use a feature (subscription + credits check)
   * Now supports hybrid credit system (subscription + purchased + preserved credits)
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

    // Check total credits (subscription + purchased + preserved)
    const remaining = await this.getCreditsRemaining();
    if (remaining < creditCost) {
      return {
        canUse: false,
        reason: remaining === 0 
          ? "You've used all your credits. Buy more or upgrade your subscription!"
          : `Insufficient credits. This requires ${formatCreditCost(creditCost)} credit${parseFloat(formatCreditCost(creditCost)) !== 1 ? 's' : ''}, but you have ${formatCreditCost(remaining)} remaining.`,
      };
    }

    return { canUse: true };
  }

  /**
   * Consume credit after successful operation
   * Priority: 1) Current period subscription credits, 2) Purchased credits, 3) Unused subscription credits
   */
  static async consumeCredit(creditCost: number = 1): Promise<boolean> {
    try {
      let remainingToConsume = creditCost;

      // First, consume from current period subscription credits
      const subscriptionCreditsRemaining = await this.getCurrentPeriodSubscriptionCreditsRemaining();
      const subscriptionCreditsUsed = await this.getCurrentPeriodSubscriptionCreditsUsed();
      
      if (subscriptionCreditsRemaining > 0) {
        const consumeFromSubscription = Math.min(remainingToConsume, subscriptionCreditsRemaining);
        const newSubscriptionUsed = subscriptionCreditsUsed + consumeFromSubscription;
        await SecureStore.setItemAsync(CREDITS_USED_THIS_MONTH_KEY, newSubscriptionUsed.toString());
        remainingToConsume -= consumeFromSubscription;
      }

      // If still need credits, consume from purchased credits
      if (remainingToConsume > 0) {
        const purchasedCredits = await this.getPurchasedCredits();
        if (purchasedCredits > 0) {
          const consumeFromPurchased = Math.min(remainingToConsume, purchasedCredits);
          const newPurchased = purchasedCredits - consumeFromPurchased;
          await SecureStore.setItemAsync(PURCHASED_CREDITS_KEY, newPurchased.toString());
          remainingToConsume -= consumeFromPurchased;
        }
      }

      // If still need credits, consume from unused subscription credits
      if (remainingToConsume > 0) {
        const unusedCredits = await this.getUnusedSubscriptionCredits();
        if (unusedCredits > 0) {
          const consumeFromUnused = Math.min(remainingToConsume, unusedCredits);
          const newUnused = unusedCredits - consumeFromUnused;
          await SecureStore.setItemAsync(UNUSED_SUBSCRIPTION_CREDITS_KEY, newUnused.toString());
          remainingToConsume -= consumeFromUnused;
        }
      }

      if (remainingToConsume > 0) {
        console.error(`[SubscriptionService] Attempted to consume ${creditCost} credits but only ${creditCost - remainingToConsume} available`);
        return false;
      }

      // Sync to server in background
      this.syncToServer().catch(error => {
        console.warn('[SubscriptionService] Background sync after credit consumption failed:', error);
      });

      return true;
    } catch (error) {
      console.error('Failed to consume credit:', error);
      return false;
    }
  }

  /**
   * Purchase subscription (tier + duration)
   * Note: This method signature is kept for compatibility, but actual purchases
   * should be done through RevenueCat packages directly. Use RevenueCatService.getOfferings()
   * and RevenueCatService.purchasePackage() for real purchases.
   */
  static async purchaseSubscription(
    tier: SubscriptionTier,
    duration: SubscriptionDuration
  ): Promise<boolean> {
    try {
      // If RevenueCat is ready, this method should not be called directly
      // Purchases should go through RevenueCat packages
      if (revenueCatService.isReady()) {
        console.warn('[SubscriptionService] purchaseSubscription() called but RevenueCat is active. Use RevenueCat packages directly.');
        // Still update local storage for backward compatibility
      }

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
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
      }

      await SecureStore.setItemAsync(SUBSCRIPTION_TIER_KEY, tier);
      await SecureStore.setItemAsync(SUBSCRIPTION_START_DATE_KEY, now.toISOString());
      await SecureStore.setItemAsync(SUBSCRIPTION_END_DATE_KEY, endDate.toISOString());
      await SecureStore.setItemAsync(SUBSCRIPTION_BILLING_PERIOD_KEY, duration);

      // Reset credits for new subscription
      await SecureStore.setItemAsync(CREDITS_USED_THIS_MONTH_KEY, '0');
      await SecureStore.setItemAsync(LAST_CREDIT_RENEWAL_DATE_KEY, now.toISOString());
      
      // Clear cancellation flag if resubscribing
      await SecureStore.deleteItemAsync(SUBSCRIPTION_CANCELLED_KEY);

      // Record purchase in backend
      const productId = `subscription_${tier}_${duration}`;
      await SubscriptionBackendService.recordPurchase(productId, 'subscription', undefined, undefined, Platform.OS === 'ios' ? 'ios' : 'android');
      
      // Sync to server
      this.syncToServer().catch(error => {
        console.warn('[SubscriptionService] Background sync after purchase failed:', error);
      });

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
   * Also handles subscription expiration and credit preservation
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

      // Check if subscription expired
      const endDateStr = await SecureStore.getItemAsync(SUBSCRIPTION_END_DATE_KEY);
      const isCancelled = (await SecureStore.getItemAsync(SUBSCRIPTION_CANCELLED_KEY)) === 'true';
      
      if (endDateStr) {
        const endDate = new Date(endDateStr);
        // Only process expiration if subscription has actually expired (not just cancelled)
        // This prevents credits from being preserved when user cancels but subscription is still active
        if (endDate < now) {
          // Subscription has expired
          // Only preserve unused credits if the subscription was cancelled before expiration
          // This gives users the credits they paid for if they cancelled mid-period
          if (isCancelled) {
            const currentPeriodCredits = await this.getCurrentPeriodSubscriptionCreditsRemaining();
            if (currentPeriodCredits > 0) {
              const existingUnused = await this.getUnusedSubscriptionCredits();
              const newUnused = existingUnused + currentPeriodCredits;
              await SecureStore.setItemAsync(UNUSED_SUBSCRIPTION_CREDITS_KEY, newUnused.toString());
              console.log(`[SubscriptionService] Preserved ${currentPeriodCredits} unused credits from cancelled subscription`);
            }
            // Clear cancellation flag after handling
            await SecureStore.deleteItemAsync(SUBSCRIPTION_CANCELLED_KEY);
          }
          // Downgrade to free tier after expiration (with or without cancellation)
          await this.downgradeToFree();
        }
        // If subscription hasn't expired yet, do nothing (even if cancelled)
        // User still has access until end date
      }

      // Check if new month started (for active subscriptions)
      if (
        currentYear > lastRenewalYear ||
        (currentYear === lastRenewalYear && currentMonth > lastRenewalMonth)
      ) {
        const tier = await this.getSubscriptionTier();
        // Only reset credits if subscription is still active
        if (tier !== 'free') {
          // New month, reset subscription credits (but keep purchased and unused credits)
          await SecureStore.setItemAsync(CREDITS_USED_THIS_MONTH_KEY, '0');
          await SecureStore.setItemAsync(LAST_CREDIT_RENEWAL_DATE_KEY, now.toISOString());
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
   * Marks subscription as cancelled but keeps it active until end date.
   * 
   * IMPORTANT: Credits are NOT preserved immediately when cancelling.
   * Credits are only preserved when the subscription actually expires (handled in checkCreditRenewal).
   * This ensures:
   * - User keeps access until end date
   * - Unused credits from the current period are preserved only after expiration
   * - No immediate credit additions when cancelling
   */
  static async cancelSubscription(): Promise<boolean> {
    try {
      // Mark subscription as cancelled - this is just a flag
      // Subscription remains active until end date
      // Credits will be preserved ONLY when subscription expires (checked in checkCreditRenewal)
      // NOT preserved immediately to avoid adding credits when cancelling
      await SecureStore.setItemAsync(SUBSCRIPTION_CANCELLED_KEY, 'true');
      
      console.log('[SubscriptionService] Subscription marked as cancelled. Will remain active until end date.');
      
      // Sync to server
      this.syncToServer().catch(error => {
        console.warn('[SubscriptionService] Background sync after cancellation failed:', error);
      });
      
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  /**
   * Purchase a credit pack (one-time purchase)
   */
  static async purchaseCreditPack(packId: string, receiptData?: string): Promise<boolean> {
    try {
      const pack = CREDIT_PACKS.find(p => p.id === packId);
      if (!pack) {
        console.error(`[SubscriptionService] Credit pack ${packId} not found`);
        return false;
      }

      // TODO: Validate receipt with App Store/Play Store
      // For now, simulate successful purchase

      // Add credits to purchased credits pool
      const currentPurchased = await this.getPurchasedCredits();
      const newPurchased = currentPurchased + pack.credits;
      await SecureStore.setItemAsync(PURCHASED_CREDITS_KEY, newPurchased.toString());

      // Record purchase in backend
      await SubscriptionBackendService.recordPurchase(
        pack.productId,
        'credit_pack',
        receiptData,
        pack.credits,
        Platform.OS === 'ios' ? 'ios' : 'android'
      );

      // Sync to server
      this.syncToServer().catch(error => {
        console.warn('[SubscriptionService] Background sync after credit pack purchase failed:', error);
      });

      return true;
    } catch (error) {
      console.error('Failed to purchase credit pack:', error);
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
   * Check if subscription is cancelled (but may still be active until end date)
   */
  static async isSubscriptionCancelled(): Promise<boolean> {
    try {
      const cancelled = await SecureStore.getItemAsync(SUBSCRIPTION_CANCELLED_KEY);
      return cancelled === 'true';
    } catch (error) {
      console.error('Failed to check cancellation status:', error);
      return false;
    }
  }

  /**
   * Get subscription info for display
   * Now prioritizes RevenueCat, falls back to local storage
   */
  static async getSubscriptionInfo(): Promise<{
    tier: SubscriptionTier;
    creditsAllocated: number;
    creditsUsed: number;
    creditsRemaining: number;
    endDate?: string;
    billingPeriod?: SubscriptionDuration;
    isCancelled?: boolean;
  }> {
    let tier: SubscriptionTier;
    let endDate: string | undefined;
    let billingPeriod: SubscriptionDuration | undefined;
    let isCancelled: boolean | undefined;

    // Try to get from RevenueCat first
    if (revenueCatService.isReady()) {
      try {
        const rcInfo = await revenueCatService.getSubscriptionInfo();
        tier = rcInfo.tier;
        endDate = rcInfo.expiresDate;
        billingPeriod = rcInfo.billingPeriod;
        isCancelled = !rcInfo.isActive && rcInfo.tier !== 'free';
      } catch (error) {
        console.warn('[SubscriptionService] Failed to get info from RevenueCat, falling back to local:', error);
        tier = await this.getSubscriptionTier();
      }
    } else {
      tier = await this.getSubscriptionTier();
    }

    const allocated = await this.getMonthlyCreditsAllocated();
    const used = await this.getCreditsUsedThisMonth();
    const remaining = await this.getCreditsRemaining();

    // If we didn't get dates from RevenueCat, try local storage
    if (!endDate && tier !== 'free') {
      try {
        endDate = await SecureStore.getItemAsync(SUBSCRIPTION_END_DATE_KEY) || undefined;
        billingPeriod = (await SecureStore.getItemAsync(SUBSCRIPTION_BILLING_PERIOD_KEY) || undefined) as SubscriptionDuration | undefined;
        if (isCancelled === undefined) {
          isCancelled = await this.isSubscriptionCancelled();
        }
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
      isCancelled,
    };
  }
}



