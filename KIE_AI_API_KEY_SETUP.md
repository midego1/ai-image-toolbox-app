# Setting Up Kie.ai API Key for TestFlight

This guide explains how to configure the Kie.ai API key so it works in TestFlight builds (and all production builds).

## Overview

The app supports multiple methods for API key configuration:
1. **Development**: Set in `app.json` (for local testing)
2. **Production/TestFlight**: Set via EAS Secrets (for production builds)

## Method 1: EAS Secrets (Recommended for TestFlight)

EAS Secrets automatically inject environment variables into your builds. This is the **recommended method** for TestFlight and production builds.

### Step 1: Create the EAS Secret

Run this command in your terminal from the `AIPhotoEditor` directory:

```bash
eas secret:create --scope project --name KIE_AI_API_KEY --value your-kie-ai-api-key-here
```

Or if you prefer camelCase format:

```bash
eas secret:create --scope project --name kieAIApiKey --value your-kie-ai-api-key-here
```

> **Note**: Replace `your-kie-ai-api-key-here` with your actual Kie.ai API key from https://kie.ai

### Step 2: Verify the Secret

Check that the secret was created:

```bash
eas secret:list
```

You should see `KIE_AI_API_KEY` or `kieAIApiKey` in the list.

### Step 3: Build for TestFlight

Build your app as usual:

```bash
eas build --platform ios --profile production-ios
```

EAS will automatically inject the `KIE_AI_API_KEY` secret into your build's environment, and it will be accessible via `Constants.expoConfig?.extra`.

## Method 2: Environment Variables in eas.json

Alternatively, you can add environment variables directly in your `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "KIE_AI_API_KEY": "your-kie-ai-api-key-here"
      },
      "ios": {}
    }
  }
}
```

> ⚠️ **Warning**: This method stores the key in your codebase. It's better to use EAS Secrets (Method 1) for security.

## Method 3: Development Only (app.json)

For local development and testing, you can add the key directly to `app.json`:

```json
{
  "expo": {
    "extra": {
      "kieAIApiKey": "your-kie-ai-api-key-here"
    }
  }
}
```

> ⚠️ **Important**: 
> - Never commit real API keys to git
> - This method only works for local development builds
> - TestFlight builds need Method 1 (EAS Secrets)

## How It Works

The app checks for the API key in this order:

1. `Constants.expoConfig?.extra?.kieAIApiKey` (camelCase)
2. `Constants.expoConfig?.extra?.KIE_AI_API_KEY` (uppercase)
3. `process.env?.KIE_AI_API_KEY` (fallback)

EAS automatically maps secrets to `app.json` extra fields:
- Secret name `KIE_AI_API_KEY` → `extra.KIE_AI_API_KEY` or `extra.kieAIApiKey`
- Secret name `kieAIApiKey` → `extra.kieAIApiKey`

## Verifying the Setup

After building and installing from TestFlight, you can verify the API key is loaded:

1. Open the app
2. Go to Settings → Developer (if you have that screen)
3. Or check the console logs - it should show if the key is configured

## Troubleshooting

### Key not working in TestFlight

1. **Verify the secret exists**:
   ```bash
   eas secret:list
   ```

2. **Check secret name**: Make sure it's exactly `KIE_AI_API_KEY` or `kieAIApiKey` (case-sensitive)

3. **Rebuild**: After creating/updating secrets, rebuild your app:
   ```bash
   eas build --platform ios --profile production-ios --clear-cache
   ```

4. **Check logs**: Look for `[KieAIService]` logs in the app console to see error messages

### Key working in development but not in TestFlight

- Development uses `app.json` which may have the key hardcoded
- TestFlight uses EAS Secrets - make sure you created the secret
- The secret name must match exactly (case-sensitive)

## Security Best Practices

✅ **DO**:
- Use EAS Secrets for production builds
- Keep your API keys secret
- Rotate keys if they're exposed
- Use different keys for development vs production

❌ **DON'T**:
- Commit API keys to git
- Share API keys in public channels
- Hardcode keys in `app.json` for production
- Store keys in client-side code that could be extracted

## Related Files

- `src/config/apiKeys.ts` - API key retrieval logic
- `app.json` - Development configuration
- `eas.json` - EAS build configuration

