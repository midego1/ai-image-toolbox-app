# RevenueCat Integration Guide

## ✅ What's Been Implemented

### 1. **Packages Installed**
- `react-native-purchases` - RevenueCat SDK for React Native
- `react-native-purchases-ui` - UI components for paywalls

### 2. **Services Created/Updated**

#### `revenueCatService.ts` (New)
- Handles RevenueCat SDK initialization
- Manages subscriptions and entitlements
- Provides methods to:
  - Initialize RevenueCat SDK
  - Get subscription tier from entitlements
  - Get customer info
  - Purchase packages
  - Restore purchases
  - Check active entitlements

#### `subscriptionService.ts` (Updated)
- Now integrates with RevenueCat as primary source of truth
- Falls back to local storage if RevenueCat not available
- Maintains backward compatibility with existing code
- Key methods updated:
  - `init()` - Initializes RevenueCat first
  - `getSubscriptionTier()` - Uses RevenueCat, falls back to local
  - `getSubscriptionInfo()` - Combines RevenueCat + local data

#### `apiKeys.ts` (Updated)
- Added `getRevenueCatApiKey()` function
- Supports EAS Environment Variables and local config

### 3. **App Initialization**
- `App.tsx` already calls `SubscriptionService.init()` which now initializes RevenueCat

## 🔧 Configuration Required

### 1. **Set RevenueCat API Key**

#### For Local Development:
Add to `.env` file in `AIPhotoEditor/`:
```
REVENUE_CAT_API_KEY=your-api-key-here
```

Or add to `app.config.js`:
```javascript
extra: {
  revenueCatApiKey: 'your-api-key-here',
}
```

#### For Production (EAS):
```bash
eas env:create production --name REVENUE_CAT_API_KEY --value your-api-key --visibility secret --scope project
```

### 2. **Set Up RevenueCat Dashboard**

#### Create Entitlements:
1. Go to RevenueCat Dashboard → Entitlements
2. Create three entitlements:
   - `basic` - For Basic tier subscriptions
   - `pro` - For Pro tier subscriptions  
   - `premium` - For Premium tier subscriptions

#### Add Products:
Use these product IDs (must match App Store Connect / Google Play):

**Subscriptions:**
- `com.midego.aiphotoeditor.basic.weekly`
- `com.midego.aiphotoeditor.basic.1month`
- `com.midego.aiphotoeditor.basic.3months`
- `com.midego.aiphotoeditor.pro.weekly`
- `com.midego.aiphotoeditor.pro.1month`
- `com.midego.aiphotoeditor.pro.3months`
- `com.midego.aiphotoeditor.premium.weekly`
- `com.midego.aiphotoeditor.premium.1month`
- `com.midego.aiphotoeditor.premium.3months`

**Credit Packs (Consumables):**
- `com.midego.aiphotoeditor.credits.10`
- `com.midego.aiphotoeditor.credits.25`
- `com.midego.aiphotoeditor.credits.50`
- `com.midego.aiphotoeditor.credits.100`

#### Link Products to Entitlements:
- All `basic.*` products → `basic` entitlement
- All `pro.*` products → `pro` entitlement
- All `premium.*` products → `premium` entitlement

#### Create Offerings:
Create an offering that includes all your products, organized into packages (optional, but recommended for paywalls).

### 3. **Set Up Virtual Currency (Credits)**

1. Go to RevenueCat Dashboard → Product Catalog → Virtual Currencies
2. Create a virtual currency called "Credits"
3. Configure credit grants:
   - Link subscriptions to grant credits on purchase/renewal:
     - Basic subscription → 10 credits/month
     - Pro subscription → 50 credits/month
     - Premium subscription → 150 credits/month
   - Link credit pack products to grant credits on purchase:
     - `credits.10` → 10 credits
     - `credits.25` → 25 credits
     - `credits.50` → 50 credits
     - `credits.100` → 100 credits

