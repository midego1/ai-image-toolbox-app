# Authentication Usage Examples

This guide shows how to use Google Sign-In (and other auth methods) in your app.

## Quick Start

### Basic Google Sign-In

```typescript
import { AuthService } from '@/services/authService';

// In your component or screen
const handleGoogleSignIn = async () => {
  const result = await AuthService.signInWithGoogle();
  
  if (result.success) {
    // OAuth flow initiated - browser will open
    // User will be redirected back after sign-in
    console.log('Google sign-in initiated');
  } else {
    console.error('Sign-in failed:', result.error);
  }
};

// In your JSX
<Button onPress={handleGoogleSignIn}>
  Sign in with Google
</Button>
```

### Using Auth Helpers (Recommended)

```typescript
import { signInWithGoogleFlow, useAuthRedirectHandler } from '@/services/authHelpers';
import { useEffect } from 'react';

// In your root component or App.tsx
export default function App() {
  // This automatically handles OAuth redirects
  useAuthRedirectHandler();
  
  // ... rest of your app
}

// In your sign-in screen
const handleGoogleSignIn = async () => {
  const result = await signInWithGoogleFlow();
  
  if (result.success) {
    // User is being redirected to Google sign-in
    // You can show a loading state
  } else {
    Alert.alert('Error', result.error);
  }
};
```

## Complete Example: Sign-In Screen

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, ActivityIndicator } from 'react-native';
import { AuthService } from '@/services/authService';
import { signInWithGoogleFlow, signInWithAppleFlow } from '@/services/authHelpers';

export const SignInScreen = () => {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    checkAuthState();
    
    // Listen for auth state changes (handles OAuth redirects)
    const unsubscribe = AuthService.onAuthStateChange((session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
      if (session) {
        Alert.alert('Success', 'Signed in successfully!');
      }
    });
    
    return () => unsubscribe();
  }, []);

  const checkAuthState = async () => {
    const authenticated = await AuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await signInWithGoogleFlow();
    
    if (!result.success) {
      Alert.alert('Error', result.error || 'Google sign-in failed');
      setLoading(false);
    }
    // If successful, OAuth flow will complete via redirect
    // Auth state change listener will handle success
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    const result = await signInWithAppleFlow();
    
    if (!result.success) {
      Alert.alert('Error', result.error || 'Apple sign-in failed');
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    setLoading(true);
    const result = await AuthService.signIn(email, password);
    
    if (result.success) {
      setIsAuthenticated(true);
      Alert.alert('Success', 'Signed in successfully!');
    } else {
      Alert.alert('Error', result.error || 'Sign-in failed');
    }
    setLoading(false);
  };

  if (isAuthenticated) {
    return (
      <View>
        <Text>You're signed in!</Text>
        <Button 
          title="Sign Out" 
          onPress={async () => {
            await AuthService.signOut();
            setIsAuthenticated(false);
          }} 
        />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Sign In</Text>
      
      {loading && <ActivityIndicator />}
      
      <Button 
        title="Sign in with Google" 
        onPress={handleGoogleSignIn}
        disabled={loading}
      />
      
      {/* iOS only */}
      {Platform.OS === 'ios' && (
        <Button 
          title="Sign in with Apple" 
          onPress={handleAppleSignIn}
          disabled={loading}
        />
      )}
      
      {/* Email/Password form would go here */}
    </View>
  );
};
```

## OAuth Flow Explained

1. **User taps "Sign in with Google"**
   - `AuthService.signInWithGoogle()` is called
   - Returns OAuth URL

2. **Browser opens with Google sign-in**
   - User enters credentials
   - Google authenticates

3. **Redirect back to app**
   - Google redirects to: `com.midego.aiphotoeditor://auth-callback`
   - Supabase client automatically processes the redirect
   - Session is created

4. **Auth state updates**
   - `onAuthStateChange` listener fires
   - App updates UI to show signed-in state

## Checking Authentication Status

```typescript
// Check if user is authenticated
const isAuthenticated = await AuthService.isAuthenticated();

// Get current user
const user = await AuthService.getCurrentUser();

// Get current session
const session = await AuthService.getCurrentSession();
```

## Listening to Auth State Changes

```typescript
import { useEffect } from 'react';
import { AuthService } from '@/services/authService';

const MyComponent = () => {
  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = AuthService.onAuthStateChange((session) => {
      if (session) {
        console.log('User signed in:', session.user.email);
      } else {
        console.log('User signed out');
      }
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  return <View>...</View>;
};
```

## Sign Out

```typescript
const handleSignOut = async () => {
  const success = await AuthService.signOut();
  
  if (success) {
    console.log('Signed out successfully');
    // Update UI, navigate to sign-in screen, etc.
  } else {
    console.error('Sign out failed');
  }
};
```

## Notes

- **OAuth Redirects**: Supabase automatically handles OAuth redirects. The `authHelpers` provide additional utilities for better control.

- **Deep Links**: The app is configured with deep link scheme `com.midego.aiphotoeditor` in `app.config.js`.

- **Platform Support**:
  - Google Sign-In: ✅ iOS and Android
  - Apple Sign-In: ✅ iOS only
  - Email/Password: ✅ iOS and Android

- **Error Handling**: Always check `result.success` and handle errors appropriately.

- **Loading States**: Show loading indicators during OAuth flows since they involve browser redirects.

## Troubleshooting

### OAuth redirect not working
- Verify deep link scheme in `app.config.js`: `scheme: "com.midego.aiphotoeditor"`
- Check Supabase redirect URL configuration
- Ensure Google OAuth redirect URI matches Supabase callback URL

### "Supabase not configured" error
- Check `.env` file has `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Restart dev server after adding to `.env`

### Browser opens but user doesn't return to app
- Verify redirect URL is configured correctly in both Google Console and Supabase
- Check that deep link scheme is registered



