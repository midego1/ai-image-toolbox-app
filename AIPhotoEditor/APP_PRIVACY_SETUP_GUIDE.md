# App Privacy Setup Guide for App Store Connect

This guide will help you complete the **App Privacy** section in App Store Connect, which is required before submitting your app for review.

## ⚠️ Important Note

**Only Account Holders or Admins** can complete the App Privacy section. If you don't have Admin access, you'll need to:
1. Request Admin role from the Account Holder
2. Or have the Account Holder complete this section

---

## Step-by-Step: App Privacy Declaration

### Location
1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **My Apps** → **Your App** → **App Privacy** (in the left sidebar)
3. Click **"Get Started"** or **"Edit Privacy Practice"**

---

## Data Types to Declare

Based on your app's functionality, you need to declare the following:

### ✅ Required Declarations:

#### 1. **Photos or Videos** (REQUIRED)
- **Type**: Photos or Videos
- **Purpose**: App Functionality
  - Description: "Processing user photos with AI features (background removal, face swap, etc.)"
- **Linked to User Identity**: ❌ No
- **Used for Tracking**: ❌ No
- **Collection Method**: User-provided content (photos selected from library or captured with camera)

**Why**: Your app processes photos for AI editing features, so this MUST be declared.

---

#### 2. **Product Interaction** (LOCAL ANALYTICS)
- **Type**: Product Interaction
- **Purpose**: Analytics
  - Description: "Local usage analytics (app opens, feature usage, edits completed)"
- **Linked to User Identity**: ❌ No
- **Used for Tracking**: ❌ No
- **Collection Method**: Automatically collected (local storage only)

**Why**: Your `AnalyticsService` tracks usage metrics locally. Even though it's stored locally and not sent to third parties, Apple requires declaration of any analytics data.

**Note**: Since your analytics are local-only (AsyncStorage), this is not "tracking" according to Apple's definition.

---

#### 3. **Diagnostic Data** (if you have crash reporting)
- **Type**: Crash Data, Performance Data
- **Purpose**: Analytics
- **Linked to User Identity**: ❌ No
- **Used for Tracking**: ❌ No

**Why**: If you use any crash reporting tools (e.g., Sentry, Firebase Crashlytics), you must declare this. If you don't use crash reporting yet, you can skip this.

---

## ❌ NOT Required to Declare:

Based on your codebase:

- **Device ID**: ✅ Not collecting (no third-party analytics like Firebase Analytics)
- **User ID/Account**: ✅ Not collecting (no user accounts)
- **Location**: ✅ Not collecting
- **Contact Info**: ✅ Not collecting
- **Purchase History**: ✅ Not collecting (subscriptions are local simulation currently)

---

## Third-Party Data Sharing

### Replicate API

Your app sends photos to Replicate API for AI processing. Here's what you need to declare:

#### Do You Share Data with Third Parties?
- **Answer**: ✅ **Yes**

#### What Data Do You Share?
1. Select **"Photos or Videos"**
   - **Purpose**: App Functionality
   - **Shared with**: Replicate (replicate.com)
   - **Used for Tracking**: ❌ No

#### Important Notes About Replicate:
- Photos are sent to Replicate's servers for processing
- Replicate's [Privacy Policy](https://replicate.com/privacy) should be reviewed
- You should mention in your Privacy Policy that photos are processed by Replicate
- Photos are NOT used for tracking or advertising by Replicate (verify their current policy)

---

## Privacy Policy URL

### Required: Privacy Policy

You **must** provide a Privacy Policy URL in App Store Connect. Your policy should cover:

1. **Data Collection**
   - Photos processed for AI features
   - Local usage analytics (stored on device only)

2. **Third-Party Services**
   - Replicate API usage (photo processing)
   - How photos are handled (sent for processing, not stored by Replicate, etc.)

3. **Data Usage**
   - Photos are only used for the AI editing features requested
   - Local analytics are device-only and not transmitted

