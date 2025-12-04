const express = require('express');
const router = express.Router();
const workoutSessionController = require('../controllers/workoutSessionController');

// Sync workout session (create or update)
router.post('/sync', workoutSessionController.syncSession);

// Get active session for user
router.get('/active/:userId', workoutSessionController.getActiveSession);

// Complete a workout session
router.post('/:sessionId/complete', workoutSessionController.completeSession);

// Abandon a workout session
router.delete('/:sessionId', workoutSessionController.abandonSession);

// Get specific session by ID
router.get('/:sessionId', workoutSessionController.getSessionById);

module.exports = router;
