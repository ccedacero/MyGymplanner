const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const backupCodeController = require('../controllers/backupCodeController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/login-backup-code', backupCodeController.loginWithBackupCode);
router.post('/logout', userController.logout);

// Protected routes (specific routes before generic ones)
router.put('/:userId/equipment', authenticateToken, userController.updateEquipment);
router.put('/:userId/exercise-preference', authenticateToken, userController.updateExercisePreference);

// Backup code routes (codes are only generated once during registration)
router.get('/:userId/backup-codes/count', authenticateToken, backupCodeController.getBackupCodeCount);

router.get('/:userId', authenticateToken, userController.getUserProfile);
router.put('/:userId', authenticateToken, userController.updateUserProfile);

module.exports = router;
