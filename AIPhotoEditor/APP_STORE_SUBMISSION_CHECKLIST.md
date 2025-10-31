# App Store Submission Checklist

## ✅ Required Items for Review

### 1. Screenshots

**13-inch iPad Displays (12.9" iPad Pro)**
- Required sizes:
  - Portrait: 2048 x 2732 pixels
  - Landscape: 2732 x 2048 pixels
- How to capture:
  ```bash
  # Using iOS Simulator
  # 1. Open iOS Simulator
  # 2. Hardware > Device > iPad Pro (12.9-inch)
  # 3. Cmd + S to capture screenshot
  # Or use the simulator's capture feature
  ```

**6.5-inch iPhone Displays (iPhone 14 Pro Max / iPhone XS Max)**
- Required size: 1242 x 2688 pixels
- How to capture:
  ```bash
  # Using iOS Simulator
  # 1. Hardware > Device > iPhone 14 Pro Max
  # 2. Cmd + S to capture screenshot
  ```

**Upload Location:**
- App Store Connect → Your App → App Information → Screenshots section
- Upload each required size for the appropriate device category

---

### 2. Copyright Information

**✅ DONE:** Copyright is now set in:
- `app.json` (`ios.copyright: "© 2025 Midego"`)
- `Info.plist` (`NSHumanReadableCopyright` key)

**In App Store Connect:**
1. Go to App Store Connect → Your App → App Information
2. Scroll to "Copyright" field
3. Verify it shows: `© 2025 Midego` (should auto-populate from build, but verify)

---

### 3. App Privacy Information (Admin Required)

**📖 Detailed Guide:** See `APP_PRIVACY_SETUP_GUIDE.md` for complete step-by-step instructions.

**Who can do this:**
- Account Holder role
- Admin role

**Location:**
- App Store Connect → Your App → App Privacy
- Click "Get Started" or "Edit Privacy Practice"

**Quick Summary - Data Types to Declare:**

#### Data Types Collected:

1. **Photos or Videos** ✅
   - Type: Photos or Videos
   - Purpose: App Functionality (processing images with AI)
   - Linked to User Identity: No
   - Used for Tracking: No
   - Collection: User-provided content

2. **Device ID** (if using analytics)
   - Type: Device ID
   - Purpose: Analytics
   - Linked to User Identity: No
   - Used for Tracking: Possibly (if using third-party analytics)

3. **Product Interaction** (local analytics)
   - Type: Product Interaction
   - Purpose: Analytics
   - Linked to User Identity: No
   - Used for Tracking: No

4. **Other Diagnostic Data** (if using crash reporting)
   - Type: Crash Data, Performance Data
   - Purpose: Analytics
   - Linked to User Identity: No
   - Used for Tracking: No

#### Third-Party Data Sharing:
- If you use Replicate API, check their privacy policy
- If you share any data with third parties, declare it

#### Privacy Policy URL:
- You'll need a privacy policy URL (can be hosted on your website or GitHub Pages)
- Format: `https://yourdomain.com/privacy-policy` or `https://yourusername.github.io/privacy-policy`

---

## Quick Actions Checklist

- [ ] Capture 13-inch iPad screenshot (2048x2732 or 2732x2048)
- [ ] Capture 6.5-inch iPhone screenshot (1242x2688)
- [ ] Upload screenshots in App Store Connect
- [ ] Add copyright info in App Store Connect (© 2025 Midego)
- [ ] Admin logs in to App Store Connect
- [ ] Admin completes App Privacy section
- [ ] Create/host privacy policy page
- [ ] Add privacy policy URL to App Store Connect

---

## Additional Tips

### Screenshot Best Practices:
1. Show key features of your app
2. Use actual app screens, not mockups
3. Ensure text is readable at the display size
4. Show different screens/sections of your app
5. Match the required aspect ratios exactly

### Privacy Policy Template Areas to Cover:
- What data you collect
- How you use it
- Third-party services (Replicate API, etc.)
- User rights
- Contact information

### After Submission:
- Review can take 24-48 hours typically
- You'll receive email notifications about status
- Make sure TestFlight testing is complete first

