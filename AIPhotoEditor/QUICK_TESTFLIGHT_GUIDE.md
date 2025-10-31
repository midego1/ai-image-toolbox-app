# Quick Guide: Build and Push to TestFlight

## ✅ Prerequisites Checklist

Before building, make sure:

- [x] EAS Secret is set: `REPLICATE_API_KEY` (you already have this)
- [ ] Apple credentials configured (one-time setup needed)
- [ ] App ID created in Apple Developer Portal
- [ ] App created in App Store Connect

## 🚀 Step-by-Step: Build and Submit

### Step 1: Navigate to Project Directory

Open Terminal and run:

```bash
cd /Users/midego/vision-camera/AIPhotoEditor
```

### Step 2: Set Up Apple Credentials (First Time Only)

If you haven't set up credentials yet:

```bash
eas credentials
```

When prompted:
- **Select platform**: `iOS`
- **Choose method**: Select `Automatic` (recommended) or `Manual`
- **If Automatic**: Enter your Apple ID or App Store Connect API Key

**Using App Store Connect API Key (More Secure):**
1. Go to [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Keys
2. Create a new key with **App Manager** role
3. Download the `.p8` file (only download once!)
4. Note the Key ID and Issuer ID
5. Provide these when prompted by `eas credentials`

### Step 3: Build for TestFlight

Run one of these commands:

**Option A: Preview Profile (Internal Distribution)**
```bash
eas build --platform ios --profile preview
```

**Option B: Production Profile (Recommended)**
```bash
eas build --platform ios --profile production-ios
```

**What happens:**
- Build starts in the cloud (15-30 minutes)
- You'll see a build URL: `https://expo.dev/accounts/[your-account]/builds`
- You'll receive an email when complete

### Step 4: Submit to TestFlight

Once the build completes, submit it:

**Submit Latest Build:**
```bash
eas submit --platform ios --latest
```

**Or Submit Specific Build:**
```bash
eas submit --platform ios --build-id [build-id]
```

**Or Build and Submit in One Command:**
```bash
eas build --platform ios --profile production-ios --auto-submit
```

### Step 5: Wait for Processing

- App Store Connect processes the build (5-15 minutes)
- Check status in [App Store Connect](https://appstoreconnect.apple.com) → TestFlight tab

### Step 6: Add Testers

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **TestFlight** tab
3. Once processing completes, add testers:
   - **Internal Testers**: Up to 100 team members (instant)
   - **External Testers**: Requires Beta App Review (24-48 hours)

## 🔧 Troubleshooting

### Error: "Run this command inside a project directory"

**Fix:**
```bash
cd /Users/midego/vision-camera/AIPhotoEditor
pwd  # Should show: /Users/midego/vision-camera/AIPhotoEditor
```

### Error: "Input is required, but stdin is not readable"

**Fix:** Run the command directly in your Terminal app (Terminal.app or iTerm), not through automated tools.

### Build Fails: "Credentials not configured"

**Fix:**
```bash
eas credentials
```
Complete the setup as described in Step 2.

### Build Fails: "Bundle identifier not available"

**Fix:** Create the App ID first:
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Certificates, Identifiers & Profiles → Identifiers
3. Create new App ID with bundle identifier: `com.midego.aiphotoeditor`

### Warning: "No environment variables found for preview environment"

**This is just a warning** - Your EAS Secret will still work. You can ignore it.

## 📋 Complete Command Reference

```bash
# Check project info
eas project:info

# List secrets (verify API key is set)
eas secret:list

# Set up credentials (first time)
eas credentials

# Build for TestFlight
eas build --platform ios --profile production-ios

# Submit to TestFlight
eas submit --platform ios --latest

# Build and submit together
eas build --platform ios --profile production-ios --auto-submit

# Check build status
eas build:list

# View specific build
eas build:view [build-id]
```

## ✅ Verify It Worked

After installing from TestFlight:

1. **Check API Key in Settings:**
   - Open app → Settings → DEVELOPER section
   - "Replicate API Key" should show "Configured"

2. **Test Transform AI Tool:**
   - Try the Transform AI feature
   - Should work without "API key not configured" error

## 🎯 Quick Start (If Everything is Already Set Up)

If you've already configured credentials before:

```bash
cd /Users/midego/vision-camera/AIPhotoEditor
eas build --platform ios --profile production-ios --auto-submit
```

That's it! The `--auto-submit` flag will build and automatically submit to TestFlight when ready.

## 📚 More Help

- **Full Deployment Guide**: [TESTFLIGHT_DEPLOYMENT_GUIDE.md](./TESTFLIGHT_DEPLOYMENT_GUIDE.md)
- **EAS Secrets Setup**: [EAS_SECRETS_SETUP.md](./EAS_SECRETS_SETUP.md)
- **Troubleshooting**: [TESTFLIGHT_TROUBLESHOOTING.md](./TESTFLIGHT_TROUBLESHOOTING.md)

