const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const EXERCISES_DB_PATH = path.join(__dirname, '../data/exercises-database.json');
const CUSTOM_EXERCISES_PATH = path.join(__dirname, '../data/custom-exercises.json');
const PLANS_PATH = path.join(__dirname, '../data/plans.json');

// Initialize plans file
async function initPlans() {
  try {
    await fs.access(PLANS_PATH);
  } catch {
    await fs.writeFile(PLANS_PATH, JSON.stringify({ plans: [] }, null, 2));
  }
}

initPlans();

// Load all available exercises for a user
async function loadUserExercises(userId) {
  // Load built-in exercises
  const builtInData = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
  const builtIn = JSON.parse(builtInData);
  let exercises = [...builtIn.exercises];

  // Load custom exercises if userId provided
  if (userId) {
    try {
      const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
      const custom = JSON.parse(customData);
      const userCustom = custom.exercises.filter(ex => ex.userId === userId);
      exercises = [...exercises, ...userCustom];
    } catch (error) {
      // No custom exercises yet, that's okay
    }
  }

  return exercises;
}

// Filter exercises by equipment availability
function filterByEquipment(exercises, equipmentList) {
  return exercises.filter(ex => {
    return ex.equipment.some(eq => equipmentList.includes(eq) || eq === 'bodyweight' || eq === 'none');
  });
}

// Select exercises for upper body workout
function selectUpperBodyExercises(exercises, experienceLevel) {
  const upper = exercises.filter(ex => {
    const muscles = ex.muscleGroups;
    return muscles.some(m => ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'upper-back', 'rear-delts'].includes(m));
  });

  const selected = [];

  // Select compound movements first
  const compounds = upper.filter(ex => ex.type === 'compound');

  // Chest exercise
  const chest = compounds.find(ex => ex.muscleGroups.includes('chest'));
  if (chest) selected.push(chest);

  // Back exercise
  const back = compounds.find(ex => ex.muscleGroups.includes('back'));
  if (back) selected.push(back);

  // Shoulder exercise
  const shoulder = compounds.find(ex => ex.muscleGroups.includes('shoulders'));
  if (shoulder) selected.push(shoulder);

  // Arms - biceps
  const biceps = upper.find(ex => ex.muscleGroups.includes('biceps'));
  if (biceps) selected.push(biceps);

  // Arms - triceps
  const triceps = upper.find(ex => ex.muscleGroups.includes('triceps'));
  if (triceps) selected.push(triceps);

  return selected.filter(Boolean);
}

// Select exercises for lower body workout
function selectLowerBodyExercises(exercises, experienceLevel) {
  const lower = exercises.filter(ex => {
    const muscles = ex.muscleGroups;
    return muscles.some(m => ['quads', 'hamstrings', 'glutes', 'calves'].includes(m));
  });

  const selected = [];

  // Main compound - squat variation
  const squat = lower.find(ex =>
    ex.muscleGroups.includes('quads') && ex.type === 'compound' && ex.name.toLowerCase().includes('squat')
  );
  if (squat) selected.push(squat);

  // Hip hinge - deadlift variation
  const deadlift = lower.find(ex =>
    ex.muscleGroups.includes('hamstrings') && (ex.name.toLowerCase().includes('deadlift') || ex.name.toLowerCase().includes('hip'))
  );
  if (deadlift) selected.push(deadlift);

  // Unilateral movement
  const unilateral = lower.find(ex =>
    ex.type === 'compound' && (ex.name.toLowerCase().includes('lunge') || ex.name.toLowerCase().includes('split'))
  );
  if (unilateral) selected.push(unilateral);

  // Hamstring isolation
  const hamstring = lower.find(ex => ex.muscleGroups.includes('hamstrings') && ex.type === 'isolation');
  if (hamstring) selected.push(hamstring);

  // Calf exercise
  const calf = lower.find(ex => ex.muscleGroups.includes('calves'));
  if (calf) selected.push(calf);

  return selected.filter(Boolean);
}

// Select full body exercises
function selectFullBodyExercises(exercises, experienceLevel) {
  const selected = [];

  // Upper compound
  const upperCompound = exercises.find(ex =>
    ex.type === 'compound' && ex.muscleGroups.some(m => ['chest', 'back', 'shoulders'].includes(m))
  );
  if (upperCompound) selected.push(upperCompound);

  // Lower compound
  const lowerCompound = exercises.find(ex =>
    ex.type === 'compound' && ex.muscleGroups.some(m => ['quads', 'hamstrings', 'glutes'].includes(m))
  );
  if (lowerCompound) selected.push(lowerCompound);

  // Pull exercise
  const pull = exercises.find(ex =>
    ex.type === 'compound' && ex.muscleGroups.includes('back')
  );
  if (pull) selected.push(pull);

  // Core
  const core = exercises.find(ex => ex.muscleGroups.includes('core') || ex.muscleGroups.includes('abs'));
  if (core) selected.push(core);

  return selected.filter(Boolean);
}

