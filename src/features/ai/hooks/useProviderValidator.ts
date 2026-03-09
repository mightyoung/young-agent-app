// Provider Validator Hook
// Validates API key before switching provider

import { useState, useCallback } from 'react';
import { providerFactory } from '../services/provider/factory';
import type { ProviderType } from '../services/types';

interface ValidationResult {
  success: boolean;
  error?: string;
}

interface UseProviderValidatorReturn {
  validateAndSwitch: (type: ProviderType, apiKey?: string) => Promise<ValidationResult>;
  validating: boolean;
  error: string | null;
}

/**
 * Hook for validating provider API keys before switching
 *
 * @example
 * const { validateAndSwitch, validating, error } = useProviderValidator();
 *
 * const handleSwitch = async (provider) => {
 *   const result = await validateAndSwitch(provider, apiKey);
 *   if (result.success) {
 *     console.log('Provider switched successfully');
 *   }
 * };
 */
export function useProviderValidator(): UseProviderValidatorReturn {
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSwitch = useCallback(
    async (type: ProviderType, apiKey?: string): Promise<ValidationResult> => {
      setValidating(true);
      setError(null);

      try {
        // If API key is provided, validate it first
        if (apiKey) {
          const validation = await providerFactory.validateApiKey(type, apiKey);
          if (!validation.valid) {
            setError(validation.error || 'API key validation failed');
            setValidating(false);
            return { success: false, error: validation.error };
          }
        }

        // Switch to the provider
        await providerFactory.switchProvider(type);
        setValidating(false);
        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setValidating(false);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return { validateAndSwitch, validating, error };
}

export default useProviderValidator;
