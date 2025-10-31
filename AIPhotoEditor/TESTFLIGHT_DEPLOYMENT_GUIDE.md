# TestFlight Deployment Guide

This guide will walk you through deploying your AI Photo Editor app to TestFlight using Expo Application Services (EAS).

## Prerequisites

1. **Apple Developer Account** - You need an active Apple Developer Program membership ($99/year)
2. **App Store Connect Access** - Your Apple ID must have access to App Store Connect
3. **Expo Account** - Sign up at [expo.dev](https://expo.dev) if you don't have one

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to EAS

```bash
eas login
```

This will open a browser window for you to authenticate with your Expo account.

## Step 3: Create App ID in Apple Developer Portal ⚠️ REQUIRED FIRST

**You must create an App ID in Apple Developer Portal before EAS can build your app.** This registers your bundle identifier.

### 3a. Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Sign in with your Apple Developer account
3. Navigate to **Certificates, Identifiers & Profiles**
4. Click on **Identifiers** in the left sidebar
5. Click the **+** button (top left) to create a new identifier
6. Select **App IDs** and click **Continue**
7. Select **App** and click **Continue**
8. Fill in the details:
   - **Description**: `AI Photo Editor` (or any descriptive name)
   - **Bundle ID**: Select **Explicit** and enter: `com.midego.aiphotoeditor`
9. **Enable Capabilities** that your app uses:
   - ✅ Camera (required)
   - ✅ Photo Library (required)
   - ✅ Push Notifications (if you plan to use them)
10. Click **Continue** and then **Register**

### 3b. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in the details:
   - **Platform**: iOS
   - **Name**: `AI Photo Editor` (this is what users will see)
   - **Primary Language**: Your preferred language
   - **Bundle ID**: Select `com.midego.aiphotoeditor` (the App ID you just created)
   - **SKU**: `aiphotoeditor` (unique identifier, can be anything)
4. Click **Create**

**Note:** You'll need to complete some required information later (like privacy policy URL, app description, etc.) but you can skip these for now to get TestFlight working.

### 3c. Get Your App Store Connect App ID

1. In App Store Connect, go to your app
2. Click on **App Information** in the left sidebar
3. Scroll down and find **Apple ID** (looks like `1234567890`) - **Copy this number**
4. You'll need this for the `ascAppId` in your `eas.json`

## Step 4: Configure Apple Credentials

EAS can automatically manage your Apple credentials, or you can provide them manually. For the easiest experience:

```bash
eas credentials
```

This will guide you through setting up your Apple Developer credentials.

**Required Information:**
- Apple ID (your Apple Developer account email)
- Apple Team ID (found in [Apple Developer Portal](https://developer.apple.com/account) → Membership section)
- App Store Connect API Key (recommended) OR App-Specific Password

### Option A: Using App Store Connect API Key (Recommended)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to Users and Access → Keys
3. Create a new key with **App Manager** role
4. Download the `.p8` key file (you can only download it once!)
5. Note the Key ID and Issuer ID

Then update your `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

And set the API key:
```bash
eas credentials
```

### Option B: Using App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in and go to App-Specific Passwords
3. Generate a new password for "EAS Build"
4. Use this password when prompted by EAS

## Step 5: Build for Production

Build your iOS app with the production profile:

```bash
eas build --platform ios --profile production-ios
```

This will:
- Build your app in the cloud
- Generate an `.ipa` file
- Take approximately 15-30 minutes

You can check build status at: `https://expo.dev/accounts/[your-account]/builds`

## Step 6: Submit to TestFlight

Once the build completes successfully, submit it to App Store Connect:

```bash
eas submit --platform ios --profile production
```

Or if you want to submit a specific build:

```bash
eas submit --platform ios --latest
```

This will:
- Upload the `.ipa` to App Store Connect
- Process it for TestFlight (usually takes 5-15 minutes)
- Make it available in TestFlight once processing completes

## Step 7: Add TestFlight Testers

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **TestFlight** tab
3. Select your app
4. Once processing completes, add internal or external testers:
   - **Internal Testers**: Up to 100 team members (instant access)
   - **External Testers**: Requires Beta App Review (can take 24-48 hours)

## Complete Workflow (All-in-One)

You can also combine build and submit:

```bash
eas build --platform ios --profile production-ios --auto-submit
```

This will build and automatically submit when ready.

## Troubleshooting

### Build Fails with "Bundle identifier not available"

**This is the most common error!** It means you haven't created the App ID yet.

1. **Go back to Step 3** and create the App ID in Apple Developer Portal
2. Make sure the bundle identifier in `app.json` matches exactly what you registered
3. Wait a few minutes after creating the App ID (Apple needs to sync)
4. Try building again

### Build Fails (Other Issues)

- Check build logs: `https://expo.dev/accounts/[your-account]/builds`
- Ensure your `app.json` has correct bundle identifier
- Verify iOS certificates are valid
- Make sure you've created the App ID in Apple Developer Portal first

### Submit Fails

- Verify `ascAppId` is correct (found in App Store Connect → App Information)
- Check Apple Team ID matches your developer account
- Ensure you have App Manager or Admin role in App Store Connect

### TestFlight Processing Stuck

- Sometimes takes up to 30 minutes
- Check App Store Connect for processing status
- If stuck for hours, try uploading a new build

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure credentials
eas credentials

# Build for iOS production
eas build --platform ios --profile production-ios

# Submit to TestFlight
eas submit --platform ios --latest

# Build and submit in one command
eas build --platform ios --profile production-ios --auto-submit

# Check build status
eas build:list

# View build details
eas build:view [build-id]
```

## Notes

- First submission may require additional setup in App Store Connect
- Make sure your app version is incremented in `app.json` before each submission
- TestFlight builds expire after 90 days
- You can have up to 100 builds per app version

