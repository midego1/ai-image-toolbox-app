import Constants from 'expo-constants';

/**
 * Get Replicate API key from app configuration
 * This supports both development (app.json) and production (EAS Secrets)
 */
export function getReplicateApiKey(): string {
  // First, try to get from EAS Secrets (production)
  const easSecret = Constants.expoConfig?.extra?.replicateApiKey;
  if (easSecret && typeof easSecret === 'string' && easSecret.length > 0) {
    return easSecret;
  }

  // Fallback to app.json extra config (development)
  const appConfigKey = Constants.expoConfig?.extra?.replicateApiKey;
  if (appConfigKey && typeof appConfigKey === 'string' && appConfigKey.length > 0) {
    return appConfigKey;
  }

  // No key configured
  return '';
}

/**
 * Check if API key is configured
 */
export function isApiKeyConfigured(): boolean {
  const key = getReplicateApiKey();
  return key.length > 0 && key !== 'YOUR_REPLICATE_API_KEY';
}
