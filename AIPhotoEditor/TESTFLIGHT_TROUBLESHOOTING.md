# TestFlight Troubleshooting Guide

If your app isn't showing up in TestFlight even after completing all requirements, follow these steps systematically.

## ✅ Critical: Rebuild Required After Info.plist Changes

**If you just added `ITSAppUsesNonExemptEncryption` to Info.plist, you MUST rebuild and resubmit:**

```bash
# Increment build number first
# Edit app.json: "buildNumber": "8" (was 7)

# Then rebuild
eas build --platform ios --profile production-ios

# Wait for build to complete, then submit
eas submit --platform ios --latest
```

**Why?** The Info.plist changes only take effect in NEW builds. Old builds won't have the encryption key.

---

## Step-by-Step Checklist

### 1. Verify Build Status in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **My Apps** → Your App → **TestFlight** tab
3. Check the build status:
   - **Processing** = Wait (can take 30-60 minutes)
   - **Ready to Submit** = Click it and look for warnings
   - **Missing Compliance** = Answer export compliance
   - **Ready for Testing** = Build is ready! (see step 2)

### 2. Check for Export Compliance Warnings

Even with Info.plist set, check App Store Connect:

1. In TestFlight tab, click on your build
2. Scroll down to **Export Compliance** section
3. Look for any **yellow warning icons** or alerts
4. If present:
   - Click **"Provide Export Compliance Information"**
   - Answer: **"No"** to "Does your app use encryption?"
   - Click **Save**

### 3. Verify App Privacy is Complete

**Required for TestFlight availability:**

1. Go to **App Privacy** tab (left sidebar)
2. Click **"Get Started"** or **"Edit Privacy Practice"**
3. Verify you've declared:
   - ✅ Photos or Videos (App Functionality)
   - ✅ Product Interaction (Analytics, if applicable)
4. **Complete all required sections** and click **Save**

**Note:** Only Account Holder or Admin can complete this.

### 4. Add Internal Testers

**Your build won't be "available" until you add testers:**

1. In **TestFlight** tab, go to **Internal Testing** section
2. Click **"+"** to add testers
3. Add yourself as an internal tester:
   - Enter your Apple ID email
   - Click **Add**
4. Once added, the build will show as available to that tester

**Important:** For Internal Testing, you DON'T need review. Just add testers and they'll get access immediately (after processing).

### 5. Check Email Notifications

1. Check your Apple Developer account email
2. Check spam folder for messages from Apple
3. Look for emails about:
   - Build processing complete
   - Export compliance issues
   - Missing information
   - App Review status

### 6. Verify Info.plist in Build

**Confirm the encryption key is in the actual build:**

1. Download the `.ipa` file (if you have it)
2. Or check build logs in EAS: `https://expo.dev/accounts/[your-account]/builds`
3. The Info.plist should contain: `<key>ITSAppUsesNonExemptEncryption</key><false/>`

### 7. Check Build Number and Version

**Ensure build number is incremented:**

1. Current build number: `7` (in app.json)
2. If you've submitted build `7` before, increment to `8`
3. Edit `app.json`: `"buildNumber": "8"`
4. Rebuild with new number

### 8. Verify Account Permissions

**Ensure you have correct role:**

1. Check your App Store Connect role:
   - **Admin** or **App Manager** = Can manage compliance
   - **Developer** = Limited permissions
2. If you don't have admin access, ask Account Holder to:
   - Complete App Privacy section
   - Answer export compliance questions

---

## Common Issues and Solutions

### Issue: "Build not appearing in TestFlight"

**Possible causes:**
- Build still processing (wait 30-60 minutes)
- Export compliance not answered
- App Privacy not completed
- Wrong build profile used (not production)

**Solution:**
1. Wait for processing to complete
2. Check for yellow warnings on the build
3. Complete App Privacy section
4. Rebuild with correct profile: `eas build --platform ios --profile production-ios`

### Issue: "Build shows 'Ready to Submit' but not available"

**This means:**
- Build processed successfully
- But export compliance needs attention

**Solution:**
1. Click on the build
2. Answer export compliance questions
3. Save
4. Wait a few minutes - status should update

### Issue: "No testers can see the build"

**Possible causes:**
- No testers added
- Testers not invited yet
- Build not processed

**Solution:**
1. Go to **Internal Testing** section
2. Add yourself and other testers
3. Ensure build status shows **"Ready for Testing"**

### Issue: "Export compliance keeps asking"

**If you've answered but it keeps appearing:**

1. **Rebuild** - Old builds won't have the Info.plist key
2. Ensure you're clicking **"Save"** after answering
3. Wait a few minutes for App Store Connect to update
4. Check if the build has a newer version available

---

## Quick Diagnostic Commands

```bash
# Check your build status
eas build:list

# View specific build details
eas build:view [build-id]

# Submit latest build to TestFlight
eas submit --platform ios --latest

# Build and submit in one command
eas build --platform ios --profile production-ios --auto-submit
```

---

## Final Checklist Before Asking for Help

- [ ] Info.plist contains `ITSAppUsesNonExemptEncryption = false`
- [ ] **Rebuilt** app after adding the key (new build number)
- [ ] **Submitted** new build to App Store Connect
- [ ] Build status shows **"Ready for Testing"** (not "Processing")
- [ ] **Answered export compliance** in App Store Connect (if prompted)
- [ ] **Completed App Privacy** section (Admin/Account Holder required)
- [ ] **Added internal testers** in TestFlight
- [ ] Waited at least 30 minutes after submission
- [ ] Checked email for Apple notifications
- [ ] Verified account has Admin/App Manager role

---

## Still Not Working?

If you've completed ALL steps above and it's still not working:

1. **Contact Apple Developer Support:**
   - [developer.apple.com/contact](https://developer.apple.com/contact)
   - Provide: Build number, Bundle ID, Screenshots of TestFlight page

2. **Check Apple System Status:**
   - [developer.apple.com/system-status](https://developer.apple.com/system-status)
   - Look for App Store Connect outages

3. **Try uploading a fresh build:**
   - Increment build number
   - Rebuild completely
   - Submit again

---

## Notes

- **Internal Testing** = No review needed, instant access (up to 100 testers)
- **External Testing** = Requires Beta App Review (24-48 hours)
- **First build** of an app may take longer to process
- **Export compliance** must be answered for EACH build initially
- **App Privacy** is a one-time setup per app

