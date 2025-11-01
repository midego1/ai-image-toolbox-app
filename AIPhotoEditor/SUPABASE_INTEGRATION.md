# Supabase Integration Quick Reference

This is a quick reference for the Supabase integration in AI Photo Editor.

## Service Files

- **`src/services/supabaseService.ts`**: Supabase client initialization and configuration
- **`src/services/authService.ts`**: Authentication service (email, Google, Apple Sign-In)
- **`src/services/authHelpers.ts`**: Helper functions for OAuth flows
- **`src/services/subscriptionBackendService.ts`**: Backend subscription and credit management

## Features

### Authentication
- Email/password sign up and sign in
- Google Sign-In (iOS & Android)
- Apple Sign-In (iOS only)
- Session management with SecureStore

### Subscription & Credits Sync
- Automatic background sync of subscription data
- Purchase recording for IAP validation
- Credit balance synchronization
- Works offline with local-first approach

## Configuration

### Environment Variables

Local development (`.env` file):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Production (EAS):
```bash
eas env:create production --name SUPABASE_URL --value https://your-project.supabase.co --visibility secret --scope project
eas env:create production --name SUPABASE_ANON_KEY --value your-anon-key --visibility secret --scope project
```

### Deep Linking

The app uses the scheme `com.midego.aiphotoeditor` for OAuth redirects. This is configured in `app.config.js`.

## Usage Example

```typescript
import { AuthService } from './services/authService';
import { SubscriptionService } from './services/subscriptionService';

// Sign in with Google
const result = await AuthService.signInWithGoogle();

// Check authentication
const isAuthenticated = await AuthService.isAuthenticated();

// Subscription sync happens automatically
// Manual sync if needed:
await SubscriptionService.syncToServer();
```

## Setup Guides

- **Database Setup**: See [docs/SUPABASE_SETUP.md](../../docs/SUPABASE_SETUP.md)
- **Google Sign-In**: See [docs/GOOGLE_SIGNIN_SETUP.md](../../docs/GOOGLE_SIGNIN_SETUP.md)
- **Apple Sign-In**: See [docs/APPLE_SIGNIN_SETUP.md](../../docs/APPLE_SIGNIN_SETUP.md)

## Dependencies

- `@supabase/supabase-js`: Supabase client library
- `tslib`: TypeScript runtime library (required by Supabase)
- `expo-secure-store`: Secure storage for auth tokens

## Notes

- Supabase sync is optional - the app works offline with local storage
- Authentication is required for backend sync
- All sync operations are non-blocking and run in background
- If Supabase is not configured, the app falls back to local-only mode
