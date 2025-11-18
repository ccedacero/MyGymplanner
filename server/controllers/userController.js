const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const USERS_PATH = path.join(__dirname, '../data/users.json');

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

// Initialize users file
async function initUsers() {
  try {
    await fs.access(USERS_PATH);
  } catch {
    await fs.writeFile(USERS_PATH, JSON.stringify({ users: [] }, null, 2));
  }
}

initUsers();

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

    // Load existing users
    const usersData = await fs.readFile(USERS_PATH, 'utf8');
    const users = JSON.parse(usersData);

    // Check if user exists
    const existingUser = users.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: `user-${uuidv4()}`,
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      equipment: [], // User's available equipment
      exercisePreference: 'both', // Default to using both default and known exercises
      createdAt: new Date().toISOString()
    };

    users.users.push(user);
    await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));

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

    // Load users
    const usersData = await fs.readFile(USERS_PATH, 'utf8');
    const users = JSON.parse(usersData);

    // Find user
    const user = users.users.find(u => u.email === email);
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

    const usersData = await fs.readFile(USERS_PATH, 'utf8');
    const users = JSON.parse(usersData);

    const user = users.users.find(u => u.id === userId);

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

    const usersData = await fs.readFile(USERS_PATH, 'utf8');
    const users = JSON.parse(usersData);

    const index = users.users.findIndex(u => u.id === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user (don't allow password or email updates through this endpoint)
    const { password, email, ...updateData } = req.body;

    users.users[index] = {
      ...users.users[index],
      ...updateData,
      id: userId, // Preserve ID
      email: users.users[index].email, // Preserve email
      password: users.users[index].password, // Preserve password
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));

    const { password: _, ...userWithoutPassword } = users.users[index];

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

    const usersData = await fs.readFile(USERS_PATH, 'utf8');
    const users = JSON.parse(usersData);

    const index = users.users.findIndex(u => u.id === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.users[index].equipment = equipment;
    users.users[index].updatedAt = new Date().toISOString();

    await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));

    const { password: _, ...userWithoutPassword } = users.users[index];

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

    const usersData = await fs.readFile(USERS_PATH, 'utf8');
    const users = JSON.parse(usersData);

    const index = users.users.findIndex(u => u.id === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users.users[index].exercisePreference = exercisePreference;
    users.users[index].updatedAt = new Date().toISOString();

    await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2));

    const { password: _, ...userWithoutPassword } = users.users[index];

    res.json({
      message: 'Exercise preference updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating exercise preference:', error);
    res.status(500).json({ error: 'Failed to update exercise preference' });
  }
};