// Select cardio exercises
function selectCardioExercises(exercises, cardioType = 'any') {
  const cardio = exercises.filter(ex => ex.category === 'cardio');

  if (cardio.length === 0) return [];

  // Return variety of cardio
  return cardio.slice(0, 3);
}

// Assign sets, reps, and intensity based on goal and experience
function assignVolume(exercise, goal, experienceLevel) {
  const isCardio = exercise.category === 'cardio';

  if (isCardio) {
    // Cardio: assign time/distance
    const cardioVolumes = {
      'strength': { duration: '15 min', intensity: 'easy' },
      'muscle-building': { duration: '20 min', intensity: 'easy' },
      'endurance': { duration: '30-45 min', intensity: 'moderate' },
      'weight-loss': { duration: '30 min', intensity: 'moderate' },
      'general-fitness': { duration: '20-25 min', intensity: 'easy' }
    };

    return cardioVolumes[goal] || cardioVolumes['general-fitness'];
  }

  // Strength exercises
  const volumeSchemes = {
    'strength': {
      compound: { sets: 4, reps: '4-6', rest: '3 min' },
      isolation: { sets: 3, reps: '8-10', rest: '2 min' }
    },
    'muscle-building': {
      compound: { sets: 4, reps: '6-10', rest: '2 min' },
      isolation: { sets: 3, reps: '10-12', rest: '90 sec' }
    },
    'endurance': {
      compound: { sets: 3, reps: '12-15', rest: '60 sec' },
      isolation: { sets: 2, reps: '15-20', rest: '45 sec' }
    },
    'weight-loss': {
      compound: { sets: 3, reps: '10-12', rest: '60 sec' },
      isolation: { sets: 2, reps: '12-15', rest: '45 sec' }
    },
    'general-fitness': {
      compound: { sets: 3, reps: '8-12', rest: '90 sec' },
      isolation: { sets: 3, reps: '10-15', rest: '60 sec' }
    }
  };

  const scheme = volumeSchemes[goal] || volumeSchemes['general-fitness'];
  const isCompound = exercise.type === 'compound';

  return isCompound ? scheme.compound : scheme.isolation;
}

