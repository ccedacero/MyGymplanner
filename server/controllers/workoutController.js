const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const WORKOUTS_PATH = path.join(__dirname, '../data/workouts.json');
const PLANS_PATH = path.join(__dirname, '../data/plans.json');

// Initialize workouts file
async function initWorkouts() {
  try {
    await fs.access(WORKOUTS_PATH);
  } catch {
    await fs.writeFile(WORKOUTS_PATH, JSON.stringify({ workouts: [] }, null, 2));
  }
}

initWorkouts();

// Log a completed workout
exports.logWorkout = async (req, res) => {
  try {
    const { userId, planId, date, exercises, duration, notes, rpe } = req.body;

    if (!userId || !exercises) {
      return res.status(400).json({ error: 'userId and exercises are required' });
    }

    const workout = {
      id: `workout-${uuidv4()}`,
      userId,
      planId,
      date: date || new Date().toISOString(),
      exercises, // Array of { exerciseId, sets: [{ weight, reps, completed }] }
      duration: duration || null,
      notes: notes || '',
      rpe: rpe || null,
      createdAt: new Date().toISOString()
    };

    const workoutsData = await fs.readFile(WORKOUTS_PATH, 'utf8');
    const workouts = JSON.parse(workoutsData);
    workouts.workouts.push(workout);

    await fs.writeFile(WORKOUTS_PATH, JSON.stringify(workouts, null, 2));

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

    const workoutsData = await fs.readFile(WORKOUTS_PATH, 'utf8');
    const workouts = JSON.parse(workoutsData);

    let userWorkouts = workouts.workouts.filter(w => w.userId === userId);

    // Filter by date range if provided
    if (startDate) {
      userWorkouts = userWorkouts.filter(w => new Date(w.date) >= new Date(startDate));
    }
    if (endDate) {
      userWorkouts = userWorkouts.filter(w => new Date(w.date) <= new Date(endDate));
    }

    // Sort by date descending (most recent first)
    userWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit results if specified
    if (limit) {
      userWorkouts = userWorkouts.slice(0, parseInt(limit));
    }

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
    const plansData = await fs.readFile(PLANS_PATH, 'utf8');
    const plans = JSON.parse(plansData);
    const plan = plans.plans.find(p => p.id === planId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
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

    const workoutsData = await fs.readFile(WORKOUTS_PATH, 'utf8');
    const workouts = JSON.parse(workoutsData);

    const workout = workouts.workouts.find(w => w.id === workoutId);

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
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

    const workoutsData = await fs.readFile(WORKOUTS_PATH, 'utf8');
    const workouts = JSON.parse(workoutsData);

    const index = workouts.workouts.findIndex(w => w.id === workoutId);

    if (index === -1) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    workouts.workouts[index] = {
      ...workouts.workouts[index],
      ...req.body,
      id: workoutId,
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(WORKOUTS_PATH, JSON.stringify(workouts, null, 2));

    res.json({
      message: 'Workout updated successfully',
      workout: workouts.workouts[index]
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

    const workoutsData = await fs.readFile(WORKOUTS_PATH, 'utf8');
    const workouts = JSON.parse(workoutsData);

    const initialLength = workouts.workouts.length;
    workouts.workouts = workouts.workouts.filter(w => w.id !== workoutId);

    if (workouts.workouts.length === initialLength) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    await fs.writeFile(WORKOUTS_PATH, JSON.stringify(workouts, null, 2));

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
};

// Get workout statistics for dashboard
exports.getWorkoutStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period } = req.query; // 'week', 'month', 'all'

    const workoutsData = await fs.readFile(WORKOUTS_PATH, 'utf8');
    const workouts = JSON.parse(workoutsData);

    let userWorkouts = workouts.workouts.filter(w => w.userId === userId);

    // Filter by period
    const now = new Date();
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      userWorkouts = userWorkouts.filter(w => new Date(w.date) >= weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      userWorkouts = userWorkouts.filter(w => new Date(w.date) >= monthAgo);
    }

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
