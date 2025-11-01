# Apple Sign-In Setup Guide

This guide explains how to set up Apple Sign-In for your Supabase authentication.

> **Official Documentation**: [Supabase Apple Sign-In Guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)

## Overview

Apple Sign-In uses OAuth 2.0 through Supabase. When users tap "Sign in with Apple", they'll be redirected to Apple's sign-in page and then back to your app.

**Important**: Apple Sign-In is **iOS only**. For Android, use Google Sign-In instead.

### ⚠️ Critical Requirements

1. **Secret Key Rotation**: Apple requires generating a new secret key every **6 months** for OAuth flow
   - Set a calendar reminder for every 6 months
   - Store the `.p8` file securely - you'll need it for rotations
   - If lost or compromised, revoke immediately and create new key

2. **Full Name Handling**: Apple only provides the user's full name during the **first sign-in attempt**
   - All subsequent sign-ins return `null` for name fields
   - You must capture and save the name on first sign-in (see Step 5)

## Prerequisites

- Supabase project created and configured
- Apple Developer account ($99/year)
- App configured with deep linking scheme: `com.midego.aiphotoeditor`
- Bundle ID: `com.midego.aiphotoeditor`

## Step 1: Configure Apple Developer Portal

### 1.1 Create App ID (if not already created)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **App IDs** → **Continue**
5. Select **App** → **Continue**
6. Configure:
   - **Description**: Pixel Potion (or your app name)
   - **Bundle ID**: Use **Explicit** → Enter: `com.midego.aiphotoeditor`
   - **Capabilities**: Enable **Sign In with Apple**
7. Click **Continue** → **Register**

### 1.2 Create Services ID (for OAuth)

1. In **Identifiers**, click **+** button
2. Select **Services IDs** → **Continue**
3. Configure:
   - **Description**: Pixel Potion Web Auth (or similar)
   - **Identifier**: Enter a unique ID (e.g., `com.midego.aiphotoeditor.webauth`)
     - **Note**: This is different from your App ID
     - Usually follows pattern: `<your-app-id>.web` or `<your-app-id>.webauth`
4. Click **Continue** → **Register**
5. **Configure the Services ID**:
   - Check **Sign In with Apple**
   - Click **Configure**
   - **Primary App ID**: Select `com.midego.aiphotoeditor`
   - **Website URLs**:
     - **Domains and Subdomains**: `yesvqagalgpbpxsmthbt.supabase.co`
       - ⚠️ Use the **domain only** (no `https://`)
     - **Return URLs**: `https://yesvqagalgpbpxsmthbt.supabase.co/auth/v1/callback`
       - ⚠️ Must include `https://` and exact path
   - Click **Save** → **Continue** → **Save**

**Reference**: [Supabase - Configure Your Services ID](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)

### 1.3 Create a Key (for OAuth)

1. In **Certificates, Identifiers & Profiles**, click **Keys**
2. Click **+** button to create a new key
3. Configure:
   - **Key Name**: Pixel Potion Apple Auth Key
   - **Enable Sign In with Apple**: ✅ Check this
4. Click **Configure**:
   - **Primary App ID**: Select `com.midego.aiphotoeditor`
   - Click **Save**
