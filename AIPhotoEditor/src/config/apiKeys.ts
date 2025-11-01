import Constants from 'expo-constants';

/**
 * Get Replicate API key from app configuration
 * This supports:
 * - Development: app.json extra.replicateApiKey
 * - Production: EAS Environment Variables
 * 
 * EAS automatically maps:
 * - Environment Variables: REPLICATE_API_KEY -> extra.REPLICATE_API_KEY (uppercase) or extra.replicateApiKey (camelCase)
 * - Created via: eas env:create production --name REPLICATE_API_KEY --value your-key --visibility secret --scope project
 */
export function getReplicateApiKey(): string {
  // Try camelCase first (app.json and EAS Environment Variables)
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

/**
 * Get Kie.ai API key from app configuration
 * This supports:
 * - Development: app.json extra.kieAIApiKey
 * - Production: EAS Environment Variables
 * 
 * EAS automatically maps:
 * - Environment Variables: KIE_AI_API_KEY -> extra.KIE_AI_API_KEY (uppercase) or extra.kieAIApiKey (camelCase)
 * - Created via: eas env:create production --name KIE_AI_API_KEY --value your-key --visibility secret --scope project
 */
export function getKieAIApiKey(): string {
  // Try camelCase first (app.json and EAS Environment Variables)
  let apiKey = Constants.expoConfig?.extra?.kieAIApiKey;
  
  // If not found, try uppercase (EAS Environment Variables might use this)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    apiKey = Constants.expoConfig?.extra?.KIE_AI_API_KEY;
  }
  
  // Also check process.env as fallback (some EAS setups)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    // @ts-ignore - process.env might have the key in some contexts
    const envKey = typeof process !== 'undefined' && process.env?.KIE_AI_API_KEY;
    if (envKey && typeof envKey === 'string') {
      apiKey = envKey;
    }
  }
  
  if (apiKey && typeof apiKey === 'string' && apiKey.length > 0) {
    // Validate that it's a real key (not empty placeholder)
    if (apiKey !== 'YOUR_KIE_AI_API_KEY' && apiKey.trim().length > 0) {
      return apiKey.trim();
    }
  }
  
  // No key configured or invalid
  return '';
}

/**
 * Check if Kie.ai API key is configured
 */
export function isKieAIKeyConfigured(): boolean {
  const key = getKieAIApiKey();
  return key.length > 0 && key !== 'YOUR_KIE_AI_API_KEY';
}

/**
 * Validation result for API key testing
 */
export interface ApiKeyValidationResult {
  configured: boolean;
  valid: boolean | null; // null = not tested, true = valid, false = invalid
  error?: string;
  testedAt?: Date;
}

/**
 * Validate Replicate API key by making a test API call
 * This actually tests if the key works by calling the Replicate API
 */
export async function validateReplicateApiKey(): Promise<ApiKeyValidationResult> {
  const key = getReplicateApiKey();
  
  if (!key || key.length === 0) {
    return {
      configured: false,
      valid: null,
      error: 'API key not configured',
    };
  }

  try {
    // Make a simple API call to verify the key
    const response = await fetch('https://api.replicate.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      return {
        configured: true,
        valid: true,
        testedAt: new Date(),
      };
    } else if (response.status === 401) {
      return {
        configured: true,
        valid: false,
        error: 'Invalid API key (authentication failed)',
        testedAt: new Date(),
      };
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        configured: true,
        valid: false,
        error: `API error: ${response.status} - ${errorText}`,
        testedAt: new Date(),
      };
    }
  } catch (error: any) {
    return {
      configured: true,
      valid: null,
      error: `Network error: ${error.message || 'Failed to connect to API'}`,
      testedAt: new Date(),
    };
  }
}

/**
 * Validate Kie.ai API key by making a test API call
 * Note: This depends on Kie.ai's API structure - adjust endpoint as needed
 */
export async function validateKieAIApiKey(): Promise<ApiKeyValidationResult> {
  const key = getKieAIApiKey();
  
  if (!key || key.length === 0) {
    return {
      configured: false,
      valid: null,
      error: 'API key not configured',
    };
  }

  try {
    // Try to get account info or available models
    // Adjust this endpoint based on Kie.ai's actual API structure
    // This is a placeholder - check Kie.ai documentation for the correct endpoint
    const response = await fetch('https://api.kie.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      return {
        configured: true,
        valid: true,
        testedAt: new Date(),
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        configured: true,
        valid: false,
        error: 'Invalid API key (authentication failed)',
        testedAt: new Date(),
      };
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        configured: true,
        valid: false,
        error: `API error: ${response.status} - ${errorText}`,
        testedAt: new Date(),
      };
    }
  } catch (error: any) {
    // Network errors don't necessarily mean the key is invalid
    // They might mean the endpoint is wrong or network is unavailable
    return {
      configured: true,
      valid: null,
      error: `Could not test key: ${error.message || 'Network error or incorrect API endpoint'}. Note: Kie.ai endpoint may need adjustment based on their API documentation.`,
      testedAt: new Date(),
    };
  }
}
