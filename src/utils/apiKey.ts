import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Generates a cryptographically secure API key
 * Format: ts_[32 random hex chars]
 */
export const generateApiKey = (): string => {
  const randomBytes = crypto.randomBytes(32);
  const apiKey = `ts_${randomBytes.toString('hex')}`;
  return apiKey;
};

/**
 * Hashes an API key for secure storage
 */
export const hashApiKey = async (apiKey: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(apiKey, saltRounds);
};

/**
 * Verifies an API key against a stored hash
 */
export const verifyApiKey = async (apiKey: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(apiKey, hash);
};

/**
 * Validates API key format
 */
export const isValidApiKeyFormat = (apiKey: string): boolean => {
  // ts_[64 hex chars]
  const apiKeyRegex = /^ts_[a-f0-9]{64}$/i;
  return apiKeyRegex.test(apiKey);
};

/**
 * Masks an API key for display purposes (shows first 8 chars + asterisks)
 */
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) {
    return '********';
  }
  return `${apiKey.substring(0, 8)}${'*'.repeat(apiKey.length - 8)}`;
};
