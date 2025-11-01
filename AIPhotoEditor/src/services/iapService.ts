// In-App Purchase service using react-native-iap
// Handles StoreKit (iOS) and Google Play Billing (Android)
// Fetches real localized prices from the stores

import { Platform } from 'react-native';

// Conditionally import react-native-iap (not available in Expo Go)
let IAP: any = null;
try {
  IAP = require('react-native-iap');
} catch (error) {
  console.warn('[IAPService] react-native-iap not available (Expo Go), using fallback prices');
}

export interface LocalizedPrice {
  price: string; // Localized price string (e.g., "$0.99", "€0.99", "¥120")
  priceNumber: number; // Numeric value
  currency: string; // Currency code (e.g., "USD", "EUR", "JPY")
}

export interface CreditPackProduct {
  id: string;
  productId: string;
  credits: number;
  localizedPrice?: LocalizedPrice;
  fallbackPrice: string;
}

export interface SubscriptionProduct {
  tier: string;
  duration: string;
  productId: string;
  localizedPrice?: LocalizedPrice;
  fallbackPrice: string;
}

// Product IDs mapping
const CREDIT_PACK_PRODUCTS = [
  { id: 'pack_10', productId: 'com.midego.aiphotoeditor.credits.10', credits: 10, fallbackPrice: '$0.99' },
  { id: 'pack_25', productId: 'com.midego.aiphotoeditor.credits.25', credits: 25, fallbackPrice: '$2.19' },
  { id: 'pack_50', productId: 'com.midego.aiphotoeditor.credits.50', credits: 50, fallbackPrice: '$4.19' },
  { id: 'pack_100', productId: 'com.midego.aiphotoeditor.credits.100', credits: 100, fallbackPrice: '$7.99' },
];

const SUBSCRIPTION_PRODUCTS = [
  // Basic tier
  { tier: 'basic', duration: 'weekly', productId: 'com.midego.aiphotoeditor.basic.weekly', fallbackPrice: '$0.99' },
  { tier: 'basic', duration: '1month', productId: 'com.midego.aiphotoeditor.basic.1month', fallbackPrice: '$0.99' },
  { tier: 'basic', duration: '3months', productId: 'com.midego.aiphotoeditor.basic.3months', fallbackPrice: '$2.97' },
  // Pro tier
  { tier: 'pro', duration: 'weekly', productId: 'com.midego.aiphotoeditor.pro.weekly', fallbackPrice: '$3.99' },
  { tier: 'pro', duration: '1month', productId: 'com.midego.aiphotoeditor.pro.1month', fallbackPrice: '$4.99' },
  { tier: 'pro', duration: '3months', productId: 'com.midego.aiphotoeditor.pro.3months', fallbackPrice: '$14.37' },
  // Premium tier
  { tier: 'premium', duration: 'weekly', productId: 'com.midego.aiphotoeditor.premium.weekly', fallbackPrice: '$11.99' },
  { tier: 'premium', duration: '1month', productId: 'com.midego.aiphotoeditor.premium.1month', fallbackPrice: '$14.99' },
  { tier: 'premium', duration: '3months', productId: 'com.midego.aiphotoeditor.premium.3months', fallbackPrice: '$43.47' },
];

class IAPService {
  private isInitialized = false;
  private creditPackProducts: CreditPackProduct[] = [];
  private subscriptionProducts: SubscriptionProduct[] = [];

