import crypto from 'crypto';

const KEY_PREFIX = 'mf_live_';
const KEY_RANDOM_BYTES = 32; // 256 bits

/**
 * Generate a new API key
 * Format: mf_live_<64-hex-chars>
 * Example: mf_live_a1b2c3d4e5f6...
 *
 * Returns:
 * - key: Full key (shown to user ONCE)
 * - hash: SHA-256 hash (stored in DB)
 * - prefix: First 16 chars (for display: "mf_live_a1b2c3")
 */
export function generateApiKey(): {
  key: string;
  hash: string;
  prefix: string;
} {
  const randomPart = crypto
    .randomBytes(KEY_RANDOM_BYTES)
    .toString('hex'); // 64 hex chars

  const key = `${KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(key);
  const prefix = key.slice(0, 16); // "mf_live_a1b2c3d4"

  return { key, hash, prefix };
}

/**
 * Hash an API key for storage
 * SHA-256 is sufficient here because keys are high-entropy random (256 bits)
 * (Unlike passwords, we don't need bcrypt/argon2)
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format before hitting DB
 */
export function isValidApiKeyFormat(key: string): boolean {
  if (!key.startsWith(KEY_PREFIX)) return false;
  if (key.length !== KEY_PREFIX.length + 64) return false;
  const randomPart = key.slice(KEY_PREFIX.length);
  return /^[a-f0-9]{64}$/.test(randomPart);
}