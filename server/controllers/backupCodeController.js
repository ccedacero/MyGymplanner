const { v4: uuidv4 } = require('uuid');
const BackupCode = require('../db/models/BackupCode');
const User = require('../db/models/User');
const {
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode
} = require('../utils/backupCodeUtils');

/**
 * Generate new backup codes for a user
 * This will delete any existing unused codes and create new ones
 */
exports.generateBackupCodes = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user from JWT matches requested userId
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Verify user exists
    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all existing backup codes for this user
    BackupCode.deleteAllForUser(userId);

    // Generate 10 new backup codes
    const codes = generateBackupCodes(10);
    const now = new Date().toISOString();

    // Hash and store each code
    const codePromises = codes.map(async (code) => {
      const codeHash = await hashBackupCode(code);
      BackupCode.create({
        id: `backup-${uuidv4()}`,
        userId,
        codeHash,
        createdAt: now
      });
    });

    await Promise.all(codePromises);

    // Return the plain text codes (only time they'll be shown)
    res.json({
      message: 'Backup codes generated successfully',
      codes,
      warning: 'Save these codes in a secure location. They will not be shown again.'
    });
  } catch (error) {
    console.error('Error generating backup codes:', error);
    res.status(500).json({ error: 'Failed to generate backup codes' });
  }
};

/**
 * Get count of unused backup codes for a user
 */
exports.getBackupCodeCount = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user from JWT matches requested userId
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const count = BackupCode.countUnused(userId);

    res.json({ count });
  } catch (error) {
    console.error('Error fetching backup code count:', error);
    res.status(500).json({ error: 'Failed to fetch backup code count' });
  }
};

/**
 * Login with a backup code
 * This will authenticate the user and mark the backup code as used
 */
exports.loginWithBackupCode = async (req, res) => {
  try {
    const { email, backupCode } = req.body;

    if (!email || !backupCode) {
      return res.status(400).json({ error: 'Email and backup code are required' });
    }

    // Find user
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get all unused backup codes for this user
    const backupCodes = BackupCode.findUnusedByUserId(user.id);

    if (backupCodes.length === 0) {
      return res.status(401).json({
        error: 'No valid backup codes available',
        message: 'Please contact support or use your password to login'
      });
    }

    // Try to find a matching backup code
    let matchedCode = null;

    for (const code of backupCodes) {
      const isMatch = await verifyBackupCode(backupCode, code.code_hash);
      if (isMatch) {
        matchedCode = code;
        break;
      }
    }

    if (!matchedCode) {
      return res.status(401).json({ error: 'Invalid backup code' });
    }

    // Mark the backup code as used
    BackupCode.markAsUsed(matchedCode.id);

    // Import auth utilities
    const { generateAccessToken, generateRefreshToken, getTokenExpiration, REFRESH_TOKEN_EXPIRY } = require('../utils/tokenUtils');
    const { parseUserAgent, getClientIp } = require('../utils/deviceUtils');
    const Session = require('../db/models/Session');

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken();

    // Create session
    const userAgent = req.headers['user-agent'] || '';
    const { deviceName, deviceType } = parseUserAgent(userAgent);
    const ipAddress = getClientIp(req);

    const now = new Date().toISOString();
    const sessionId = `session-${uuidv4()}`;
    await Session.create({
      id: sessionId,
      userId: user.id,
      refreshToken,
      deviceName,
      deviceType,
      userAgent,
      ipAddress,
      createdAt: now,
      expiresAt: getTokenExpiration(REFRESH_TOKEN_EXPIRY).toISOString()
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    // Get remaining backup code count
    const remainingCodes = BackupCode.countUnused(user.id);

    res.json({
      message: 'Login successful with backup code',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      sessionId,
      remainingBackupCodes: remainingCodes,
      warning: remainingCodes === 0
        ? 'This was your last backup code. Please generate new codes after logging in.'
        : `You have ${remainingCodes} backup code(s) remaining.`
    });
  } catch (error) {
    console.error('Error logging in with backup code:', error);
    res.status(500).json({ error: 'Failed to login with backup code' });
  }
};

module.exports = exports;
