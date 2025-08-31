import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Generates a cryptographically secure API key bound to a specific id (UUID).
 * New format: ts_<id(uuid)>_<64 hex secret>
 */
export const generateApiKey = (id: string): string => {
  const secret = crypto.randomBytes(32).toString('hex');
  return `ts_${id}_${secret}`;
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
  // New: ts_<uuid>_<64 hex> 
  const newFmt = /^ts_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}_[a-f0-9]{64}$/i;
  const legacyFmt = /^ts_[a-f0-9]{64}$/i;
  return newFmt.test(apiKey) || legacyFmt.test(apiKey);
};

/**
 * Parses an API key. Returns id for new format, undefined for legacy.
 */
export const parseApiKey = (
  apiKey: string
): { id?: string; secret?: string; isLegacy: boolean } => {
  const newFmt = /^ts_([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})_([a-f0-9]{64})$/i;
  const m = apiKey.match(newFmt);
  if (m) {
    return { id: m[1], secret: m[2], isLegacy: false };
  }
  const legacyFmt = /^ts_([a-f0-9]{64})$/i;
  const m2 = apiKey.match(legacyFmt);
  if (m2) {
    return { secret: m2[1], isLegacy: true };
  }
  return { isLegacy: false };
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
