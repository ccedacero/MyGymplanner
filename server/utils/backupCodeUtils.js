const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a random backup code in the format: XXXX-XXXX-XXXX
 * Uses crypto.randomBytes for cryptographically secure random generation
 */
function generateBackupCode() {
  // Generate 6 random bytes (48 bits)
  const buffer = crypto.randomBytes(6);

  // Convert to base32-like encoding (using only uppercase letters and numbers, excluding confusing chars like 0, O, I, 1)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';

  for (let i = 0; i < 12; i++) {
    const index = buffer[i % 6] % chars.length;
    code += chars[index];

    // Add dashes after every 4 characters
    if ((i + 1) % 4 === 0 && i < 11) {
      code += '-';
    }
  }

  return code;
}

/**
 * Generate multiple unique backup codes
 * @param {number} count - Number of codes to generate (default: 10)
 * @returns {string[]} Array of backup codes
 */
function generateBackupCodes(count = 10) {
  const codes = new Set();

  while (codes.size < count) {
    codes.add(generateBackupCode());
  }

  return Array.from(codes);
}

/**
 * Hash a backup code for secure storage
 * @param {string} code - The backup code to hash
 * @returns {Promise<string>} Hashed code
 */
async function hashBackupCode(code) {
  // Remove dashes for consistent hashing
  const normalizedCode = code.replace(/-/g, '');
  return bcrypt.hash(normalizedCode, 10);
}

/**
 * Verify a backup code against a hash
 * @param {string} code - The backup code to verify
 * @param {string} hash - The stored hash
 * @returns {Promise<boolean>} True if code matches hash
 */
async function verifyBackupCode(code, hash) {
  // Remove dashes for consistent comparison
  const normalizedCode = code.replace(/-/g, '');
  return bcrypt.compare(normalizedCode, hash);
}

/**
 * Normalize a backup code (remove dashes, convert to uppercase)
 * @param {string} code - The backup code to normalize
 * @returns {string} Normalized code
 */
function normalizeBackupCode(code) {
  return code.replace(/-/g, '').toUpperCase();
}

module.exports = {
  generateBackupCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  normalizeBackupCode
};
