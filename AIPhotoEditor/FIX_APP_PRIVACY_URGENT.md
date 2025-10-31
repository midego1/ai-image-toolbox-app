# ⚠️ URGENT: Fix App Privacy Declaration

Your App Privacy is currently set to **"Data Not Collected"**, but your app processes photos and sends them to Replicate API. This mismatch is likely **blocking TestFlight availability**.

## The Problem

Your screenshot shows:
- ❌ "Data Not Collected" 
- ❌ Version 1.0 "Waiting for Review"

But your app:
- ✅ Processes user photos
- ✅ Sends photos to Replicate API for AI processing
- ✅ Collects local analytics

**This discrepancy can block TestFlight and cause App Store rejection.**

---

## ✅ Step-by-Step Fix

### Step 1: Go to App Privacy

1. In App Store Connect, navigate to your app
2. Click **App Store** → **App Privacy** (left sidebar)
3. Click **"Edit"** button next to "Data Types"

### Step 2: Add "Photos or Videos"

1. Click **"Add Data Type"** or **"+"** button
2. Search for and select **"Photos or Videos"**
3. Configure as follows:

   **Purpose:**
   - ✅ Check **"App Functionality"**
   - Description: `"Processing user photos with AI features (background removal, face swap, style transfer, etc.)"`

   **Linked to User Identity:**
   - ❌ **No** (uncheck)

   **Used for Tracking:**
   - ❌ **No** (uncheck)

   **Collection:**
   - Select **"User-provided content"**
   - Description: `"Photos selected from library or captured with camera for AI editing"`

4. Click **"Save"**

### Step 3: Add "Product Interaction" (Analytics)

1. Click **"Add Data Type"** again
2. Search for and select **"Product Interaction"**
3. Configure as follows:

   **Purpose:**
   - ✅ Check **"Analytics"**
   - Description: `"Local usage analytics (app opens, feature usage, edits completed)"`

   **Linked to User Identity:**
   - ❌ **No**

   **Used for Tracking:**
   - ❌ **No**

   **Collection:**
   - Select **"Automatically collected"**
   - Description: `"Local storage only, not transmitted to third parties"`

4. Click **"Save"**

### Step 4: Declare Third-Party Data Sharing

**This is critical - your app sends photos to Replicate!**

1. Scroll down to **"Third-Party Data Sharing"** section
2. Click **"Edit"** or **"+"** 
3. Answer: **"Does your app share data with third parties?"**
   - Select **"Yes"**

4. **What data do you share?**
   - Select **"Photos or Videos"**
   - **Purpose:** App Functionality
   - **Shared with:** Add new third party
     - **Name:** `Replicate`
     - **Domain:** `replicate.com`
   - **Used for Tracking:** ❌ No
   - **Reason for Sharing:** `"AI photo processing service"`

5. Click **"Save"**

### Step 5: Review and Save

1. Review the Product Page Preview (should show data collection now)
2. Ensure all sections are complete
3. Click **"Save"** at the top right

---

## Expected Result

After fixing, your App Privacy should show:

**Product Page Preview:**
- ✅ Shows "Data Used to Track You: None"
- ✅ Shows "Data Linked to You: None" 
- ✅ Shows "Data Not Linked to You: Photos or Videos, Product Interaction"
- ✅ Shows "Data Collected: Yes"
- ✅ Shows third-party sharing with Replicate

**Not:** "Data Not Collected"

---

## After Fixing

1. **Wait a few minutes** for App Store Connect to process
2. **Check TestFlight tab** - build should become available
3. If still blocked:
   - Increment build number
   - Rebuild and resubmit: `eas build --platform ios --profile production-ios --auto-submit`

---

## Why This Matters

- ✅ **TestFlight Availability:** Correct privacy declarations are required
- ✅ **App Store Review:** Incorrect declarations cause rejection
- ✅ **Legal Compliance:** Accurate privacy disclosure is required
- ✅ **User Trust:** Transparent about data usage

---

## Verification Checklist

After completing:
- [ ] "Photos or Videos" declared with App Functionality purpose
- [ ] "Product Interaction" declared with Analytics purpose
- [ ] Third-party sharing declared with Replicate
- [ ] Product Page Preview shows data collection (not "Data Not Collected")
- [ ] All sections saved successfully
- [ ] Check TestFlight tab - build should process

---

## Notes

- Only **Account Holder** or **Admin** can edit App Privacy
- Changes may take 5-10 minutes to reflect
- Builds already submitted may need to be resubmitted after fixing
- Privacy Policy URL at `https://www.midego.net/app` should mention Replicate API usage

