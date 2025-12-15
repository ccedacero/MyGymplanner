const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const { authenticateToken } = require('../middleware/auth');

// Log a workout
router.post('/log', authenticateToken, workoutController.logWorkout);

// Get user's workout history
router.get('/user/:userId', authenticateToken, workoutController.getUserWorkouts);

// Get today's workout for a plan
router.get('/today/:planId', authenticateToken, workoutController.getTodaysWorkout);

// Get specific workout
router.get('/:workoutId', authenticateToken, workoutController.getWorkoutById);

// Update workout
router.put('/:workoutId', authenticateToken, workoutController.updateWorkout);

// Delete workout
router.delete('/:workoutId', authenticateToken, workoutController.deleteWorkout);

// Get workout stats
router.get('/stats/:userId', authenticateToken, workoutController.getWorkoutStats);

// Get last workout for specific exercise (for comparison)
router.get('/last/:userId/:exerciseId', authenticateToken, workoutController.getLastExerciseWorkout);

module.exports = router;
