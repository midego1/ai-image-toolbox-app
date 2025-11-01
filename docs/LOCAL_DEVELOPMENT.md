# Running the App Locally

This guide explains how to set up and run the AI Photo Editor app locally for development.

## Prerequisites

1. **Node.js** (v18 or later recommended)
2. **npm** or **yarn**
3. **Expo CLI** (installed globally or via npx)
4. **iOS Simulator** (for iOS development on macOS)
   - Install Xcode from Mac App Store
   - Or use a physical iPhone with Expo Go app

## Quick Start

### 1. Navigate to Project Directory

```bash
cd AIPhotoEditor
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure API Keys (Required for AI Features)

Edit `app.json` and add your API keys:

```json
{
  "expo": {
    "extra": {
      "replicateApiKey": "your-replicate-api-key-here",
      "kieAIApiKey": "your-kie-ai-api-key-here"
    }
  }
}
```

> ⚠️ **Security**: Never commit real API keys to git. These are for local development only.

### 4. Start Development Server

```bash
npm start
# or
expo start
```

This will:
- Start the Metro bundler
- Show a QR code in terminal
- Open Expo DevTools in your browser

### 5. Run on Device/Simulator

#### Option A: iOS Simulator (macOS only)
```bash
npm run ios
# or press 'i' in the terminal after npm start
```

#### Option B: Physical iPhone
1. Install **Expo Go** app from App Store
2. Scan the QR code from terminal with Camera app
3. App will open in Expo Go

#### Option C: Web Browser
```bash
npm run web
# or press 'w' in the terminal after npm start
```

## Development Workflow

### Hot Reload
- Changes to code automatically reload the app
- Fast Refresh preserves component state
- For native code changes, you may need to restart

### Debugging
- **Console logs**: Check terminal where `npm start` is running
- **React Native Debugger**: Can be used for advanced debugging
- **Expo DevTools**: Access at http://localhost:19002 when server is running

### Common Commands

```bash
# Start dev server
npm start

# Run on iOS
npm run ios

# Run on web
npm run web

# Clear cache and restart
npm start -- --clear

# Type check (without running)
npx tsc --noEmit
```

## Testing Kie.ai API Locally

To test the Kie.ai integration locally:

1. **Add API Key to app.json**:
   ```json
   "extra": {
     "kieAIApiKey": "your-actual-kie-ai-api-key"
   }
   ```

2. **Restart the dev server** after adding the key:
   ```bash
   npm start -- --clear
   ```

3. **Test Nano Banana features**:
   - Transform (style/genre transformations)
   - Pop Figure
   - Pixel Art Gamer
   - Style Transfer
   - Professional Headshots
   - Replace Background
   - Virtual Try-On

4. **Check console logs**:
   - Look for `[KieAIService]` logs
   - Look for `[AIService] Using Kie.ai Nano Banana Edit` messages
   - Any errors will appear in the terminal

## Troubleshooting

### "API key not configured" Error

**For Kie.ai:**
- Make sure `kieAIApiKey` is set in `app.json` extra field
- Restart dev server after adding key
- Check console for key detection logs

**For Replicate:**
- Make sure `replicateApiKey` is set in `app.json` extra field
- Or enter via Settings → Developer → Replicate API Key (in app)

### Metro Bundler Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start -- --clear
```

### iOS Simulator Issues

```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Or use Expo CLI
expo start --ios --clear
```

### Port Already in Use

If port 19000 or 8081 is in use:
```bash
# Kill process on port 8081 (Metro)
lsof -ti:8081 | xargs kill -9

# Or use different port
npm start -- --port 19001
```

## File Structure

```
AIPhotoEditor/
├── src/
│   ├── components/     # UI components
│   ├── screens/        # Screen components
│   ├── services/       # API & business logic
│   ├── navigation/     # Navigation setup
│   ├── config/         # Configuration (API keys)
│   └── theme/         # Theming
├── app.json           # App configuration (API keys here)
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript config
```

## Important Notes

1. **API Keys**: Local development uses `app.json` for API keys. Production builds use EAS Environment Variables.

2. **Hot Reload**: Most changes reload instantly, but:
   - Native module changes require restart
   - `app.json` changes require restart
   - New dependencies require restart after `npm install`

3. **iOS Simulator**: Full native iOS experience
   - Camera works (simulated)
   - File system works
   - All native features available

4. **Expo Go**: Limited compared to development build:
   - Some native modules may not work
   - Camera may have limitations
   - Best for quick testing

## Next Steps

After local testing:
- Build for TestFlight: `eas build --platform ios --profile production-ios`
- See `KIE_AI_API_KEY_SETUP.md` for production API key setup

