const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Protected routes (specific routes before generic ones)
router.put('/:userId/equipment', authenticateToken, userController.updateEquipment);
router.put('/:userId/exercise-preference', authenticateToken, userController.updateExercisePreference);
router.get('/:userId', authenticateToken, userController.getUserProfile);
router.put('/:userId', authenticateToken, userController.updateUserProfile);

module.exports = router;
