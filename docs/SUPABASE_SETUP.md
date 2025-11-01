# Supabase Setup Guide

This guide will help you set up Supabase for backend authentication, database, and receipt validation.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: AI Photo Editor (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier

## 2. Get Project Credentials

After project creation:

1. Go to **Project Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** (SUPABASE_URL)
   - **anon/public key** (SUPABASE_ANON_KEY)

## 3. Set Up Database Schema

Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'premium')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('1month', '3months', '6months', '1year')),
  cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Purchases table (for tracking all IAP)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('subscription', 'credit_pack')),
  receipt_data TEXT,
  receipt_validated BOOLEAN DEFAULT false,
  credits_added INTEGER,
  amount TEXT,
  currency TEXT DEFAULT 'USD',
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit balances table
CREATE TABLE IF NOT EXISTS credit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_credits INTEGER DEFAULT 0,
  subscription_credits_used INTEGER DEFAULT 0,
  purchased_credits INTEGER DEFAULT 0,
  unused_subscription_credits INTEGER DEFAULT 0,
  last_renewal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_credit_balances_user_id ON credit_balances(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own credit balances"
  ON credit_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit balances"
  ON credit_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit balances"
  ON credit_balances FOR UPDATE
  USING (auth.uid() = user_id);
```

## 4. Configure Authentication Providers

### Email/Password (Default)
Already enabled by default. Users can sign up with email/password.

### Google Sign-In
See [GOOGLE_SIGNIN_SETUP.md](./GOOGLE_SIGNIN_SETUP.md)

### Apple Sign-In
See [APPLE_SIGNIN_SETUP.md](./APPLE_SIGNIN_SETUP.md)

## 5. Environment Variables

### Local Development (.env file)

Create `AIPhotoEditor/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Production (EAS Build)

Set environment variables in EAS:

```bash
eas env:create production --name SUPABASE_URL --value https://your-project.supabase.co --visibility secret --scope project
eas env:create production --name SUPABASE_ANON_KEY --value your-anon-key-here --visibility secret --scope project
```

## 6. Update app.config.js

The app.config.js should already read these from environment variables. Verify it includes:

```javascript
extra: {
  // ... other config
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
}
```

## 7. Test Connection

1. Install dependencies: `npm install @supabase/supabase-js`
2. Run the app: `npx expo start`
3. Try signing up/logging in to verify Supabase connection works

## Next Steps

- Set up Google Sign-In: [GOOGLE_SIGNIN_SETUP.md](./GOOGLE_SIGNIN_SETUP.md)
- Set up Apple Sign-In: [APPLE_SIGNIN_SETUP.md](./APPLE_SIGNIN_SETUP.md)
- Implement receipt validation Edge Function (for production IAP validation)
