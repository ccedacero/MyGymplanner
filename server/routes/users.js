const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register user
router.post('/register', userController.register);

// Login user
router.post('/login', userController.login);

// Get user profile
router.get('/:userId', userController.getUserProfile);

// Update user profile
router.put('/:userId', userController.updateUserProfile);

// Update user equipment
router.put('/:userId/equipment', userController.updateEquipment);

// Update user exercise preference
router.put('/:userId/exercise-preference', userController.updateExercisePreference);

module.exports = router;
