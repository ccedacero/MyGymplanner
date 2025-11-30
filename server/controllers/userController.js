const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../db/models/User');

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

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = User.findAll();
    const usersWithoutPasswords = users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

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

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
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

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
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

    if (!Array.isArray(equipment)) {
      return res.status(400).json({ error: 'Equipment must be an array' });
    }

    const user = User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = User.update(userId, { equipment });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Equipment updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
};

// Update user exercise preference
exports.updateExercisePreference = async (req, res) => {
  try {
    const { userId } = req.params;
    const { exercisePreference } = req.body;

    // Validate preference value
    const validPreferences = ['default', 'known', 'both'];
    if (!validPreferences.includes(exercisePreference)) {
      return res.status(400).json({
        error: `exercisePreference must be one of: ${validPreferences.join(', ')}`
      });
    }

    const user = User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = User.update(userId, { exercisePreference });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Exercise preference updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating exercise preference:', error);
    res.status(500).json({ error: 'Failed to update exercise preference' });
  }
};
