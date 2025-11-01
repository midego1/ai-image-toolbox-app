// app.config.js - Expo configuration that supports environment variables
// 
// For LOCAL DEVELOPMENT:
//   - Create a .env file in this directory with REPLICATE_API_KEY, KIE_AI_API_KEY, and REVENUE_CAT_API_KEY
//   - The .env file is gitignored and will NOT be uploaded to EAS builds
//
// For PRODUCTION/TESTFLIGHT (EAS Builds):
//   - Use EAS Environment Variables: eas env:create production --name REPLICATE_API_KEY --value your-key --visibility secret --scope project
//   - Reference them in eas.json under the build profile's env section
//   - EAS injects these into process.env during builds, making them available in app.config.js
//   - The .env file is excluded from EAS builds via .easignore

// Load environment variables from .env file if present (local development only)
// In EAS builds, the .env file won't exist, so EAS environment variables will be used instead
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed, that's okay - we can still use system env vars (EAS will provide them)
}

module.exports = (() => {
  // EAS environment variables created with 'eas env:create' are automatically
  // available during builds. They should be accessible via process.env, but
  // we also check for them in case they're available in a different way.
  const replicateApiKey = process.env.REPLICATE_API_KEY || "";
  const kieAIApiKey = process.env.KIE_AI_API_KEY || "";
  const revenueCatApiKey = process.env.REVENUE_CAT_API_KEY || "";
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

  return {
    expo: {
      name: "Pixel Potion",
      slug: "aiphotoeditor",
      version: "0.1.9",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "automatic",
      assetBundlePatterns: [
        "**/*"
      ],
      ios: {
        supportsTablet: false,
        bundleIdentifier: "com.midego.aiphotoeditor",
        buildNumber: "17"
      },
      web: {
        favicon: "./assets/images/icon.png",
        bundler: "metro",
        output: "single"
      },
      plugins: [
        "expo-camera",
        "expo-image-picker",
        "expo-media-library",
        "expo-font"
      ],
      scheme: "com.midego.aiphotoeditor",
      extra: {
        // API keys: Read from environment variables or use empty strings
        // For local development: Create a .env file with all required keys
        // For production: Use EAS Environment Variables (eas env:create)
        // EAS automatically injects these during builds
        replicateApiKey: replicateApiKey,
        kieAIApiKey: kieAIApiKey,
        revenueCatApiKey: revenueCatApiKey,
        supabaseUrl: supabaseUrl,
        supabaseAnonKey: supabaseAnonKey,
        eas: {
          projectId: "9a839619-d86d-41cd-b86b-2eeb6a7f0edb"
        }
      }
    }
  };
})();
