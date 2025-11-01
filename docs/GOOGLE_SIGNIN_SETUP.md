# Google Sign-In Setup Guide

This guide explains how to set up Google Sign-In for your Supabase authentication.

## Overview

Google Sign-In uses OAuth 2.0 through Supabase. When users tap "Sign in with Google", they'll be redirected to Google's sign-in page and then back to your app.

## Prerequisites

- Supabase project created and configured
- Google Cloud Console account
- App configured with deep linking scheme: `com.midego.aiphotoeditor`

## Step 1: Create Google OAuth Credentials

### Why Web Application Client?

**Important**: Supabase uses a **web-based OAuth flow**, not native iOS/Android Google Sign-In SDKs. Here's why you need a Web application client:

1. **OAuth Flow Path**:
   - Your app → Opens browser → Google OAuth page (web)
   - Google → Redirects to Supabase's web server: `https://your-project.supabase.co/auth/v1/callback`
   - Supabase → Processes auth → Redirects back to your app via deep link: `com.midego.aiphotoeditor://auth-callback`

2. **Why Web Client?**: 
   - Google redirects to Supabase's **web URL** (not directly to your iOS app)
   - The OAuth callback happens on Supabase's server, which is a web application
   - Your iOS app only receives the final result via deep link

3. **iOS Client Not Needed**: 
   - ❌ You do **NOT** need an iOS OAuth client for Supabase authentication
   - ✅ Only the **Web application** client is required
   - (iOS clients are only needed if using Google Sign-In SDK directly, which Supabase doesn't use)

### Steps to Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)

2. Create or select a project:
   - Click project dropdown → **New Project** or select existing
   - Give it a name (e.g., "Pixel Potion App")

3. Configure OAuth consent screen (if prompted):
   - Go to **APIs & Services** → **OAuth consent screen**
   - **User Type**: External (or Internal for Google Workspace)
   - **App name**: Pixel Potion (or your app name)
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **Save and Continue**
   - **Scopes**: Keep defaults (`email`, `profile`)
   - **Test users**: Add your email for testing (if in testing mode)
   - Click **Save and Continue** → **Back to Dashboard**

4. Create Web Application OAuth Client ID:
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - **Application type**: **Web application** (this is the one you need!)
   - **Name**: Pixel Potion Web Client
   - **Authorized redirect URIs**: 
     - Click **+ ADD URI**
     - Add: `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - To find your project ref: Supabase Dashboard → Settings → API → Project URL
     - Example: `https://yesvqagalgpbpxsmthbt.supabase.co/auth/v1/callback`
   - Click **Create**
   - **⚠️ Important**: Copy the **Client ID** and **Client Secret** immediately (you won't see the secret again!)

## Step 2: Configure Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**

2. Find **Google** and click to expand

3. Enable Google provider:
   - Toggle **Enable Google provider** to ON

4. Enter credentials:
   - **Client ID (for OAuth)**: Paste your Google OAuth Client ID
   - **Client Secret (for OAuth)**: Paste your Google OAuth Client Secret

5. Configure redirect URL:
   - Go to **Authentication** → **URL Configuration**
   - Add to **Redirect URLs**:
     - `com.midego.aiphotoeditor://auth-callback`
   - **Site URL**: Your app URL or leave default
   - Click **Save**

## Step 3: Verify App Configuration

Your app is already configured with:
- ✅ Deep link scheme: `com.midego.aiphotoeditor` (in `app.config.js`)
- ✅ Auth service method: `AuthService.signInWithGoogle()`
- ✅ Redirect handler: `com.midego.aiphotoeditor://auth-callback`

## Step 4: Handle OAuth Redirect (Optional Enhancement)

For better OAuth experience in React Native, you might want to use `expo-web-browser`:

```bash
npm install expo-web-browser
```

Then update the auth flow to handle OAuth redirects properly. The current implementation works, but `expo-web-browser` provides a smoother in-app browser experience.

## Step 5: Test Google Sign-In

1. In your app, call:
   ```typescript
   const result = await AuthService.signInWithGoogle();
   if (result.success) {
     // User will be redirected to Google sign-in
     // Session will be created after redirect
   }
   ```

2. Expected flow:
   - Browser opens with Google sign-in
   - User signs in with Google account
   - Browser redirects back to app
   - Session is automatically created
   - User is authenticated

3. Check authentication:
   ```typescript
   const isAuthenticated = await AuthService.isAuthenticated();
   const user = await AuthService.getCurrentUser();
   ```

## Troubleshooting

### "Redirect URI mismatch" error
- **Fix**: Ensure the redirect URI in Google Cloud Console exactly matches:
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`
- Check your Supabase project URL in Settings → API

### "Invalid client" error
- **Fix**: Verify Client ID and Client Secret are correct in Supabase
- Double-check they're from the correct Google Cloud project

### OAuth redirect not working
- **Fix**: Ensure deep link scheme is configured:
  - `app.config.js` has `scheme: "com.midego.aiphotoeditor"`
  - Supabase redirect URL includes: `com.midego.aiphotoeditor://auth-callback`

### Browser opens but doesn't redirect back
- **Fix**: This might require `expo-web-browser` for better handling
- Check that redirect URL is correctly configured in both Google Console and Supabase

## Additional Notes

### Web Client vs iOS Client

- ✅ **Web Application Client**: **REQUIRED** - This is what Supabase uses
- ❌ **iOS Client**: **NOT NEEDED** - Only required if using Google Sign-In SDK directly (which Supabase doesn't use)

**Why?** Supabase handles OAuth through its web server. Google redirects to Supabase's web callback URL, then Supabase redirects to your app. The entire flow is web-based until the final deep link to your app.

### Other Notes

- **Test Users**: During development, add test users in Google OAuth consent screen
- **Production**: Before going live, submit OAuth consent screen for verification
- **Scopes**: Default scopes (email, profile) are sufficient for basic auth
- **Multiple Platforms**: Same Web OAuth credentials work for both iOS and Android (one client for both!)

## Next Steps

After Google Sign-In is working:
- Test with real users
- Monitor authentication logs in Supabase Dashboard
- Set up Apple Sign-In for iOS (if not already done)
- Add email/password sign-in as fallback option