  /**
   * Initialize IAP connection and fetch products
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Check if IAP is available (not in Expo Go)
    if (!IAP) {
      console.log('[IAPService] IAP not available, using fallback prices');
      this.useFallbackPrices();
      this.isInitialized = true;
      return;
    }

    try {
      console.log('[IAPService] Initializing IAP connection...');
      await IAP.initConnection();
      console.log('[IAPService] IAP connection established');
      this.isInitialized = true;

      // Fetch product information
      await this.fetchProducts();
    } catch (error) {
      console.error('[IAPService] Failed to initialize IAP:', error);
      // Use fallback prices if initialization fails
      this.useFallbackPrices();
    }
  }

  /**
   * Fetch product information from the stores
   */
  private async fetchProducts(): Promise<void> {
    if (!IAP) {
      this.useFallbackPrices();
      return;
    }

    try {
      // Get all product IDs
      const creditPackProductIds = CREDIT_PACK_PRODUCTS.map(p => p.productId);
      const subscriptionProductIds = SUBSCRIPTION_PRODUCTS.map(p => p.productId);

      console.log('[IAPService] Fetching credit pack products:', creditPackProductIds);
      console.log('[IAPService] Fetching subscription products:', subscriptionProductIds);

      // Fetch products (non-consumables and consumables)
      let creditPackStoreProducts: any[] = [];
      try {
        creditPackStoreProducts = await IAP.getProducts({ skus: creditPackProductIds });
        console.log('[IAPService] Fetched credit pack products:', creditPackStoreProducts.length);
      } catch (error) {
        console.warn('[IAPService] Failed to fetch credit pack products:', error);
      }

      // Fetch subscriptions
      let subscriptionStoreProducts: any[] = [];
      try {
        subscriptionStoreProducts = await IAP.getSubscriptions({ skus: subscriptionProductIds });
        console.log('[IAPService] Fetched subscription products:', subscriptionStoreProducts.length);
      } catch (error) {
        console.warn('[IAPService] Failed to fetch subscription products:', error);
      }

      // Map credit packs with localized prices
      this.creditPackProducts = CREDIT_PACK_PRODUCTS.map(pack => {
        const storeProduct = creditPackStoreProducts.find(p => p.productId === pack.productId);

        if (storeProduct) {
          return {
            ...pack,
            localizedPrice: {
              price: storeProduct.localizedPrice,
              priceNumber: parseFloat(storeProduct.price),
              currency: storeProduct.currency,
            },
          };
        }

        // Use fallback if not found
        return pack;
      });

      // Map subscriptions with localized prices
      this.subscriptionProducts = SUBSCRIPTION_PRODUCTS.map(sub => {
        const storeProduct = subscriptionStoreProducts.find(p => p.productId === sub.productId);

        if (storeProduct) {
          return {
            ...sub,
            localizedPrice: {
              price: storeProduct.localizedPrice,
              priceNumber: parseFloat(storeProduct.price),
              currency: storeProduct.currency,
            },
          };
        }

        // Use fallback if not found
        return sub;
      });

      console.log('[IAPService] Products initialized successfully');
    } catch (error) {
      console.error('[IAPService] Failed to fetch products:', error);
      this.useFallbackPrices();
    }
  }

  /**
   * Use fallback prices if store products can't be fetched
   */
  private useFallbackPrices(): void {
    console.log('[IAPService] Using fallback prices');
    this.creditPackProducts = CREDIT_PACK_PRODUCTS;
    this.subscriptionProducts = SUBSCRIPTION_PRODUCTS;
  }

  /**
   * Get credit pack products with localized prices
   */
  getCreditPackProducts(): CreditPackProduct[] {
    return this.creditPackProducts;
  }

  /**
   * Get subscription products with localized prices
   */
  getSubscriptionProducts(): SubscriptionProduct[] {
    return this.subscriptionProducts;
  }

  /**
   * Get localized price for a specific subscription
   */
  getSubscriptionPrice(tier: string, duration: string): { price: string; currency?: string } {
    const product = this.subscriptionProducts.find(
      p => p.tier === tier && p.duration === duration
    );

    if (product?.localizedPrice) {
      return {
        price: product.localizedPrice.price,
        currency: product.localizedPrice.currency,
      };
    }

    // Fallback
    return {
      price: product?.fallbackPrice || '$0.00',
    };
  }

  /**
   * Get localized price for a credit pack
   */
  getCreditPackPrice(packId: string): { price: string; currency?: string } {
    const product = this.creditPackProducts.find(p => p.id === packId);

    if (product?.localizedPrice) {
      return {
        price: product.localizedPrice.price,
        currency: product.localizedPrice.currency,
      };
    }

    // Fallback
    return {
      price: product?.fallbackPrice || '$0.00',
    };
  }

  /**
   * Get user's currency code (from first loaded product)
   */
  getUserCurrency(): string {
    // Try to get from credit packs first
    const firstCreditPack = this.creditPackProducts.find(p => p.localizedPrice);
    if (firstCreditPack?.localizedPrice) {
      return firstCreditPack.localizedPrice.currency;
    }

    // Try subscriptions
    const firstSubscription = this.subscriptionProducts.find(p => p.localizedPrice);
    if (firstSubscription?.localizedPrice) {
      return firstSubscription.localizedPrice.currency;
    }

    // Default to USD
    return 'USD';
  }

  /**
   * Disconnect IAP
   */
  async disconnect(): Promise<void> {
    if (this.isInitialized && IAP) {
      try {
        await IAP.endConnection();
        this.isInitialized = false;
        console.log('[IAPService] IAP connection ended');
      } catch (error) {
        console.error('[IAPService] Failed to end IAP connection:', error);
      }
    }
  }
}

// Export singleton instance
export const iapService = new IAPService();
