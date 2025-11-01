// Backend subscription service for Supabase
// Handles server-side subscription and credit management
// Works alongside local storage for offline support and caching

import { getSupabaseClient, isSupabaseConfigured } from './supabaseService';
import { AuthService } from './authService';
import { SubscriptionTier, SubscriptionDuration, CREDIT_PACKS, CreditPack } from './subscriptionService';

export interface SubscriptionRecord {
  id?: string;
  user_id: string;
  tier: SubscriptionTier;
  start_date: string;
  end_date: string;
  billing_period: SubscriptionDuration;
  cancelled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseRecord {
  id?: string;
  user_id: string;
  product_id: string;
  purchase_type: 'subscription' | 'credit_pack';
  receipt_data?: string; // App Store/Play Store receipt
  receipt_validated: boolean;
  credits_added?: number;
  amount?: string;
  currency?: string;
  platform: 'ios' | 'android';
  created_at?: string;
}

export interface CreditBalanceRecord {
  id?: string;
  user_id: string;
  subscription_credits: number; // Current period subscription credits
  subscription_credits_used: number;
  purchased_credits: number; // Purchased credits (never expire)
  unused_subscription_credits: number; // Preserved from cancelled subscriptions
  last_renewal_date: string;
  created_at?: string;
  updated_at?: string;
}

export class SubscriptionBackendService {
  /**
   * Sync subscription data from server to local (hybrid approach)
   */
  static async syncFromServer(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('[SubscriptionBackend] Supabase not configured, skipping sync');
      return false;
    }

    const user = await AuthService.getCurrentUser();
    if (!user) {
      console.warn('[SubscriptionBackend] No authenticated user, skipping sync');
      return false;
    }

    try {
      const supabase = getSupabaseClient();
      
      // Get active subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('cancelled', false)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[SubscriptionBackend] Error fetching subscription:', subError);
      }

      // Get credit balance
      const { data: creditBalance, error: creditError } = await supabase
        .from('credit_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (creditError && creditError.code !== 'PGRST116') {
        console.error('[SubscriptionBackend] Error fetching credit balance:', creditError);
      }

      // Get all purchases for this user
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (purchaseError) {
        console.error('[SubscriptionBackend] Error fetching purchases:', purchaseError);
      }

      return true;
    } catch (error) {
      console.error('[SubscriptionBackend] Failed to sync from server:', error);
      return false;
    }
  }

  /**
   * Sync local subscription data to server
   */
  static async syncToServer(
    tier: SubscriptionTier,
    endDate: string,
    billingPeriod: SubscriptionDuration,
    isCancelled: boolean
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const user = await AuthService.getCurrentUser();
    if (!user) return false;

    try {
      const supabase = getSupabaseClient();

      // Upsert subscription record
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          tier,
          start_date: new Date().toISOString(),
          end_date: endDate,
          billing_period: billingPeriod,
          cancelled: isCancelled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('[SubscriptionBackend] Error syncing subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SubscriptionBackend] Failed to sync subscription to server:', error);
      return false;
    }
  }

  /**
   * Record a purchase (subscription or credit pack)
   */
  static async recordPurchase(
    productId: string,
    purchaseType: 'subscription' | 'credit_pack',
    receiptData?: string,
    creditsAdded?: number,
    platform: 'ios' | 'android' = 'ios'
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const user = await AuthService.getCurrentUser();
    if (!user) return false;

    try {
      const supabase = getSupabaseClient();

      const purchase: Omit<PurchaseRecord, 'id' | 'created_at'> = {
        user_id: user.id,
        product_id: productId,
        purchase_type: purchaseType,
        receipt_data: receiptData,
        receipt_validated: false, // Will be validated by backend
        credits_added: creditsAdded,
        platform,
      };

      const { error } = await supabase
        .from('purchases')
        .insert(purchase);

      if (error) {
        console.error('[SubscriptionBackend] Error recording purchase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SubscriptionBackend] Failed to record purchase:', error);
      return false;
    }
  }

  /**
   * Sync credit balance to server
   */
  static async syncCreditsToServer(
    subscriptionCredits: number,
    subscriptionCreditsUsed: number,
    purchasedCredits: number,
    unusedSubscriptionCredits: number,
    lastRenewalDate: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const user = await AuthService.getCurrentUser();
    if (!user) return false;

    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('credit_balances')
        .upsert({
          user_id: user.id,
          subscription_credits: subscriptionCredits,
          subscription_credits_used: subscriptionCreditsUsed,
          purchased_credits: purchasedCredits,
          unused_subscription_credits: unusedSubscriptionCredits,
          last_renewal_date: lastRenewalDate,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('[SubscriptionBackend] Error syncing credits:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SubscriptionBackend] Failed to sync credits to server:', error);
      return false;
    }
  }

  /**
   * Get credit balance from server
   */
  static async getCreditsFromServer(): Promise<CreditBalanceRecord | null> {
    if (!isSupabaseConfigured()) return null;

    const user = await AuthService.getCurrentUser();
    if (!user) return null;

    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('credit_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found - user hasn't synced yet
          return null;
        }
        console.error('[SubscriptionBackend] Error fetching credits:', error);
        return null;
      }

      return data as CreditBalanceRecord;
    } catch (error) {
      console.error('[SubscriptionBackend] Failed to get credits from server:', error);
      return null;
    }
  }

  /**
   * Validate receipt with backend (calls Supabase Edge Function)
   * This should be implemented as a Supabase Edge Function that validates with Apple/Google
   */
  static async validateReceipt(
    receiptData: string,
    productId: string,
    platform: 'ios' | 'android'
  ): Promise<{ valid: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { valid: false, error: 'Supabase not configured' };
    }

    try {
      const supabase = getSupabaseClient();

      // Call Supabase Edge Function for receipt validation
      // This function should validate with Apple/Google App Store APIs
      const { data, error } = await supabase.functions.invoke('validate-receipt', {
        body: {
          receipt_data: receiptData,
          product_id: productId,
          platform,
        },
      });

      if (error) {
        console.error('[SubscriptionBackend] Receipt validation error:', error);
        return { valid: false, error: error.message };
      }

      return { valid: data?.valid === true, error: data?.error };
    } catch (error: any) {
      console.error('[SubscriptionBackend] Failed to validate receipt:', error);
      return { valid: false, error: error.message };
    }
  }
}
