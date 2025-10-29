// Simplified subscription service - will use App Store Connect for real purchases
// For now, using local storage to track free transformations

import * as SecureStore from 'expo-secure-store';
import { AIService } from './aiService';

const SUBSCRIPTION_KEY = 'ai_photo_pro';
const TRANSFORMATIONS_USED_KEY = 'transformations_used';
const MAX_FREE_TRANSFORMATIONS = 3;

export class SubscriptionService {
  static async init(): Promise<boolean> {
    return true;
  }

  static async purchaseSubscription(): Promise<boolean> {
    // TODO: Implement real in-app purchase
    // For MVP, simulate successful purchase
    try {
      await SecureStore.setItemAsync(SUBSCRIPTION_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Failed to save subscription:', error);
      return false;
    }
  }

  static async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const subscription = await SecureStore.getItemAsync(SUBSCRIPTION_KEY);
      return subscription === 'true';
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return false;
    }
  }

  static async getTransformationsUsed(): Promise<number> {
    try {
      const used = await SecureStore.getItemAsync(TRANSFORMATIONS_USED_KEY);
      return used ? parseInt(used, 10) : 0;
    } catch (error) {
      console.error('Failed to get transformations used:', error);
      return 0;
    }
  }

  static async incrementTransformationsUsed(): Promise<void> {
    try {
      const used = await this.getTransformationsUsed();
      await SecureStore.setItemAsync(TRANSFORMATIONS_USED_KEY, (used + 1).toString());
    } catch (error) {
      console.error('Failed to increment transformations:', error);
    }
  }

  static async canUseTransformation(): Promise<boolean> {
    const isPremium = await this.checkSubscriptionStatus();
    if (isPremium) {
      return true;
    }

    const used = await this.getTransformationsUsed();
    return used < MAX_FREE_TRANSFORMATIONS;
  }

  static async canTransform(): Promise<boolean> {
    return this.canUseTransformation();
  }

  static async incrementTransformations(): Promise<void> {
    return this.incrementTransformationsUsed();
  }

  static async cancelSubscription(): Promise<boolean> {
    // Reset subscription status
    try {
      await SecureStore.deleteItemAsync(SUBSCRIPTION_KEY);
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  static async resetSubscription(): Promise<boolean> {
    // Reset both subscription and transformations count
    try {
      await SecureStore.deleteItemAsync(SUBSCRIPTION_KEY);
      await SecureStore.deleteItemAsync(TRANSFORMATIONS_USED_KEY);
      return true;
    } catch (error) {
      console.error('Failed to reset subscription:', error);
      return false;
    }
  }
}
