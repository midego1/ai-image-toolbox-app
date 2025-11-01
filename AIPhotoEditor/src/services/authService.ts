// Authentication service using Supabase Auth
// Handles user authentication, account creation, and session management

import { getSupabaseClient, isSupabaseConfigured } from './supabaseService';
import { Session, User } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  session?: Session;
}

export class AuthService {
  /**
   * Initialize auth service and check for existing session
   */
  static async init(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      console.warn('[AuthService] Supabase not configured, skipping auth initialization');
      return null;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthService] Error getting session:', error);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('[AuthService] Failed to initialize:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const supabase = getSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('[AuthService] Failed to get user:', error);
      return null;
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const supabase = getSupabaseClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('[AuthService] Failed to get session:', error);
      return null;
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user || undefined,
        session: data.session || undefined,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign up failed' };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user,
        session: data.session || undefined,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign in failed' };
    }
  }

  /**
   * Sign in with Apple (iOS only)
   * 
   * Note: Apple only provides user's full name during the first sign-in attempt.
   * All subsequent sign-ins return null for name fields. The name must be captured
   * and saved using updateUser() method on first sign-in.
   * 
   * For OAuth flow, full name is not available in the response. Consider:
   * - Collecting name through onboarding form after first sign-in
   * - Using native Sign in with Apple SDK for better name handling
   * 
   * Reference: https://supabase.com/docs/guides/auth/social-login/auth-apple
   */
  static async signInWithApple(): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'com.midego.aiphotoeditor://auth-callback',
          // Request name and email scopes (though name only available on first sign-in)
          scopes: 'name email',
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // OAuth returns a URL, actual session comes later via redirect
      // Full name handling must be done after redirect in the callback
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Apple sign in failed' };
    }
  }

  /**
   * Sign in with Google (iOS and Android)
   */
  static async signInWithGoogle(): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Deep link redirect for React Native
          redirectTo: 'com.midego.aiphotoeditor://auth-callback',
          // Optional: Request specific scopes
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // OAuth returns a URL, actual session comes later via redirect
      // For React Native, the OAuth flow will open browser and redirect back
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Google sign in failed' };
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthService] Sign out error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[AuthService] Failed to sign out:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (session: Session | null) => void): () => void {
    if (!isSupabaseConfigured()) {
      return () => {}; // Return no-op unsubscribe function
    }

    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }
}
