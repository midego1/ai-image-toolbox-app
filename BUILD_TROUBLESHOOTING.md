# Build Troubleshooting Guide

## Current Status ✅

Your `eas.json` is correctly configured - it does NOT have empty environment variables, which was the original issue.

## Verification Steps

### 1. Check eas.json is correct

```bash
cd AIPhotoEditor
cat eas.json
```

**Expected**: No `"env"` section with empty values in the `production` profile.

**Current state** (should look like this):
```json
{
  "build": {
    "production": {
      "ios": {}
    },
    "production-ios": {
      "extends": "production",
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

### 2. Verify EAS Environment Variables are Set

```bash
cd AIPhotoEditor
npx eas-cli env:list production
```

**Expected Output**: You should see:
- `KIE_AI_API_KEY` ✓
- `REPLICATE_API_KEY` ✓
- `SUPABASE_URL` (if using Supabase)
- `SUPABASE_ANON_KEY` (if using Supabase)

### 3. Validate App Configuration

```bash
cd AIPhotoEditor
npx expo config --type public
```

**Expected**: Should complete without errors and show your app configuration.

---

## Common Build Errors & Solutions

### Error: "is not allowed to be empty"

**Cause**: Empty environment variables in `eas.json`

**Solution**: ✅ **Already fixed** - Your current `eas.json` does NOT have empty env variables.

**If you still see this error**:
1. Double-check `eas.json` doesn't have:
   ```json
   "env": {
     "KIE_AI_API_KEY": "",
     "REPLICATE_API_KEY": ""
   }
   ```
2. Make sure you're on the latest commit: `git log -1` should show `8af687b`
3. If the file looks correct, try: `git checkout -- AIPhotoEditor/eas.json`

---

### Error: "Environment variable not found"

**Cause**: EAS environment variables not set

**Solution**:
```bash
cd AIPhotoEditor

# Set missing variables
npx eas-cli env:create production --name REPLICATE_API_KEY --value your-key --visibility secret --scope project
npx eas-cli env:create production --name KIE_AI_API_KEY --value your-key --visibility secret --scope project

# Verify they're set
npx eas-cli env:list production
```

---

### Error: "Build failed" or other EAS Build errors

**Cause**: Various possible issues

**Solution**:
1. **Clear EAS cache**:
   ```bash
   cd AIPhotoEditor
   npx eas-cli build --platform ios --profile production-ios --clear-cache
   ```

2. **Check build logs**:
   - Go to https://expo.dev
   - Navigate to your project
   - Check the build logs for specific error messages

3. **Validate configuration**:
   ```bash
   cd AIPhotoEditor
   npx expo config
   ```

---

### Error: "Cannot find module" or dependency errors

**Cause**: Missing or incorrect dependencies

**Solution**:
```bash
cd AIPhotoEditor

# Clean install
rm -rf node_modules package-lock.json
npm install

# For iOS, also update pods
cd ios
pod deintegrate
pod install
cd ..
```

---

### Error: TypeScript or linting errors

**Cause**: Code issues

**Solution**:
```bash
cd AIPhotoEditor

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors (if configured)
npm run lint
```

---

## Step-by-Step Build Process

### 1. Ensure you're on the working commit

```bash
cd /Users/midego/vision-camera
git status
# Should show: "nothing to commit, working tree clean"

git log -1
# Should show: "8af687b Fix eas.json: Remove empty env variables that caused build errors"
```

### 2. Verify eas.json

```bash
cd AIPhotoEditor
cat eas.json | grep -A 5 "production"
# Should NOT show any "env" section with empty values
```

### 3. Check EAS environment variables

```bash
npx eas-cli env:list production
# Should list all required API keys
```

### 4. Try building

```bash
npx eas-cli build --platform ios --profile production-ios
```

---

## What to Do If Build Still Fails

1. **Copy the exact error message** from the build output
2. **Check which step fails**:
   - Prebuild (generating native code)
   - Build (compiling)
   - Submit (uploading to App Store)
3. **Check EAS build logs**:
   - Visit https://expo.dev
   - Navigate to your project → Builds
   - Click on the failed build to see detailed logs

---

## Quick Diagnostic Commands

Run these to diagnose issues:

```bash
cd AIPhotoEditor

# 1. Check git status
git status

# 2. Check eas.json
cat eas.json

# 3. Check EAS env vars
npx eas-cli env:list production

# 4. Validate app config
npx expo config --type public

# 5. Check package.json
cat package.json | grep -A 2 '"name"'

# 6. Verify dependencies
npm list --depth=0
```

---

## Still Having Issues?

Please provide:
1. **Exact error message** (copy/paste from terminal or EAS dashboard)
2. **Command you ran**: `eas build --platform ios --profile production-ios`
3. **Step where it fails**: Prebuild, Build, or Submit
4. **Build log URL** (from expo.dev dashboard)

---

**Last Updated**: After reverting to commit `8af687b`  
**Status**: Configuration verified correct ✅