// Generate weekly plan
exports.generatePlan = async (req, res) => {
  try {
    const {
      userId,
      daysPerWeek,
      sessionLength,
      goal,
      strengthCardioRatio,
      experienceLevel,
      equipment
    } = req.body;

    // Validate inputs
    if (!userId || !daysPerWeek || !goal || !equipment) {
      return res.status(400).json({
        error: 'Missing required fields: userId, daysPerWeek, goal, equipment'
      });
    }

    // Load exercises
    const allExercises = await loadUserExercises(userId);
    const availableExercises = filterByEquipment(allExercises, equipment);

    if (availableExercises.length < 10) {
      return res.status(400).json({
        error: 'Not enough exercises available for your equipment. Please add more exercises or select different equipment.'
      });
    }

    // Separate strength and cardio exercises
    const strengthExercises = availableExercises.filter(ex => ex.category === 'strength');
    const cardioExercises = availableExercises.filter(ex => ex.category === 'cardio');

    // Determine split type based on days per week
    let splitType;
    if (daysPerWeek <= 3) splitType = 'full-body';
    else if (daysPerWeek === 4) splitType = 'upper-lower';
    else splitType = 'upper-lower'; // Could expand to PPL for 6 days

    // Generate weekly schedule
    const weekSchedule = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Helper to create rest day
    const createRestDay = (day) => ({
      day,
      type: 'rest',
      exercises: []
    });

    // Generate workouts based on split and days per week
    if (splitType === 'full-body') {
      // Full body 2-3x per week
      const workoutDays = daysPerWeek === 2 ? [0, 3] : [0, 2, 4]; // Mon/Thu or Mon/Wed/Fri

      for (let i = 0; i < 7; i++) {
        if (workoutDays.includes(i)) {
          const exercises = selectFullBodyExercises(strengthExercises, experienceLevel);

          // Add cardio based on ratio
          if (strengthCardioRatio !== 'heavy-strength' && cardioExercises.length > 0) {
            const cardio = cardioExercises[i % cardioExercises.length];
            exercises.push(cardio);
          }

          const exercisesWithVolume = exercises.map(ex => ({
            ...ex,
            volume: assignVolume(ex, goal, experienceLevel)
          }));

          weekSchedule.push({
            day: days[i],
            type: 'full-body',
            exercises: exercisesWithVolume
          });
        } else {
          weekSchedule.push(createRestDay(days[i]));
        }
      }
    }

    if (splitType === 'upper-lower') {
      // Upper/Lower split
      const schedule4Day = [
        { day: 0, type: 'upper' },
        { day: 1, type: 'lower' },
        { day: 3, type: 'upper' },
        { day: 4, type: 'lower' }
      ];

      const schedule5Day = [
        { day: 0, type: 'upper' },
        { day: 1, type: 'lower' },
        { day: 2, type: 'cardio' },
        { day: 4, type: 'upper' },
        { day: 5, type: 'lower' }
      ];

      const schedule = daysPerWeek === 4 ? schedule4Day : schedule5Day;

      for (let i = 0; i < 7; i++) {
        const workout = schedule.find(s => s.day === i);

        if (workout) {
          let exercises = [];

          if (workout.type === 'upper') {
            exercises = selectUpperBodyExercises(strengthExercises, experienceLevel);

            // Add short cardio if balanced ratio
            if (strengthCardioRatio === 'balanced' && cardioExercises.length > 0) {
              const cardio = cardioExercises[0];
              exercises.push(cardio);
            }
          } else if (workout.type === 'lower') {
            exercises = selectLowerBodyExercises(strengthExercises, experienceLevel);
          } else if (workout.type === 'cardio') {
            exercises = selectCardioExercises(cardioExercises);
          }

          const exercisesWithVolume = exercises.map(ex => ({
            ...ex,
            volume: assignVolume(ex, goal, experienceLevel)
          }));

          weekSchedule.push({
            day: days[i],
            type: workout.type,
            exercises: exercisesWithVolume
          });
        } else {
          weekSchedule.push(createRestDay(days[i]));
        }
      }
    }

    // Create plan object
    const plan = {
      id: `plan-${uuidv4()}`,
      userId,
      createdAt: new Date().toISOString(),
      config: {
        daysPerWeek,
        sessionLength,
        goal,
        strengthCardioRatio,
        experienceLevel,
        equipment
      },
      splitType,
      weekSchedule,
      duration: '12 weeks',
      currentWeek: 1
    };

    // Save plan
    const plansData = await fs.readFile(PLANS_PATH, 'utf8');
    const plans = JSON.parse(plansData);
    plans.plans.push(plan);
    await fs.writeFile(PLANS_PATH, JSON.stringify(plans, null, 2));

    res.status(201).json({
      message: 'Training plan generated successfully',
      plan
    });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({
      error: 'Failed to generate plan',
      details: error.message
    });
  }
};

// Get user's plans
exports.getUserPlans = async (req, res) => {
  try {
    const { userId } = req.params;

    const plansData = await fs.readFile(PLANS_PATH, 'utf8');
    const plans = JSON.parse(plansData);

    const userPlans = plans.plans.filter(p => p.userId === userId);

    res.json({
      plans: userPlans,
      count: userPlans.length
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

// Get specific plan
exports.getPlanById = async (req, res) => {
  try {
    const { planId } = req.params;

    const plansData = await fs.readFile(PLANS_PATH, 'utf8');
    const plans = JSON.parse(plansData);

    const plan = plans.plans.find(p => p.id === planId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
};

// Update plan
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const plansData = await fs.readFile(PLANS_PATH, 'utf8');
    const plans = JSON.parse(plansData);

    const index = plans.plans.findIndex(p => p.id === planId);

    if (index === -1) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    plans.plans[index] = {
      ...plans.plans[index],
      ...req.body,
      id: planId, // Preserve ID
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(PLANS_PATH, JSON.stringify(plans, null, 2));

    res.json({
      message: 'Plan updated successfully',
      plan: plans.plans[index]
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

// Delete plan
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const plansData = await fs.readFile(PLANS_PATH, 'utf8');
    const plans = JSON.parse(plansData);

    const initialLength = plans.plans.length;
    plans.plans = plans.plans.filter(p => p.id !== planId);

    if (plans.plans.length === initialLength) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    await fs.writeFile(PLANS_PATH, JSON.stringify(plans, null, 2));

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
};
