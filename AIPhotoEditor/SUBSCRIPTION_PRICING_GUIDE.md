# Subscription Pricing & Regional Pricing Guide

## Overview

This guide explains how to handle pricing and regional pricing for in-app subscriptions in your React Native app.

## Current Implementation

Your app currently uses hardcoded prices in `SubscriptionScreen.tsx`:
- 1 month: $9.99/month
- 6 months: $7.49/month (Save 25%)
- 1 year: $59.95/year (Save 50%)

**Note**: These are placeholder prices for UI/UX testing. In production, you'll need to integrate with native store APIs.

## How Regional Pricing Works

### iOS (App Store Connect)

1. **Set Base Prices**: You set prices in USD (or your base currency) in App Store Connect
2. **Automatic Conversion**: Apple automatically converts prices to local currencies for each region
3. **Price Tiers**: Apple uses price tiers (Tier 1, Tier 2, etc.) or you can set custom prices
4. **StoreKit Integration**: Your app fetches actual prices from StoreKit at runtime

**Example:**
- You set: $9.99/month (USD)
- User in EU sees: €8.99/month (Apple's conversion)
- User in Japan sees: ¥1,200/month (Apple's conversion)

### Android (Google Play Console)

1. **Set Base Prices**: Similar to iOS, you set prices in USD
2. **Automatic Conversion**: Google Play automatically converts to local currencies
3. **Price Groups**: Google uses price groups that map to different regions
4. **Google Play Billing**: Your app fetches actual prices from Google Play Billing API

## Implementation Steps

### 1. Set Up Products in Store Consoles

**iOS (App Store Connect):**
1. Go to your app → Features → In-App Purchases
2. Create subscription products:
   - `com.yourapp.pro.1month`
   - `com.yourapp.pro.6months`
   - `com.yourapp.pro.1year`
3. Set prices in your base currency (USD)
4. Configure subscription groups and pricing

**Android (Google Play Console):**
1. Go to your app → Monetization → Products → Subscriptions
2. Create subscription products with same IDs
3. Set base prices (USD)
4. Google will auto-convert for regions

### 2. Install Native Libraries

```bash
# For React Native in-app purchases
npm install react-native-purchases
# or
npm install react-native-iap
```

**Recommended**: Use RevenueCat (`react-native-purchases`) as it:
- Handles both iOS and Android
- Provides webhook servers
- Offers subscription management dashboard
- Handles regional pricing automatically

### 3. Fetch Real Prices

Instead of hardcoded prices, fetch from stores:

```typescript
// Example with react-native-purchases (RevenueCat)
import Purchases from 'react-native-purchases';

const fetchSubscriptionPrices = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings.current?.availablePackages || [];
    
    // packages will contain real prices in user's local currency
    packages.forEach(pkg => {
      const price = pkg.product.priceString; // e.g., "$9.99" or "€8.99"
      const currency = pkg.product.currencyCode; // e.g., "USD", "EUR"
      // Update UI with real prices
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
  }
};
```

### 4. Update Your Code

**Current approach (hardcoded):**
```typescript
const getPlanInfo = (plan: SubscriptionPlan) => {
  return {
    price: '$9.99', // ❌ Hardcoded
    period: 'per month',
  };
};
```

**Recommended approach (dynamic):**
```typescript
const [planPrices, setPlanPrices] = useState({
  '1month': { price: '$9.99', currency: 'USD' },
  '6months': { price: '$7.49', currency: 'USD' },
  '1year': { price: '$59.95', currency: 'USD' },
});

useEffect(() => {
  fetchSubscriptionPrices(); // Fetch real prices from store
}, []);
```

## Best Practices

### 1. Fallback to Default Prices
Always have fallback prices in case store APIs fail:

```typescript
const DEFAULT_PRICES = {
  '1month': '$9.99',
  '6months': '$7.49',
  '1year': '$59.95',
};

const getPrice = (plan, fetchedPrices) => 
  fetchedPrices?.[plan]?.price || DEFAULT_PRICES[plan];
```

### 2. Show Local Currency
Always display prices in the user's local currency (stores handle this):

```typescript
// ✅ Good - Shows "€8.99" for EU users
const price = product.priceString;

// ❌ Bad - Always shows "$9.99"
const price = '$9.99';
```

### 3. Format Prices Properly
Use the price string from the store (it's already formatted):

```typescript
// ✅ Good - Already formatted by store
product.priceString // "$9.99" or "€8.99"

// ❌ Bad - Manual formatting
`$${price}` // Doesn't handle other currencies
```

### 4. Handle Loading States
Prices take time to fetch, show loading state:

```typescript
const [prices, setPrices] = useState(null);
const [loadingPrices, setLoadingPrices] = useState(true);

useEffect(() => {
  fetchPrices().then(prices => {
    setPrices(prices);
    setLoadingPrices(false);
  });
}, []);

// Show loading or default prices while fetching
if (loadingPrices) {
  return <Text>{DEFAULT_PRICES[plan]}</Text>;
}
```

## Migration Checklist

- [ ] Set up products in App Store Connect
- [ ] Set up products in Google Play Console
- [ ] Install `react-native-purchases` or `react-native-iap`
- [ ] Replace hardcoded prices with store-fetched prices
- [ ] Add loading states for price fetching
- [ ] Add fallback prices for offline scenarios
- [ ] Test in different regions (use VPN or TestFlight/Internal Testing)
- [ ] Verify currency formatting displays correctly
- [ ] Update `subscriptionService.ts` to use real purchase flows

## Testing Regional Pricing

### iOS Testing
1. Create test accounts in different regions
2. Use TestFlight to test with real products
3. Use Sandbox accounts (App Store Connect → Users and Access → Sandbox Testers)

### Android Testing
1. Create test accounts in different regions
2. Use Google Play Console → Internal Testing
3. Add testers with accounts in different countries

## Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [App Store Connect Subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [react-native-purchases](https://github.com/RevenueCat/react-native-purchases)
- [react-native-iap](https://github.com/dooboolab/react-native-iap)

## Current Status

⚠️ **Your app currently uses mock/hardcoded prices. For production:**

1. Replace hardcoded prices with store API calls
2. Implement proper subscription purchase flows
3. Handle subscription status validation with store receipts
4. Set up webhook handling for subscription events (RevenueCat simplifies this)

---

**Note**: The prices shown in your UI ($9.99, $7.49, $59.95) are for UI/UX purposes only. Actual prices should come from your store product configurations and be fetched at runtime.

