# Troubleshooting Guide

Common issues and solutions for AI Photo Editor development.

## Metro Bundler Issues

### `Unable to resolve "tslib"`

**Error**: `Unable to resolve "tslib" from "node_modules/@supabase/functions-js/dist/main/FunctionsClient.js"`

**Solution**:
1. Install tslib: `npm install tslib`
2. Clear Metro cache: `npx expo start --clear`
3. If still failing, check `metro.config.js` exists and has tslib resolver

**Root Cause**: Supabase packages depend on `tslib`, but Metro bundler sometimes can't find it, especially if it's nested in node_modules.

### Metro Config Load Error

**Error**: `Error: Found config at .../metro.config.js that could not be loaded`

**Solution**: 
- Check `metro.config.js` doesn't use `require.resolve()` at module level
- Use `path.resolve()` with `__dirname` instead
- Ensure all `require()` calls are inside functions, not at top level

## Type Errors

### `TypeError: expected dynamic type 'boolean', but had type 'string'`

**Error**: React Native bridge error when passing props to native modules

**Solution**:
- Wrap boolean props with `Boolean()` to ensure type correctness
- Example: `disabled={Boolean(someValue)}` instead of `disabled={someValue}`
- Check Supabase client initialization - ensure boolean options are actual booleans, not strings

**Files to Check**:
- `src/components/Card.tsx` - `disabled` prop handling
- `src/services/supabaseService.ts` - `autoRefreshToken`, `persistSession`, `detectSessionInUrl` options

## Supabase Issues

### "Supabase configuration missing" Error

**Solution**:
1. Check `.env` file exists with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. For EAS builds, ensure environment variables are set:
   ```bash
   eas env:list
   ```
3. Verify `app.config.js` reads from `process.env.SUPABASE_URL` and `process.env.SUPABASE_ANON_KEY`

### OAuth Redirect Not Working

**Symptoms**: Sign-in opens browser but doesn't redirect back to app

**Solution**:
1. Verify deep link scheme in `app.config.js`: `scheme: "com.midego.aiphotoeditor"`
2. Check iOS Info.plist has URL scheme configured (usually handled by Expo)
3. Test deep link manually: `xcrun simctl openurl booted "com.midego.aiphotoeditor://auth-callback"`
4. Verify redirect URL in Supabase dashboard matches app scheme

### Google Sign-In Not Working

**Checklist**:
1. OAuth client type is **Web application** (not iOS)
2. Authorized redirect URI in Google Cloud Console: `https://your-project.supabase.co/auth/v1/callback`
3. Supabase dashboard has Google OAuth configured with correct Client ID and Secret

### Apple Sign-In Not Working

**Checklist**:
1. App ID has "Sign In with Apple" capability enabled
2. Services ID configured with correct redirect URI
3. Supabase dashboard has Apple OAuth configured with:
   - Services ID
   - Team ID
   - Key ID
   - Private Key (JWT token, not raw .p8 file)
4. Secret key is not expired (Apple requires rotation every 6 months)

## React Native Screens Version Mismatch

### Local vs EAS Build Version Difference

**Error**: Type checking errors locally but builds fine on EAS

**Solution**: 
- EAS might be using different `react-native-screens` version
- Check `package.json` version matches EAS build
- Or update EAS build dependencies to match local:
  ```json
  {
    "build": {
      "production-ios": {
        "node": "20.x.x"
      }
    }
  }
  ```

## Dependencies

### Missing Dependencies After Restore

**Solution**:
```bash
cd AIPhotoEditor
npm install
```

**Required packages after Supabase integration**:
- `@supabase/supabase-js`
- `tslib`
- `expo-secure-store` (already included)

## Cache Issues

### Stale Data or Code Not Updating

**Solution**:
1. Clear Metro cache: `npx expo start --clear`
2. Clear npm cache: `npm cache clean --force`
3. Reinstall node_modules: `rm -rf node_modules && npm install`
4. Rebuild native: `npx expo prebuild --clean` (if native changes)

## Environment Variables

### Variables Not Loading in app.config.js

**Solution**:
- Ensure `.env` file is in `AIPhotoEditor/` directory (same as `app.config.js`)
- Restart Metro bundler after creating/updating `.env`
- For EAS, use `eas env:create` instead of `.env` file
- Check `.gitignore` includes `.env` (it should)

## Need More Help?

- Check Expo documentation: https://docs.expo.dev
- Supabase documentation: https://supabase.com/docs
- React Native troubleshooting: https://reactnative.dev/docs/troubleshooting
