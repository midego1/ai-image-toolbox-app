# EAS Configuration Guide

This guide shows you how to configure EAS Secrets for your Replicate API key so it works in TestFlight builds.

## Quick Setup (Command Line)

### 1. Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### 2. Login to EAS

```bash
eas login
```

This will open a browser window for you to authenticate with your Expo account.

### 3. Get Your Replicate API Key

1. Go to [Replicate.com](https://replicate.com) and sign in
2. Navigate to [Account Settings → API Tokens](https://replicate.com/account/api-tokens)
3. Click **"Create token"** or copy your existing token
4. **Copy the token** - it looks like `r8_...` (starts with `r8_`)

### 4. Create the EAS Secret

Run this command (replace `YOUR_REPLICATE_API_KEY` with your actual key):

```bash
eas secret:create --scope project --name REPLICATE_API_KEY --value YOUR_REPLICATE_API_KEY
```

**Example:**
```bash
eas secret:create --scope project --name REPLICATE_API_KEY --value r8_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### 5. Verify the Secret is Set

```bash
eas secret:list
```

You should see `REPLICATE_API_KEY` in the list with a masked value.

## Alternative: Using Expo Dashboard

If you prefer a web interface:

1. Go to [expo.dev](https://expo.dev)
2. Sign in with your Expo account
3. Select your project: **AI Photo Editor** (or navigate to it)
4. Click on **Secrets** in the left sidebar
5. Click **"Create Secret"** button
6. Fill in the form:
   - **Name**: `REPLICATE_API_KEY` (must be exactly this)
   - **Value**: Paste your Replicate API key (starts with `r8_`)
   - **Scope**: Project
7. Click **"Save"**

## How It Works

- EAS automatically maps the secret name `REPLICATE_API_KEY` (uppercase with underscores) to `replicateApiKey` (camelCase) in your `app.json` `extra` field during build time
- Your `app.json` can have `"replicateApiKey": ""` (empty string) - EAS will inject the secret value automatically
- The secret is only included in production builds, not in your source code

## EAS Secrets vs Environment Variables

EAS supports two ways to store secrets:

### Option 1: EAS Secrets (Current Setup - Recommended)
```bash
eas secret:create --scope project --name REPLICATE_API_KEY --value YOUR_KEY
```
- Works for **all build profiles** (preview, production, development)
- Simpler to manage
- ✅ **This is what you currently have set up**

### Option 2: EAS Environment Variables (Newer)
```bash
eas env:create --scope project --name REPLICATE_API_KEY --value YOUR_KEY --environment preview
```
- Allows you to have different values per environment (preview, production, etc.)
- More granular control
- If you selected "preview" environment, this would create an env var only for preview builds

**For your use case**: The EAS Secret you already have (via `eas secret:create`) will work for **all environments** including preview builds. You don't need to create a separate environment variable unless you want different API keys for different build profiles.

## Update an Existing Secret

If you need to update the secret with a new API key:

```bash
eas secret:update --scope project --name REPLICATE_API_KEY --value YOUR_NEW_API_KEY
```

## Delete a Secret

If you need to remove a secret:

```bash
eas secret:delete --scope project --name REPLICATE_API_KEY
```

## Verify It's Working

After setting the secret and building your app:

1. The app should automatically load the API key on startup
2. Check the Settings screen → DEVELOPER section → "Replicate API Key" should show "Configured"
3. Try using the Transform AI tool - it should work without errors

## Troubleshooting

### Secret not being injected?

- Make sure the secret name is exactly `REPLICATE_API_KEY` (uppercase, underscores)
- Verify you're building with a production profile: `eas build --platform ios --profile production-ios`
- Check that you're in the correct project: `eas project:info`

### Still getting "API key not configured" error?

1. **For TestFlight builds**: Make sure you set the EAS Secret before building
2. **For development builds**: You can manually enter the key in Settings → DEVELOPER → Replicate API Key
3. **Rebuild required**: After setting EAS Secrets, you need to create a new build

```bash
# After setting the secret, rebuild:
eas build --platform ios --profile production-ios
```

### Check what secrets are available

```bash
eas secret:list
```

## Security Notes

- ✅ **Never commit real API keys to git** - they should only be in EAS Secrets
- ✅ EAS Secrets are encrypted and only available during build time
- ✅ The secret is never included in your source code or git repository
- ⚠️ Anyone with access to your Expo project can see the secret names (but not values in the dashboard)

## Next Steps

After setting up the EAS Secret:

1. Build a new production build: `eas build --platform ios --profile production-ios`
2. Submit to TestFlight: `eas submit --platform ios --latest`
3. Test the Transform AI tool - it should work now!

For full TestFlight deployment instructions, see: [TESTFLIGHT_DEPLOYMENT_GUIDE.md](./TESTFLIGHT_DEPLOYMENT_GUIDE.md)

