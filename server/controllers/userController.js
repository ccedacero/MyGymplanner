const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../db/models/User');
const Session = require('../db/models/Session');
const {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiration,
  REFRESH_TOKEN_EXPIRY
} = require('../utils/tokenUtils');
const { parseUserAgent, getClientIp } = require('../utils/deviceUtils');

// Validation functions
function validateEmail(email) {
  // RFC 5322 compliant email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // Password must be at least 8 characters and contain:
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one number
  // - At least one special character
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`at least ${minLength} characters`);
  }
  if (!hasUpperCase) {
    errors.push('at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('at least one lowercase letter');
  }
  if (!hasNumber) {
    errors.push('at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('at least one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Database is initialized in db/database.js

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password does not meet security requirements',
        requirements: passwordValidation.errors
      });
    }

    // Check if user exists
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const now = new Date().toISOString();
    const user = User.create({
      id: `user-${uuidv4()}`,
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      equipment: [],
      exercisePreference: 'both',
      createdAt: now,
      updatedAt: now
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken();

    // Create session
    const userAgent = req.headers['user-agent'] || '';
    const { deviceName, deviceType } = parseUserAgent(userAgent);
    const ipAddress = getClientIp(req);

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

    // Generate backup codes (one-time only during registration)
    const BackupCode = require('../db/models/BackupCode');
    const { generateBackupCodes, hashBackupCode } = require('../utils/backupCodeUtils');

    const backupCodes = generateBackupCodes(10);
    const codePromises = backupCodes.map(async (code) => {
      const codeHash = await hashBackupCode(code);
      BackupCode.create({
        id: `backup-${uuidv4()}`,
        userId: user.id,
        codeHash,
        createdAt: now
      });
    });
    await Promise.all(codePromises);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      sessionId,
      backupCodes,
      backupCodesWarning: 'Save these backup codes in a secure location. They will only be shown once and can be used to recover your account if you forget your password.'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      sessionId
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user (don't allow password or email updates through this endpoint)
    const { password, email, ...updateData } = req.body;

    const updatedUser = User.update(userId, updateData);

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Update user equipment
exports.updateEquipment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { equipment } = req.body;

    console.log('[updateEquipment] Request params:', { userId });
    console.log('[updateEquipment] Request body:', { equipment });

    if (!Array.isArray(equipment)) {
      console.log('[updateEquipment] Error: Equipment is not an array');
      return res.status(400).json({ error: 'Equipment must be an array' });
    }

    const user = User.findById(userId);

    if (!user) {
      console.log('[updateEquipment] Error: User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[updateEquipment] Found user:', user.id, user.email);
    const updatedUser = User.update(userId, { equipment });
    console.log('[updateEquipment] Update successful');

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Equipment updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('[updateEquipment] Error:', error);
    console.error('[updateEquipment] Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to update equipment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user exercise preference
exports.updateExercisePreference = async (req, res) => {
  try {
    const { userId } = req.params;
    const { exercisePreference } = req.body;

    console.log('[updateExercisePreference] Request params:', { userId });
    console.log('[updateExercisePreference] Request body:', { exercisePreference });

    // Validate preference value
    const validPreferences = ['default', 'known', 'both'];
    if (!validPreferences.includes(exercisePreference)) {
      console.log('[updateExercisePreference] Error: Invalid preference value');
      return res.status(400).json({
        error: `exercisePreference must be one of: ${validPreferences.join(', ')}`
      });
    }

    const user = User.findById(userId);

    if (!user) {
      console.log('[updateExercisePreference] Error: User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[updateExercisePreference] Found user:', user.id, user.email);
    const updatedUser = User.update(userId, { exercisePreference });
    console.log('[updateExercisePreference] Update successful');

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Exercise preference updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('[updateExercisePreference] Error:', error);
    console.error('[updateExercisePreference] Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to update exercise preference',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (sessionId) {
      Session.revoke(sessionId);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};
