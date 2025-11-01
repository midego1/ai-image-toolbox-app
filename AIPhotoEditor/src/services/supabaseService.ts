// Supabase client service
// Provides singleton Supabase client instance for database and auth operations

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase URL and anon key from environment/config
const getSupabaseConfig = () => {
  // Try from app.config.js extra (for EAS environment variables)
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                      Constants.expoConfig?.extra?.SUPABASE_URL || '';
  const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                          Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';

  return { supabaseUrl, supabaseAnonKey };
};

// Custom storage adapter for React Native using SecureStore
const createSecureStoreAdapter = () => {
  return {
    getItem: async (key: string) => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('[Supabase] Error getting item:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('[Supabase] Error setting item:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('[Supabase] Error removing item:', error);
      }
    },
  };
};

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables or app.config.js'
    );
  }

  // Ensure all boolean values are actual booleans, not strings
  // Use explicit boolean literals to avoid any type coercion issues
  const autoRefreshToken: boolean = true;
  const persistSession: boolean = true;
  const detectSessionInUrl: boolean = false;

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createSecureStoreAdapter(),
      autoRefreshToken,
      persistSession,
      detectSessionInUrl,
    },
  });

  return supabaseClient;
};

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    return !!(supabaseUrl && supabaseAnonKey);
  } catch {
    return false;
  }
};

/**
 * Reset Supabase client (useful for testing or reconfiguration)
 */
export const resetSupabaseClient = (): void => {
  supabaseClient = null;
};
