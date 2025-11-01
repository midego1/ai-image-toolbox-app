// RevenueCat service for subscription and virtual currency management
// Replaces react-native-iap with RevenueCat SDK

import Purchases, { CustomerInfo, Offering, PurchasesPackage } from 'react-native-purchases';
import Constants from 'expo-constants';

// Get RevenueCat API key from app configuration
function getRevenueCatApiKey(): string {
  // Try camelCase first
  let apiKey = Constants.expoConfig?.extra?.revenueCatApiKey;
  
  // If not found, try uppercase
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    apiKey = Constants.expoConfig?.extra?.REVENUE_CAT_API_KEY;
  }
  
  // Also check process.env as fallback
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    // @ts-ignore
    const envKey = typeof process !== 'undefined' && process.env?.REVENUE_CAT_API_KEY;
    if (envKey && typeof envKey === 'string') {
      apiKey = envKey;
    }
  }
  
  if (apiKey && typeof apiKey === 'string' && apiKey.length > 0) {
    return apiKey.trim();
  }
  
  return '';
}

export interface SubscriptionInfo {
  tier: 'free' | 'basic' | 'pro' | 'premium';
  isActive: boolean;
  entitlementActive: boolean;
  expiresDate?: string;
  billingPeriod?: 'weekly' | '1month' | '3months';
}

export interface CreditBalance {
  total: number;
  currency: string; // Virtual currency identifier
}

class RevenueCatService {
  private isInitialized = false;
  private apiKey: string = '';