4. **User Rights**
   - How users can delete their data
   - How to contact you about privacy concerns

5. **Contact Information**
   - Your contact email/address

### Where to Host Privacy Policy:

**Option 1: GitHub Pages** (Free)
```
1. Create a repository (e.g., "aiphotoeditor-privacy")
2. Create a `privacy-policy.html` or `privacy-policy.md` file
3. Enable GitHub Pages in repository settings
4. URL will be: https://yourusername.github.io/aiphotoeditor-privacy/privacy-policy
```

**Option 2: Your Website**
```
If you have a website, host it there:
https://yourdomain.com/privacy-policy
```

**Option 3: Simple HTML Page** (Any hosting)
```
Host a simple HTML page anywhere (Netlify, Vercel, etc.)
```

---

## Quick Checklist for App Store Connect

### In App Store Connect → App Privacy:

- [ ] Declare **Photos or Videos** (App Functionality)
- [ ] Declare **Product Interaction** (Analytics, local only)
- [ ] Declare **Diagnostic Data** (if using crash reporting)
- [ ] Declare **Third-Party Data Sharing** → **Replicate API** (Photos)
- [ ] Add **Privacy Policy URL**
- [ ] Click **"Save"** or **"Submit"**

### In App Store Connect → App Information:

- [ ] Verify **Copyright** field shows: `© 2025 Midego`
  - (This should already be set from `app.json`, but verify it's visible)

---

## Sample Privacy Policy Template

Here's a basic template you can use (customize with your details):

```markdown
# Privacy Policy for AI Photo Editor

**Last Updated:** [Date]

## Data We Collect

### Photos and Videos
- We process photos you select or capture to provide AI editing features
- Photos are sent to Replicate API for processing
- Photos are not stored by us or Replicate beyond the processing time

### Local Usage Analytics
- We track app usage metrics locally on your device (app opens, feature usage)
- This data is stored only on your device and never transmitted
- You can view or reset this data in Settings

## How We Use Your Data

- Photos are processed to provide the AI editing features you request
- Local analytics help us improve the app experience
- We do not sell, share, or use your data for advertising

## Third-Party Services

- **Replicate API**: Used for AI photo processing. Photos are sent to Replicate for processing only. See their privacy policy: https://replicate.com/privacy

## Data Security

- Photos are processed securely through encrypted connections
- No photos are stored on our servers
- Local analytics data can be cleared from Settings at any time

## Your Rights

- You can delete your photos at any time
- You can reset local analytics data in Settings
- You can opt out of analytics in Settings

## Contact Us

If you have questions about privacy, contact us at:
Email: [your-email@example.com]
```

---

## After Completing Privacy Declaration

1. **Save/Submit** the privacy information
2. **Verify** it's marked as "Complete" in App Store Connect
3. **Test** your app submission process - the privacy requirement should now be satisfied
4. **Review** - Apple may review your privacy declarations during app review

---

## Common Issues & Solutions

### ❌ "Privacy information must be provided by Admin"
- **Solution**: Only Account Holder or Admin roles can edit privacy. Request Admin access or have the Account Holder complete it.

### ❌ "Privacy Policy URL is required"
- **Solution**: You must provide a publicly accessible URL. It cannot be empty or invalid.

### ⚠️ "Data collection must match app functionality"
- **Solution**: Make sure your declarations match what your app actually does. Don't declare tracking if you don't do it, and do declare photo processing if you do it.

---

## Verification

After completing the privacy setup, verify:
- ✅ App Privacy section shows "Complete" in App Store Connect
- ✅ Privacy Policy URL is accessible and working
- ✅ All data types match your app's actual functionality
- ✅ Copyright information is visible in App Information

---

## Additional Resources

- [Apple's App Privacy Guidelines](https://developer.apple.com/app-store/app-privacy-details/)
- [Replicate Privacy Policy](https://replicate.com/privacy)
- [Apple's Data Types Reference](https://developer.apple.com/app-store/app-privacy-details/#data-types)

