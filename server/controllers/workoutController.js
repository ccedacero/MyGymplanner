const { v4: uuidv4 } = require('uuid');
const Workout = require('../db/models/Workout');
const Plan = require('../db/models/Plan');

// Log a completed workout
exports.logWorkout = async (req, res) => {
  try {
    // SECURITY FIX: Get userId from JWT token, not from user input (prevents mass assignment)
    const userId = req.user.userId;
    const { planId, date, exercises, duration, notes, rpe } = req.body;

    if (!exercises) {
      return res.status(400).json({ error: 'exercises are required' });
    }

    const now = new Date().toISOString();
    const workout = Workout.create({
      id: `workout-${uuidv4()}`,
      userId,
      planId,
      date: date || now,
      exercises,
      duration: duration || null,
      notes: notes || '',
      rpe: rpe || null,
      createdAt: now,
      updatedAt: now
    });

    res.status(201).json({
      message: 'Workout logged successfully',
      workout
    });
  } catch (error) {
    console.error('Error logging workout:', error);
    res.status(500).json({ error: 'Failed to log workout' });
  }
};

// Get user's workout history
exports.getUserWorkouts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, startDate, endDate } = req.query;

    // Authorization: Verify user can only access their own workout history
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own workout history' });
    }

    const userWorkouts = Workout.findByUserId(userId, {
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({
      workouts: userWorkouts,
      count: userWorkouts.length
    });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
};

// Get today's workout from a plan
exports.getTodaysWorkout = async (req, res) => {
  try {
    const { planId } = req.params;

    // Load the plan
    const plan = Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Authorization: Verify user owns this plan
    if (plan.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own plans' });
    }

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today];

    // Find today's workout in the schedule
    const todaysWorkout = plan.weekSchedule.find(w => w.day === todayName);

    if (!todaysWorkout) {
      return res.status(404).json({ error: 'No workout scheduled for today' });
    }

    res.json({
      planId,
      day: todayName,
      workout: todaysWorkout
    });
  } catch (error) {
    console.error('Error fetching today\'s workout:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s workout' });
  }
};

// Get specific workout
exports.getWorkoutById = async (req, res) => {
  try {
    const { workoutId } = req.params;

    const workout = Workout.findById(workoutId);

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Authorization: Verify user owns this workout
    if (workout.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own workouts' });
    }

    res.json(workout);
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
};

// Update workout
exports.updateWorkout = async (req, res) => {
  try {
    const { workoutId } = req.params;

    const workout = Workout.findById(workoutId);

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Authorization: Verify user owns this workout
    if (workout.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only modify your own workouts' });
    }

    const updatedWorkout = Workout.update(workoutId, req.body);

    res.json({
      message: 'Workout updated successfully',
      workout: updatedWorkout
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({ error: 'Failed to update workout' });
  }
};

// Delete workout
exports.deleteWorkout = async (req, res) => {
  try {
    const { workoutId } = req.params;

    // First check if workout exists and user owns it
    const workout = Workout.findById(workoutId);
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Authorization: Verify user owns this workout
    if (workout.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own workouts' });
    }

    const deleted = Workout.delete(workoutId);

    if (!deleted) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
};

// Get last workout data for a specific exercise (for comparison)
exports.getLastExerciseWorkout = async (req, res) => {
  try {
    const { userId, exerciseId } = req.params;

    // Authorization: Verify user can only access their own workout history
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own workout history' });
    }

    // Get user's workouts containing this exercise
    const userWorkouts = Workout.findByExerciseId(userId, exerciseId);

    // Find the most recent workout containing this exercise
    for (const workout of userWorkouts) {
      const exercise = workout.exercises.find(ex => ex.exerciseId === exerciseId);
      if (exercise && exercise.sets && exercise.sets.length > 0) {
        // Return only the exercise data and workout date
        return res.json({
          date: workout.date,
          exercise: {
            exerciseId: exercise.exerciseId,
            sets: exercise.sets
          }
        });
      }
    }

    // No previous workout found for this exercise
    res.status(404).json({ error: 'No previous workout found for this exercise' });
  } catch (error) {
    console.error('Error fetching last exercise workout:', error);
    res.status(500).json({ error: 'Failed to fetch last exercise workout' });
  }
};

// Get workout statistics for dashboard
exports.getWorkoutStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query; // 'week', 'month', 'all'

    // Authorization: Verify user can only access their own statistics
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own workout statistics' });
    }

    // Calculate date range for filtering
    const now = new Date();
    let startDate = null;
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = weekAgo.toISOString();
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = monthAgo.toISOString();
    }

    // Get workouts
    const userWorkouts = Workout.findByUserId(userId, { startDate });

    // Calculate stats
    const totalWorkouts = userWorkouts.length;
    const totalVolume = userWorkouts.reduce((sum, w) => {
      const volume = w.exercises.reduce((exSum, ex) => {
        const exVolume = ex.sets?.reduce((setSum, set) => {
          return setSum + (set.weight || 0) * (set.reps || 0);
        }, 0) || 0;
        return exSum + exVolume;
      }, 0);
      return sum + volume;
    }, 0);

    const avgDuration = userWorkouts.length > 0
      ? userWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / userWorkouts.length
      : 0;

    const avgRpe = userWorkouts.filter(w => w.rpe).length > 0
      ? userWorkouts.filter(w => w.rpe).reduce((sum, w) => sum + w.rpe, 0) / userWorkouts.filter(w => w.rpe).length
      : null;

    res.json({
      period,
      stats: {
        totalWorkouts,
        totalVolume,
        avgDuration: Math.round(avgDuration),
        avgRpe: avgRpe ? avgRpe.toFixed(1) : null
      }
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
};
