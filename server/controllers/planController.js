const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generateAIWorkoutPlan } = require('../services/aiWorkoutGenerator');
const Plan = require('../db/models/Plan');
const User = require('../db/models/User');
const CustomExercise = require('../db/models/CustomExercise');

const EXERCISES_DB_PATH = path.join(__dirname, '../data/exercises-database.json');
const KNOWN_EXERCISES_PATH = path.join(__dirname, '../data/known-exercises.json');

// Helper: Get user's exercise preference
function getUserExercisePreference(userId) {
  if (!userId) return 'both';

  try {
    const user = User.findById(userId);
    return user?.exercisePreference || 'both';
  } catch (error) {
    return 'both';
  }
}

// Load all available exercises for a user
async function loadUserExercises(userId) {
  let exercises = [];

  // Get user's exercise preference
  const preference = getUserExercisePreference(userId);

  // Load built-in exercises based on preference
  if (preference === 'default' || preference === 'both') {
    const defaultData = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
    const defaultExercises = JSON.parse(defaultData);
    exercises = [...exercises, ...defaultExercises.exercises];
  }

  if (preference === 'known' || preference === 'both') {
    const knownData = await fs.readFile(KNOWN_EXERCISES_PATH, 'utf8');
    const knownExercises = JSON.parse(knownData);
    exercises = [...exercises, ...knownExercises.exercises];
  }

  // Load custom exercises if userId provided
  if (userId) {
    try {
      const userCustom = CustomExercise.findByUserId(userId);
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

// Helper: Randomly select from array (for exercise variety)
function randomSelect(array) {
  if (!array || array.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

// Select exercises for upper body workout
function selectUpperBodyExercises(exercises, experienceLevel) {
  const upper = exercises.filter(ex => {
    const muscles = ex.muscleGroups;
    return muscles.some(m => ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'upper-back', 'rear-delts'].includes(m));
  });

  const selected = [];

  // Select compound movements first (prioritize based on research)
  const compounds = upper.filter(ex => ex.type === 'compound');

  // 1. Horizontal Push - Bench Press (research-backed fundamental)
  const chestOptions = compounds.filter(ex =>
    ex.muscleGroups.includes('chest') &&
    (ex.name.toLowerCase().includes('bench press') || ex.name.toLowerCase().includes('push'))
  );
  const chest = randomSelect(chestOptions);
  if (chest) selected.push(chest);

  // 2. Vertical Pull - Pull-ups/Chin-ups (critical per r/Fitness wiki)
  const pullupOptions = compounds.filter(ex =>
    ex.name.toLowerCase().includes('pull-up') ||
    ex.name.toLowerCase().includes('chin-up')
  );
  const pullup = randomSelect(pullupOptions);
  if (pullup) {
    selected.push(pullup);
  } else {
    // Fallback to lat pulldown for beginners
    const latPulldownOptions = upper.filter(ex => ex.name.toLowerCase().includes('lat pulldown'));
    const latPulldown = randomSelect(latPulldownOptions);
    if (latPulldown) selected.push(latPulldown);
  }

  // 3. Horizontal Pull - Rows (research-backed fundamental)
  const rowOptions = compounds.filter(ex =>
    ex.muscleGroups.includes('back') &&
    ex.name.toLowerCase().includes('row')
  );
  const row = randomSelect(rowOptions);
  if (row) selected.push(row);

  // 4. Vertical Push - Overhead Press (research-backed fundamental)
  const shoulderOptions = compounds.filter(ex =>
    ex.muscleGroups.includes('shoulders') &&
    (ex.name.toLowerCase().includes('overhead press') || ex.name.toLowerCase().includes('press'))
  );
  const shoulder = randomSelect(shoulderOptions);
  if (shoulder) selected.push(shoulder);

  // 5. Arms - only for intermediate/advanced (beginners get enough from compounds)
  if (experienceLevel !== 'beginner') {
    const bicepsOptions = upper.filter(ex => ex.muscleGroups.includes('biceps') && ex.type === 'isolation');
    const biceps = randomSelect(bicepsOptions);
    if (biceps) selected.push(biceps);
  }

  // 6. Core work to ensure minimum 4-5 exercises per session
  const coreOptions = exercises.filter(ex =>
    ex.muscleGroups.includes('abs') || ex.muscleGroups.includes('core')
  );
  const core = randomSelect(coreOptions);
  if (core && selected.length < 5) {
    selected.push(core);
  }

  // Ensure minimum 4 exercises (add accessory if needed)
  if (selected.length < 4) {
    const remainingOptions = upper.filter(ex => !selected.includes(ex));
    const extra = randomSelect(remainingOptions);
    if (extra) selected.push(extra);
  }

  return selected.filter(Boolean);
}

// Select exercises for lower body workout
function selectLowerBodyExercises(exercises, experienceLevel) {
  const lower = exercises.filter(ex => {
    const muscles = ex.muscleGroups;
    return muscles.some(m => ['quads', 'hamstrings', 'glutes', 'calves'].includes(m));
  });

  const selected = [];

  // 1. Knee Dominant - Squat variation (research-backed fundamental)
  // Prioritize barbell squat for intermediate/advanced, goblet for beginners
  let squatOptions;
  if (experienceLevel === 'beginner') {
    squatOptions = lower.filter(ex =>
      ex.type === 'compound' &&
      (ex.name.toLowerCase().includes('goblet squat') || ex.name.toLowerCase().includes('bodyweight squat'))
    );
  }
  if (!squatOptions || squatOptions.length === 0) {
    squatOptions = lower.filter(ex =>
      ex.muscleGroups.includes('quads') && ex.type === 'compound' && ex.name.toLowerCase().includes('squat')
    );
  }
  const squat = randomSelect(squatOptions);
  if (squat) selected.push(squat);

  // 2. Hip Hinge - Deadlift variation (research-backed fundamental)
  // Romanian deadlift for beginners is safer
  let deadliftOptions;
  if (experienceLevel === 'beginner') {
    deadliftOptions = lower.filter(ex => ex.name.toLowerCase().includes('romanian deadlift'));
  }
  if (!deadliftOptions || deadliftOptions.length === 0) {
    deadliftOptions = lower.filter(ex =>
      ex.muscleGroups.includes('hamstrings') && ex.name.toLowerCase().includes('deadlift')
    );
  }
  const deadlift = randomSelect(deadliftOptions);
  if (deadlift) selected.push(deadlift);

  // 3. Unilateral movement (research shows important for balance and injury prevention)
  const unilateralOptions = lower.filter(ex =>
    ex.type === 'compound' &&
    (ex.name.toLowerCase().includes('lunge') || ex.name.toLowerCase().includes('split squat'))
  );
  const unilateral = randomSelect(unilateralOptions);
  if (unilateral) selected.push(unilateral);

  // 4. Glute isolation (research shows hip thrusts are highly effective)
  const gluteOptions = lower.filter(ex =>
    ex.muscleGroups.includes('glutes') &&
    (ex.name.toLowerCase().includes('hip thrust') || ex.name.toLowerCase().includes('glute bridge'))
  );
  const glute = randomSelect(gluteOptions);
  if (glute) selected.push(glute);

  // 5. Calves - only for intermediate/advanced
  if (experienceLevel !== 'beginner') {
    const calfOptions = lower.filter(ex => ex.muscleGroups.includes('calves'));
    const calf = randomSelect(calfOptions);
    if (calf) selected.push(calf);
  }

  // 6. Core/abs work to ensure minimum 4-5 exercises per session
  const coreOptions = exercises.filter(ex =>
    ex.muscleGroups.includes('abs') || ex.muscleGroups.includes('core')
  );
  const core = randomSelect(coreOptions);
  if (core && selected.length < 5) {
    selected.push(core);
  }

  // Ensure minimum 4 exercises (add accessory if needed)
  if (selected.length < 4) {
    const remainingOptions = lower.filter(ex => !selected.includes(ex));
    const extra = randomSelect(remainingOptions);
    if (extra) selected.push(extra);
  }

  return selected.filter(Boolean);
}

// Select full body exercises (following StrongLifts/Starting Strength principles)
function selectFullBodyExercises(exercises, experienceLevel) {
  const selected = [];

  // 1. Squat (barbell for intermediate+, goblet for beginners)
  let squatOptions;
  if (experienceLevel === 'beginner') {
    squatOptions = exercises.filter(ex =>
      ex.name.toLowerCase().includes('goblet squat') || ex.name.toLowerCase().includes('bodyweight squat')
    );
  }
  if (!squatOptions || squatOptions.length === 0) {
    squatOptions = exercises.filter(ex =>
      ex.type === 'compound' && ex.name.toLowerCase().includes('squat')
    );
  }
  const squat = randomSelect(squatOptions);
  if (squat) selected.push(squat);

  // 2. Bench Press or Push variation
  const benchOptions = exercises.filter(ex =>
    ex.muscleGroups.includes('chest') && ex.name.toLowerCase().includes('bench press')
  );
  const bench = randomSelect(benchOptions);
  if (bench) selected.push(bench);

  // 3. Deadlift or Hip Hinge
  let deadliftOptions;
  if (experienceLevel === 'beginner') {
    deadliftOptions = exercises.filter(ex => ex.name.toLowerCase().includes('romanian deadlift'));
  }
  if (!deadliftOptions || deadliftOptions.length === 0) {
    deadliftOptions = exercises.filter(ex => ex.name.toLowerCase().includes('deadlift'));
  }
  const deadlift = randomSelect(deadliftOptions);
  if (deadlift) selected.push(deadlift);

  // 4. Row (horizontal pull)
  const rowOptions = exercises.filter(ex =>
    ex.type === 'compound' && ex.muscleGroups.includes('back') && ex.name.toLowerCase().includes('row')
  );
  const row = randomSelect(rowOptions);
  if (row) selected.push(row);

  // 5. Overhead Press (vertical push)
  const pressOptions = exercises.filter(ex =>
    ex.muscleGroups.includes('shoulders') && ex.name.toLowerCase().includes('overhead press')
  );
  const press = randomSelect(pressOptions);
  if (press) selected.push(press);

  return selected.filter(Boolean);
}

// Select cardio exercises with variety
function selectCardioExercises(exercises, cardioType = 'any') {
  const cardio = exercises.filter(ex => ex.category === 'cardio');

  if (cardio.length === 0) return [];

  // Shuffle and return 4-5 random cardio exercises for variety and adequate volume
  const shuffled = [...cardio].sort(() => Math.random() - 0.5);
  const count = Math.min(5, Math.max(4, cardio.length)); // 4-5 exercises, or all available if less
  return shuffled.slice(0, count);
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

  // Strength exercises - volumes based on research and experience level
  const volumeSchemes = {
    'strength': {
      beginner: {
        compound: { sets: 3, reps: '5', rest: '3 min' }, // Linear progression like Starting Strength
        isolation: { sets: 2, reps: '8-10', rest: '90 sec' }
      },
      intermediate: {
        compound: { sets: 4, reps: '4-6', rest: '3 min' },
        isolation: { sets: 3, reps: '8-10', rest: '2 min' }
      },
      advanced: {
        compound: { sets: 5, reps: '3-5', rest: '3-5 min' },
        isolation: { sets: 3, reps: '6-8', rest: '2 min' }
      }
    },
    'muscle-building': {
      beginner: {
        compound: { sets: 3, reps: '8-12', rest: '90 sec' }, // Hypertrophy range
        isolation: { sets: 2, reps: '10-12', rest: '60 sec' }
      },
      intermediate: {
        compound: { sets: 4, reps: '6-10', rest: '2 min' },
        isolation: { sets: 3, reps: '10-12', rest: '90 sec' }
      },
      advanced: {
        compound: { sets: 5, reps: '6-12', rest: '2 min' },
        isolation: { sets: 4, reps: '10-15', rest: '90 sec' }
      }
    },
    'endurance': {
      beginner: {
        compound: { sets: 2, reps: '12-15', rest: '60 sec' },
        isolation: { sets: 2, reps: '15-20', rest: '45 sec' }
      },
      intermediate: {
        compound: { sets: 3, reps: '12-15', rest: '60 sec' },
        isolation: { sets: 3, reps: '15-20', rest: '45 sec' }
      },
      advanced: {
        compound: { sets: 4, reps: '15-20', rest: '45 sec' },
        isolation: { sets: 3, reps: '20-25', rest: '30 sec' }
      }
    },
    'weight-loss': {
      beginner: {
        compound: { sets: 3, reps: '10-12', rest: '60 sec' },
        isolation: { sets: 2, reps: '12-15', rest: '45 sec' }
      },
      intermediate: {
        compound: { sets: 3, reps: '10-12', rest: '60 sec' },
        isolation: { sets: 3, reps: '12-15', rest: '45 sec' }
      },
      advanced: {
        compound: { sets: 4, reps: '12-15', rest: '60 sec' },
        isolation: { sets: 3, reps: '15-20', rest: '45 sec' }
      }
    },
    'general-fitness': {
      beginner: {
        compound: { sets: 3, reps: '8-12', rest: '90 sec' }, // Most versatile
        isolation: { sets: 2, reps: '10-15', rest: '60 sec' }
      },
      intermediate: {
        compound: { sets: 3, reps: '8-12', rest: '90 sec' },
        isolation: { sets: 3, reps: '10-15', rest: '60 sec' }
      },
      advanced: {
        compound: { sets: 4, reps: '8-12', rest: '90 sec' },
        isolation: { sets: 3, reps: '12-15', rest: '60 sec' }
      }
    }
  };

  const goalScheme = volumeSchemes[goal] || volumeSchemes['general-fitness'];
  const levelScheme = goalScheme[experienceLevel] || goalScheme['beginner'];
  const isCompound = exercise.type === 'compound';

  return isCompound ? levelScheme.compound : levelScheme.isolation;
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
      equipment,
      useAI // New option to force AI generation
    } = req.body;

    // Validate inputs
    if (!userId || !daysPerWeek || !goal || !equipment) {
      return res.status(400).json({
        error: 'Missing required fields: userId, daysPerWeek, goal, equipment'
      });
    }

    // Use AI generation if requested or as fallback
    if (useAI) {
      try {
        const aiPlan = await generateAIWorkoutPlan(req.body);

        // Save AI-generated plan (ensure it has all required fields)
        const savedPlan = Plan.create({
          ...aiPlan,
          updatedAt: aiPlan.updatedAt || aiPlan.createdAt
        });

        return res.status(201).json({
          message: 'AI-powered training plan generated successfully',
          plan: savedPlan,
          aiGenerated: true
        });
      } catch (aiError) {
        console.error('AI generation failed, falling back to standard generation:', aiError);
        // Continue with standard generation below
      }
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

      const schedule6Day = [
        { day: 0, type: 'upper' },
        { day: 1, type: 'lower' },
        { day: 2, type: 'cardio' },
        { day: 3, type: 'upper' },
        { day: 4, type: 'lower' },
        { day: 5, type: 'cardio' }
      ];

      const schedule7Day = [
        { day: 0, type: 'upper' },
        { day: 1, type: 'lower' },
        { day: 2, type: 'cardio' },
        { day: 3, type: 'rest' },
        { day: 4, type: 'upper' },
        { day: 5, type: 'lower' },
        { day: 6, type: 'rest' }
      ];

      let schedule;
      if (daysPerWeek === 4) schedule = schedule4Day;
      else if (daysPerWeek === 5) schedule = schedule5Day;
      else if (daysPerWeek === 6) schedule = schedule6Day;
      else if (daysPerWeek === 7) schedule = schedule7Day;
      else schedule = schedule5Day; // default

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
    const now = new Date().toISOString();
    const plan = Plan.create({
      id: `plan-${uuidv4()}`,
      userId,
      createdAt: now,
      updatedAt: now,
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
    });

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

    // Authorization: Verify user can only access their own plans
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own plans' });
    }

    const userPlans = Plan.findByUserId(userId);

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

    const plan = Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Authorization: Verify user owns this plan
    if (plan.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own plans' });
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

    const plan = Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Authorization: Verify user owns this plan
    if (plan.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only modify your own plans' });
    }

    const updatedPlan = Plan.update(planId, req.body);

    res.json({
      message: 'Plan updated successfully',
      plan: updatedPlan
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

    // First check if plan exists and user owns it
    const plan = Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Authorization: Verify user owns this plan
    if (plan.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own plans' });
    }

    const deleted = Plan.delete(planId);

    if (!deleted) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
};