### 4. **Create Paywalls (Optional)**

1. Go to RevenueCat Dashboard → Paywalls
2. Create paywalls using the Paywall Builder
3. Design subscription and credit pack paywalls
4. Set up offerings to display in paywalls

## 📝 Next Steps

### 1. **✅ Update SubscriptionScreen (COMPLETED)**
The `SubscriptionScreen.tsx` has been updated to integrate with RevenueCat:

**✅ Implemented: Custom UI + RevenueCat Backend**
- ✅ Loads RevenueCat offerings on screen mount
- ✅ Uses `revenueCatService.purchasePackage()` for purchases in TestFlight/Production
- ✅ Falls back to local storage in Expo Go (for development)
- ✅ Verifies purchases by checking entitlements
- ✅ Refreshes subscription data after successful purchase

**Key Changes:**
- Added RevenueCat offerings state to SubscriptionScreen
- Updated `loadSubscriptionData()` to fetch offerings
- Rewrote `handleSubscribe()` to use RevenueCat when available
- Maintains backward compatibility with Expo Go

### 2. **Update Credit Balance Logic**
Currently credits are stored locally. To use RevenueCat's virtual currency:
- Implement credit balance fetching from RevenueCat API
- Or use RevenueCat webhooks to sync credits to your backend
- Update `getCreditBalance()` in `revenueCatService.ts`

### 3. **Handle User Login/Logout**
When users log in or out, update RevenueCat:
```typescript
import { revenueCatService } from './services/revenueCatService';

// On login:
await revenueCatService.setUserId(userId);

// On logout:
await revenueCatService.logOut();
```

### 4. **Test the Integration**
1. Test in RevenueCat sandbox environment
2. Test subscription purchases
3. Test credit pack purchases
4. Verify credit grants work correctly
5. Test subscription renewals

## 🔍 Code Examples

### Get Current Offering:
```typescript
import { revenueCatService } from './services/revenueCatService';

const offering = await revenueCatService.getOfferings();
if (offering) {
  const packages = offering.availablePackages;
  // Display packages in UI
}
```

### Purchase a Package:
```typescript
import { revenueCatService } from './services/revenueCatService';

try {
  const offering = await revenueCatService.getOfferings();
  const packageToPurchase = offering?.availablePackages[0]; // Select package
  
  if (packageToPurchase) {
    const customerInfo = await revenueCatService.purchasePackage(packageToPurchase);
    console.log('Purchase successful!', customerInfo);
  }
} catch (error) {
  console.error('Purchase failed:', error);
}
```

### Get Subscription Status:
```typescript
import { revenueCatService } from './services/revenueCatService';

const tier = await revenueCatService.getSubscriptionTier();
const subscriptionInfo = await revenueCatService.getSubscriptionInfo();
```

### Check Entitlement:
```typescript
const hasPro = await revenueCatService.hasActiveEntitlement('pro');
```

## 📚 Resources

- [RevenueCat React Native Docs](https://docs.revenuecat.com/docs/react-native)
- [RevenueCat Paywalls Guide](https://docs.revenuecat.com/docs/paywalls)
- [RevenueCat Virtual Currency](https://docs.revenuecat.com/docs/offerings/virtual-currency)

## ⚠️ Important Notes

1. **Backward Compatibility**: The code maintains backward compatibility with local storage. If RevenueCat is not configured, it will fall back to the previous behavior.

2. **Virtual Currency Balance**: The `getCreditBalance()` method in `revenueCatService.ts` is a placeholder. You'll need to implement actual balance fetching based on how you configure virtual currency in RevenueCat.

3. **Product IDs**: Make sure product IDs in RevenueCat dashboard exactly match those in App Store Connect and Google Play Console.

4. **Testing**: Always test in sandbox mode before going live. RevenueCat provides testing tools in their dashboard.

5. **Webhooks**: Consider setting up RevenueCat webhooks to sync subscription and credit events to your backend for better reliability.


