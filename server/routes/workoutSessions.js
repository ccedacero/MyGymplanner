const express = require('express');
const router = express.Router();
const workoutSessionController = require('../controllers/workoutSessionController');
const { authenticateToken } = require('../middleware/auth');

// Sync workout session (create or update)
router.post('/sync', authenticateToken, workoutSessionController.syncSession);

// Get active session for user
router.get('/active/:userId', authenticateToken, workoutSessionController.getActiveSession);

// Complete a workout session
router.post('/:sessionId/complete', authenticateToken, workoutSessionController.completeSession);

// Abandon a workout session
router.delete('/:sessionId', authenticateToken, workoutSessionController.abandonSession);

// Get specific session by ID
router.get('/:sessionId', authenticateToken, workoutSessionController.getSessionById);

module.exports = router;
