const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// List all users (for debugging)
router.get('/', userController.getAllUsers);

// Register user
router.post('/register', userController.register);

// Login user
router.post('/login', userController.login);

// Update user equipment (specific routes before generic ones)
router.put('/:userId/equipment', userController.updateEquipment);

// Update user exercise preference
router.put('/:userId/exercise-preference', userController.updateExercisePreference);

// Get user profile
router.get('/:userId', userController.getUserProfile);

// Update user profile
router.put('/:userId', userController.updateUserProfile);

module.exports = router;