5. Click **Continue** → **Register**
6. **⚠️ IMPORTANT**: Download the `.p8` key file and note the **Key ID**
   - You won't be able to download this again!
   - Save it securely (but you'll use it in Supabase)

### 1.4 Get Your Team ID

1. In Apple Developer Portal, go to **Membership**
2. Find your **Team ID** (10-character string, e.g., `ABCDEFGHIJ`)
3. Copy it - you'll need this for Supabase

## Step 2: Configure Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**

2. Find **Apple** and click to expand

3. **Enable Apple provider**:
   - Toggle **Enable Apple provider** to **ON**

4. **Enter credentials**:

   **Services ID (for OAuth)**:
   - This is the Services ID you created in Step 1.2
   - Example: `com.midego.aiphotoeditor.webauth`

   **Secret Key**:
   - **⚠️ IMPORTANT**: You cannot paste the `.p8` file directly
   - You must generate a **JWT secret token** from the `.p8` file
   - **Easiest Method**: Use Supabase's built-in secret key generator tool
     - Linked in the Apple provider configuration page in Supabase dashboard
     - Upload your `.p8` file and enter Team ID, Key ID, and Services ID
     - Generates the JWT automatically
   - **Alternative**: Generate JWT manually using your `.p8` file, Team ID, Key ID, and Client ID
   - The Secret Key field expects a JWT token, not raw `.p8` file contents
   
   **Reference**: [Supabase - Generate Apple Client Secret](https://supabase.com/docs/guides/auth/social-login/auth-apple#configure-your-services-id)

   **Key ID**:
   - This is the Key ID from Step 1.3
   - Found in Apple Developer Portal → Keys → Your key

   **Team ID**:
   - This is your Team ID from Step 1.4
   - Found in Apple Developer Portal → Membership

   **App ID**:
   - This is your main App ID: `com.midego.aiphotoeditor`

5. **Configure redirect URL** (already done if you set up Google):
   - Go to **Authentication** → **URL Configuration**
   - Ensure **Redirect URLs** includes:
     - `com.midego.aiphotoeditor://auth-callback`
   - This should already be configured from Google Sign-In setup

6. Click **Save**

## Step 3: Verify App Configuration

Your app is already configured with:
- ✅ Deep link scheme: `com.midego.aiphotoeditor` (in `app.config.js`)
- ✅ Auth service method: `AuthService.signInWithApple()`
- ✅ Redirect handler: `com.midego.aiphotoeditor://auth-callback`
- ✅ iOS-only check: Apple Sign-In only shows on iOS devices

## Step 4: Update Auth Service to Handle Full Name

Since Apple only provides the user's full name on the **first sign-in**, we need to update the auth service to capture and save it. Update `src/services/authService.ts`:

```typescript
/**
 * Sign in with Apple (iOS only)
 * Captures full name on first sign-in as per Apple's behavior
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
        // Request name and email scopes
        scopes: 'name email',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Note: Full name handling must be done after redirect in the callback
    // See Step 5 for handling the name after authentication completes
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Apple sign in failed' };
  }
}
```

**Important**: When using OAuth flow, Apple doesn't provide full name in the response. You'll need to:
1. Collect name through an onboarding form after first sign-in, OR
2. Use native Sign in with Apple SDK (which provides name on first sign-in)

For React Native with Expo, the OAuth flow is recommended, but name collection requires a separate step.

## Step 5: Handle Full Name After Authentication

Since Apple only provides the full name on **first sign-in** and not in OAuth flow responses, you have two options:

### Option A: Collect Name After Sign-In (Recommended for OAuth)

After successful authentication, prompt the user to provide their name:

```typescript
import { AuthService } from '@/services/authService';
import { getSupabaseClient } from '@/services/supabaseService';

const handleAppleSignIn = async () => {
  const result = await AuthService.signInWithApple();
  
  if (result.success) {
    // Listen for auth state change
    const unsubscribe = AuthService.onAuthStateChange(async (session) => {
      if (session) {
        const user = session.user;
        
        // Check if user doesn't have a name yet
        if (!user.user_metadata?.full_name) {
          // Prompt user for name or collect from onboarding
          // Then update:
          const supabase = getSupabaseClient();
          await supabase.auth.updateUser({
            data: {
              full_name: 'User Name', // From your form
              given_name: 'First',
              family_name: 'Last',
            },
          });
        }
        
        unsubscribe();
      }
    });
  }
};
```

### Option B: Use Native Sign in with Apple (Future Enhancement)

For better name handling, consider using native Sign in with Apple with `expo-apple-authentication`:

```bash
npm install expo-apple-authentication
```

This provides direct access to the name on first sign-in, but requires more native setup.

## Step 6: Test Apple Sign-In

1. Call the sign-in method:
   ```typescript
   const result = await AuthService.signInWithApple();
   ```

2. Expected flow:
   - User taps "Sign in with Apple"
   - Browser/WebView opens → Apple sign-in page
   - User authenticates with Apple ID
   - Apple redirects to Supabase: `https://yesvqagalgpbpxsmthbt.supabase.co/auth/v1/callback`
   - Supabase processes auth → Redirects to app: `com.midego.aiphotoeditor://auth-callback`
   - App receives session
   - User is authenticated

3. Check authentication:
   ```typescript
   const isAuthenticated = await AuthService.isAuthenticated();
   const user = await AuthService.getCurrentUser();
   ```

## Troubleshooting

### "Invalid client" error
- **Fix**: Verify Services ID, Key ID, Team ID, and Secret Key are correct
- Double-check the `.p8` file content is pasted correctly (include BEGIN/END lines)

### "Redirect URI mismatch" error
- **Fix**: Ensure Return URL in Apple Services ID exactly matches:
  - `https://yesvqagalgpbpxsmthbt.supabase.co/auth/v1/callback`
- Check Domain and Subdomain matches: `yesvqagalgpbpxsmthbt.supabase.co`

### Apple Sign-In sheet doesn't appear
- **Fix**: 
  - Verify "Sign In with Apple" capability is enabled for your App ID
  - Ensure you're testing on a real iOS device (simulator may have limitations)
  - Check that Services ID is properly configured with correct Return URL

### Secret Key format issues
- **Fix**: The `.p8` file should be pasted with:
  - `-----BEGIN PRIVATE KEY-----`
  - (key content)
  - `-----END PRIVATE KEY-----`
- Make sure there are no extra spaces or line breaks in the middle

## Important Notes

### Security
- **Secret Key**: Never commit the `.p8` file to git
- Store it securely (password manager, secret management service)
- The key is used server-side by Supabase, not in your app
- **Rotate every 6 months**: Set calendar reminder to generate new secret key

### Secret Key Rotation
As per [Supabase documentation](https://supabase.com/docs/guides/auth/social-login/auth-apple), Apple requires secret key rotation every 6 months:

1. Generate new key in Apple Developer Portal
2. Use the secret key generator tool (linked in Supabase dashboard) or generate JWT manually
3. Update Secret Key in Supabase dashboard
4. Revoke old key in Apple Developer Portal after confirming new one works

### Services ID vs App ID
- **App ID** (`com.midego.aiphotoeditor`): Your main app identifier
- **Services ID** (`com.midego.aiphotoeditor.webauth`): Used specifically for web OAuth
- They're different and both are needed!

### Testing
- Apple Sign-In requires a **real iOS device** for full testing
- Simulator may show sign-in, but full flow works best on device
- Test users need to have Apple IDs configured on their devices

### Production
- Services ID must be configured correctly before production
- Test thoroughly on device before releasing
- Apple Sign-In is iOS 13+ only

## Code Example

### Complete Sign-In Flow with Name Handling

```typescript
import { Platform, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { AuthService } from '@/services/authService';
import { getSupabaseClient } from '@/services/supabaseService';

const SignInScreen = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for auth state changes to handle name
    const unsubscribe = AuthService.onAuthStateChange(async (session) => {
      if (session) {
        const user = session.user;
        
        // Check if user signed in with Apple and doesn't have name
        if (
          user.app_metadata?.provider === 'apple' &&
          !user.user_metadata?.full_name
        ) {
          // Option 1: Show onboarding form to collect name
          // Option 2: Use default "Apple User"
          const supabase = getSupabaseClient();
          await supabase.auth.updateUser({
            data: {
              full_name: 'Apple User', // Or prompt user for name
            },
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'Apple Sign-In is only available on iOS');
      return;
    }

    setLoading(true);
    const result = await AuthService.signInWithApple();
    
    if (!result.success) {
      Alert.alert('Error', result.error || 'Apple sign-in failed');
      setLoading(false);
    }
    // Loading will be set to false when auth state change listener fires
  };

  return (
    <Button 
      title="Sign in with Apple"
      onPress={handleAppleSignIn}
      disabled={loading}
    />
  );
};
```

**Reference**: [Supabase - Apple Sign-In OAuth Flow](https://supabase.com/docs/guides/auth/social-login/auth-apple#using-the-oauth-flow-for-web)

## Next Steps

After Apple Sign-In is working:
- Test on a real iOS device
- Monitor authentication logs in Supabase Dashboard
- Consider adding email/password as fallback
- Set up Google Sign-In for Android users

---

**Note**: Apple Sign-In setup is more complex than Google Sign-In because it requires:
1. Services ID creation
2. Key generation and download
3. Multiple IDs (App ID, Services ID, Team ID, Key ID)

But once configured, it provides a seamless native iOS experience!

