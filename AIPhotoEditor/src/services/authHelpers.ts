// Helper functions for authentication flows
// Provides utilities for handling OAuth redirects and auth state
// Note: expo-linking is part of Expo SDK and should be available
// If not, you may need to install it: npm install expo-linking

import { AuthService } from './authService';
import { useEffect } from 'react';

// Dynamic import for expo-linking (handles case where it might not be installed)
let Linking: any = null;
try {
  Linking = require('expo-linking');
} catch (e) {
  console.warn('[AuthHelper] expo-linking not found. OAuth redirects may need manual handling.');
}

/**
 * Handle OAuth redirect from deep link
 * Call this in your app's root component or where you handle deep links
 * Note: Supabase client automatically handles OAuth redirects, but this provides additional verification
 */
export const handleAuthRedirect = async (url: string): Promise<boolean> => {
  if (!Linking) {
    console.warn('[AuthHelper] expo-linking not available. Supabase will handle redirect automatically.');
    // Still verify auth was successful
    const isAuthenticated = await AuthService.isAuthenticated();
    return isAuthenticated;
  }

  try {
    const { path, queryParams } = Linking.parse(url);
    
    // Check if this is an auth callback
    if (path === 'auth-callback' || queryParams?.access_token) {
      // Supabase client will automatically handle the session from the URL
      // Just verify authentication was successful
      const isAuthenticated = await AuthService.isAuthenticated();
      
      if (isAuthenticated) {
        console.log('[AuthHelper] Authentication successful via OAuth redirect');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('[AuthHelper] Failed to handle auth redirect:', error);
    return false;
  }
};

/**
 * React hook to handle OAuth redirects
 * Use this in your root component to automatically handle auth callbacks
 * Note: Requires expo-linking to be installed for full functionality
 */
export const useAuthRedirectHandler = () => {
  useEffect(() => {
    if (!Linking) {
      console.warn('[AuthHelper] expo-linking not available. OAuth will still work, but redirect handling is limited.');
      return;
    }

    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleAuthRedirect(url);
      }
    });

    // Handle deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleAuthRedirect(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);
};

/**
 * Sign in with Google and handle OAuth flow
 * Returns promise that resolves when user completes sign-in
 */
export const signInWithGoogleFlow = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Initiate Google Sign-In
    const result = await AuthService.signInWithGoogle();
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // OAuth flow:
    // 1. Browser opens with Google sign-in
    // 2. User authenticates
    // 3. Browser redirects to app via deep link
    // 4. Supabase client automatically processes the redirect
    // 5. Session is created

    // Note: The actual session creation happens via the redirect handler
    // You may want to poll or listen for auth state changes
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Google sign-in failed' };
  }
};

/**
 * Sign in with Apple and handle OAuth flow (iOS)
 */
export const signInWithAppleFlow = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const result = await AuthService.signInWithApple();
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Apple sign-in failed' };
  }
};