  /**
   * Initialize RevenueCat SDK
   * Note: RevenueCat requires native modules and doesn't work in Expo Go.
   * Use a development build (expo run:ios or expo run:android) to test.
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      this.apiKey = getRevenueCatApiKey();
      
      if (!this.apiKey || this.apiKey.length === 0) {
        console.warn('[RevenueCat] API key not configured. RevenueCat features will not work.');
        console.warn('[RevenueCat] Set REVENUE_CAT_API_KEY in EAS Environment Variables or app.config.js');
        return false;
      }

      console.log('[RevenueCat] Initializing SDK...');
      
      // Initialize RevenueCat with API key
      await Purchases.configure({ apiKey: this.apiKey });
      
      // Set user ID if authenticated (optional, can be set later)
      // This will be set when user logs in
      
      this.isInitialized = true;
      console.log('[RevenueCat] SDK initialized successfully');
      
      return true;
    } catch (error: any) {
      console.error('[RevenueCat] Failed to initialize:', error);
      
      // Check if error is about Expo Go
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Expo Go') || errorMessage.includes('native store is not available')) {
        // Check if we're actually in a development build using Constants
        // Handle ExecutionEnvironment safely - it might be undefined
        const executionEnvironment = Constants.executionEnvironment;
        let isDevelopmentBuild = false;
        
        // Try to use ExecutionEnvironment enum if available
        if (Constants.ExecutionEnvironment) {
          isDevelopmentBuild = executionEnvironment === Constants.ExecutionEnvironment.Standalone || 
                              executionEnvironment === Constants.ExecutionEnvironment.Bare;
        } else {
          // Fallback: check string values directly
          // ExecutionEnvironment values: 'storeClient' | 'standalone' | 'bare' | 'classic'
          const envString = typeof executionEnvironment === 'string' ? executionEnvironment.toLowerCase() : '';
          isDevelopmentBuild = envString === 'standalone' || envString === 'bare';
        }
        
        if (!isDevelopmentBuild) {
          console.warn('[RevenueCat] RevenueCat requires native modules and cannot run in Expo Go.');
          console.warn('[RevenueCat] To test RevenueCat:');
          console.warn('[RevenueCat]   1. Use Test Store API Key when running in Expo Go:');
          console.warn('[RevenueCat]      - Get it from RevenueCat Dashboard → Project Settings → API Keys');
          console.warn('[RevenueCat]      - Set REVENUE_CAT_API_KEY to your Test Store key');
          console.warn('[RevenueCat]   2. Or create a development build: npx expo run:ios (or run:android)');
          console.warn('[RevenueCat]   3. Or use EAS Build: eas build --profile development --platform ios');
          console.warn('[RevenueCat]   4. See: https://rev.cat/sdk-test-store for Test Store setup');
          console.warn('[RevenueCat]   5. See: https://docs.expo.dev/development/introduction/');
        } else {
          // We're in a development build, but still getting this error
          // This could mean API key issue or configuration problem
          console.warn('[RevenueCat] Development build detected, but RevenueCat failed to initialize.');
          console.warn('[RevenueCat] Possible issues:');
          console.warn('[RevenueCat]   1. API key format - Use Public API Key (not Secret Key)');
          console.warn('[RevenueCat]   2. Products not configured in RevenueCat dashboard');
          console.warn('[RevenueCat]   3. Check RevenueCat dashboard: https://app.revenuecat.com');
        }
      } else if (errorMessage.includes('Invalid API key')) {
        console.warn('[RevenueCat] Invalid API key detected.');
        const executionEnvironment = Constants.executionEnvironment;
        const envString = typeof executionEnvironment === 'string' ? executionEnvironment.toLowerCase() : '';
        const isExpoGo = envString === 'storeclient' || !executionEnvironment;
        
        if (isExpoGo) {
          console.warn('[RevenueCat] You are running in Expo Go. Use your Test Store API Key.');
          console.warn('[RevenueCat]   1. Get Test Store key from: RevenueCat Dashboard → Project Settings → API Keys');
          console.warn('[RevenueCat]   2. Set REVENUE_CAT_API_KEY environment variable to the Test Store key');
          console.warn('[RevenueCat]   3. See: https://rev.cat/sdk-test-store');
        } else {
          console.warn('[RevenueCat] Make sure you are using your Public API Key from RevenueCat dashboard.');
          console.warn('[RevenueCat] Keys starting with "sk_" might be Secret Keys - use Public API Key instead.');
        }
      }
      
      return false;
    }
  }

  /**
   * Set user ID for RevenueCat (call when user logs in)
   */
  async setUserId(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log('[RevenueCat] User ID set:', userId);
    } catch (error) {
      console.error('[RevenueCat] Failed to set user ID:', error);
    }
  }

  /**
   * Log out user (call when user logs out)
   */
  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('[RevenueCat] User logged out');
    } catch (error) {
      console.error('[RevenueCat] Failed to log out:', error);
    }
  }

  /**
   * Get current offerings (for paywalls)
   */
  async getOfferings(): Promise<Offering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('[RevenueCat] Failed to get offerings:', error);
      return null;
    }
  }

  /**
   * Get customer info (subscription status, entitlements, credits)
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('[RevenueCat] Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Get current subscription tier from entitlements
   */
  async getSubscriptionTier(): Promise<'free' | 'basic' | 'pro' | 'premium'> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      if (!customerInfo) {
        return 'free';
      }

      // Check entitlements in order: premium > pro > basic
      if (customerInfo.entitlements.active['premium']) {
        return 'premium';
      }
      if (customerInfo.entitlements.active['pro']) {
        return 'pro';
      }
      if (customerInfo.entitlements.active['basic']) {
        return 'basic';
      }

      return 'free';
    } catch (error) {
      console.error('[RevenueCat] Failed to get subscription tier:', error);
      return 'free';
    }
  }

  /**
   * Get subscription info
   */
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      if (!customerInfo) {
        return {
          tier: 'free',
          isActive: false,
          entitlementActive: false,
        };
      }

      const tier = await this.getSubscriptionTier();
      const isActive = tier !== 'free';
      
      // Get active entitlement to check expiration
      let expiresDate: string | undefined;
      let billingPeriod: 'weekly' | '1month' | '3months' | undefined;
      
      if (isActive) {
        let activeEntitlement;
        if (customerInfo.entitlements.active['premium']) {
          activeEntitlement = customerInfo.entitlements.active['premium'];
        } else if (customerInfo.entitlements.active['pro']) {
          activeEntitlement = customerInfo.entitlements.active['pro'];
        } else if (customerInfo.entitlements.active['basic']) {
          activeEntitlement = customerInfo.entitlements.active['basic'];
        }

        if (activeEntitlement) {
          expiresDate = activeEntitlement.expirationDate;
          // Try to determine billing period from product identifier
          const productId = activeEntitlement.productIdentifier || '';
          if (productId.includes('weekly')) {
            billingPeriod = 'weekly';
          } else if (productId.includes('1month')) {
            billingPeriod = '1month';
          } else if (productId.includes('3months')) {
            billingPeriod = '3months';
          }
        }
      }

      return {
        tier,
        isActive,
        entitlementActive: isActive,
        expiresDate,
        billingPeriod,
      };
    } catch (error) {
      console.error('[RevenueCat] Failed to get subscription info:', error);
      return {
        tier: 'free',
        isActive: false,
        entitlementActive: false,
      };
    }
  }

  /**
   * Get credit balance from virtual currency
   */
  async getCreditBalance(): Promise<number> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      if (!customerInfo) {
        return 0;
      }

      // RevenueCat virtual currencies are stored in nonSubscriptionTransactions
      // or we can use the Developer API to fetch balance
      // For now, we'll need to track this via webhooks or API calls
      // This is a placeholder - actual implementation depends on how you set up virtual currency
      
      // TODO: Implement actual virtual currency balance fetching
      // This might require calling RevenueCat's Developer API or using webhooks
      
      return 0;
    } catch (error) {
      console.error('[RevenueCat] Failed to get credit balance:', error);
      return 0;
    }
  }

  /**
   * Purchase a package (subscription or credit pack)
   */
  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('[RevenueCat] Purchase successful');
      return customerInfo;
    } catch (error: any) {
      console.error('[RevenueCat] Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('[RevenueCat] Purchases restored');
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Check if user has active entitlement
   */
  async hasActiveEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo?.entitlements.active[entitlementId] !== undefined;
    } catch (error) {
      console.error('[RevenueCat] Failed to check entitlement:', error);
      return false;
    }
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();

