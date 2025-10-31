import Constants from 'expo-constants';

/**
 * Get Replicate API key from app configuration
 * This supports:
 * - Development: app.json extra.replicateApiKey
 * - Production: EAS Secrets or EAS Environment Variables
 * 
 * EAS automatically maps:
 * - Legacy Secrets: REPLICATE_API_KEY -> replicateApiKey in app.json extra field
 * - Environment Variables: REPLICATE_API_KEY -> extra.REPLICATE_API_KEY (uppercase) or extra.replicateApiKey (camelCase)
 */
export function getReplicateApiKey(): string {
  // Try camelCase first (legacy EAS Secrets and app.json)
  let apiKey = Constants.expoConfig?.extra?.replicateApiKey;
  
  // If not found, try uppercase (EAS Environment Variables might use this)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    apiKey = Constants.expoConfig?.extra?.REPLICATE_API_KEY;
  }
  
  // Also check process.env as fallback (some EAS setups)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    // @ts-ignore - process.env might have the key in some contexts
    const envKey = typeof process !== 'undefined' && process.env?.REPLICATE_API_KEY;
    if (envKey && typeof envKey === 'string') {
      apiKey = envKey;
    }
  }
  
  if (apiKey && typeof apiKey === 'string' && apiKey.length > 0) {
    // Validate that it's a real key (not empty placeholder)
    if (apiKey !== 'YOUR_REPLICATE_API_KEY' && apiKey.trim().length > 0) {
      // Replicate API keys typically start with "r8_"
      if (apiKey.startsWith('r8_') || apiKey.length >= 10) {
        return apiKey.trim();
      }
    }
  }

  // No key configured or invalid
  return '';
}

/**
 * Check if Replicate API key is configured
 */
export function isApiKeyConfigured(): boolean {
  const key = getReplicateApiKey();
  return key.length > 0 && key !== 'YOUR_REPLICATE_API_KEY';
}
