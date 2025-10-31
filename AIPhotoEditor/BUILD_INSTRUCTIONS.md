# Building for TestFlight - Step by Step

## Current Issue

The build command requires interactive prompts that don't work in non-interactive shells. Run these commands directly in your terminal.

## Step 1: Verify You're in the Right Directory

```bash
cd /Users/midego/vision-camera/AIPhotoEditor
```

## Step 2: Check EAS Project Connection

```bash
eas project:info
```

Should show:
```
fullName  @midego/aiphotoeditor
ID        9a839619-d86d-41cd-b86b-2eeb6a7f0edb
```

## Step 3: Verify Your Secret is Set

```bash
eas secret:list
```

You should see `REPLICATE_API_KEY` in the list.

## Step 4: Set Up Apple Credentials (One-Time Setup)

If you haven't set up credentials yet, run:

```bash
eas credentials
```

This will prompt you to:
1. Select platform: **iOS**
2. Set up Apple credentials (choose automatic or manual)
3. If automatic: Provide Apple ID credentials or App Store Connect API key

**For automatic (recommended):**
- It will ask for your Apple ID email and password
- Or use App Store Connect API Key (more secure)

**For manual:**
- You'll need to provide certificates and provisioning profiles manually

## Step 5: Build for TestFlight

You have two options:

### Option A: Build with Preview Profile (Internal Distribution)

```bash
eas build --platform ios --profile preview
```

This uses the `preview` profile from `eas.json`, which is set to `"distribution": "internal"` - perfect for TestFlight.

### Option B: Build with Production Profile (Recommended for App Store)

```bash
eas build --platform ios --profile production-ios
```

This uses the `production-ios` profile which extends `production` and is configured for Release builds.

## Step 6: Wait for Build to Complete

- The build will take approximately 15-30 minutes
- You'll see a URL to track progress: `https://expo.dev/accounts/[your-account]/builds`
- You'll receive an email when the build completes

## Step 7: Submit to TestFlight

Once the build completes, submit it to App Store Connect:

```bash
eas submit --platform ios --latest
```

Or submit a specific build:

```bash
eas submit --platform ios --build-id [build-id-from-output]
```

## Troubleshooting

### Error: "Run this command inside a project directory"

- Make sure you're in `/Users/midego/vision-camera/AIPhotoEditor`
- Verify `app.json`, `package.json`, and `eas.json` exist in the directory

### Error: "Input is required, but stdin is not readable"

- This happens when running in non-interactive environments
- **Solution**: Run the commands directly in your terminal (Terminal.app or iTerm)
- Don't use the command through automated tools that don't support interactive prompts

### Error: "No environment variables found for preview environment"

- This is just a warning, not an error
- Your EAS Secret (`REPLICATE_API_KEY`) will still work for all environments
- You can ignore this warning

### Build Fails with Credential Errors

If credentials aren't set up properly:

1. Run `eas credentials` and complete the setup
2. Or use App Store Connect API Key (recommended):
   - Go to [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Keys
   - Create a key with **App Manager** role
   - Download the `.p8` file (only once!)
   - Note the Key ID and Issuer ID
   - Provide these when prompted by `eas credentials`

## Quick Build and Submit (One Command)

You can also build and automatically submit:

```bash
eas build --platform ios --profile production-ios --auto-submit
```

This will build and submit to TestFlight automatically when ready.

## Verify API Key in Build

After building and testing in TestFlight:

1. Open the app
2. Go to **Settings** → **DEVELOPER** section
3. Check **"Replicate API Key"** - should show "Configured"
4. Try the **Transform AI tool** - it should work without errors

## Next Steps After Successful Build

1. Wait for processing in App Store Connect (5-15 minutes)
2. Add testers in TestFlight tab
3. Test the Transform AI feature
4. Verify the API key is working

