const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');

// Log a workout
router.post('/log', workoutController.logWorkout);

// Get user's workout history
router.get('/user/:userId', workoutController.getUserWorkouts);

// Get today's workout for a plan
router.get('/today/:planId', workoutController.getTodaysWorkout);

// Get specific workout
router.get('/:workoutId', workoutController.getWorkoutById);

// Update workout
router.put('/:workoutId', workoutController.updateWorkout);

// Delete workout
router.delete('/:workoutId', workoutController.deleteWorkout);

// Get workout stats
router.get('/stats/:userId', workoutController.getWorkoutStats);

// Get last workout for specific exercise (for comparison)
router.get('/last/:userId/:exerciseId', workoutController.getLastExerciseWorkout);

module.exports = router;
