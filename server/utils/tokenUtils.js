const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '365d'; // 1 year

function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId, email, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken() {
  // Generate a cryptographically secure random token
  return crypto.randomBytes(40).toString('hex');
}

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

function getTokenExpiration(expiryString) {
  const now = new Date();
  const matches = expiryString.match(/^(\d+)([hdmy])$/);

  if (!matches) return now;

  const value = parseInt(matches[1]);
  const unit = matches[2];

  switch (unit) {
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    case 'm':
      return new Date(now.setMonth(now.getMonth() + value));
    case 'y':
      return new Date(now.setFullYear(now.getFullYear() + value));
    default:
      return now;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  decodeToken,
  getTokenExpiration,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};
