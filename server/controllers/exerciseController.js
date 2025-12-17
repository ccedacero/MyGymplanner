const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const User = require('../db/models/User');
const CustomExercise = require('../db/models/CustomExercise');

// Load built-in exercise databases (reference data - kept as JSON)
const EXERCISES_DB_PATH = path.join(__dirname, '../data/exercises-database.json');
const KNOWN_EXERCISES_PATH = path.join(__dirname, '../data/known-exercises.json');
const STRETCHES_DB_PATH = path.join(__dirname, '../data/stretches-database.json');

// Helper: Get user's exercise preference
function getUserExercisePreference(userId) {
  if (!userId) return 'both'; // Default if no userId

  try {
    const user = User.findById(userId);
    return user?.exercisePreference || 'both'; // Default to 'both'
  } catch (error) {
    console.error('Error reading user preference:', error);
    return 'both';
  }
}

// Helper: Load built-in exercises based on preference
async function loadBuiltInExercises(preference) {
  let exercises = [];

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

  return exercises;
}

// Get all exercises (built-in + user's custom)
exports.getAllExercises = async (req, res) => {
  try {
    const { userId, equipment } = req.query;

    // Get user's exercise preference
    const preference = getUserExercisePreference(userId);

    // Load built-in exercises based on preference
    let exercises = await loadBuiltInExercises(preference);

    // Load custom exercises if userId provided
    if (userId) {
      const userCustom = CustomExercise.findByUserId(userId);
      exercises = [...exercises, ...userCustom];
    }

    // Filter by equipment if provided
    if (equipment) {
      const equipmentArray = equipment.split(',');
      exercises = exercises.filter(ex => {
        return ex.equipment.some(eq => equipmentArray.includes(eq));
      });
    }

    res.json({
      exercises,
      metadata: {
        totalExercises: exercises.length,
        preference,
        source: preference === 'both' ? 'default + known + custom' : `${preference} + custom`
      }
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
};

// Get exercise by ID
exports.getExerciseById = async (req, res) => {
  try {
    const { id } = req.params;
    let exercise = null;

    // Check default exercises
    const builtInData = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
    const builtIn = JSON.parse(builtInData);
    exercise = builtIn.exercises.find(ex => ex.id === id);

    // If not found, check known exercises
    if (!exercise) {
      const knownData = await fs.readFile(KNOWN_EXERCISES_PATH, 'utf8');
      const known = JSON.parse(knownData);
      exercise = known.exercises.find(ex => ex.id === id);
    }

    // If not found, check custom exercises
    if (!exercise) {
      exercise = CustomExercise.findById(id);
    }

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
};

// Filter exercises by equipment
exports.filterByEquipment = async (req, res) => {
  try {
    const { equipment, userId } = req.query;

    if (!equipment) {
      return res.status(400).json({ error: 'Equipment parameter is required' });
    }

    const equipmentArray = equipment.split(',').map(e => e.trim());

    // Get user's exercise preference
    const preference = await getUserExercisePreference(userId);

    // Load built-in exercises based on preference
    const builtInExercises = await loadBuiltInExercises(preference);
    let exercises = builtInExercises.filter(ex => {
      return ex.equipment.some(eq => equipmentArray.includes(eq));
    });

    // Add user's custom exercises if userId provided
    if (userId) {
      const userCustom = CustomExercise.findByUserId(userId).filter(ex => {
        return ex.equipment.some(eq => equipmentArray.includes(eq));
      });
      exercises = [...exercises, ...userCustom];
    }

    res.json({
      exercises,
      count: exercises.length,
      preference
    });
  } catch (error) {
    console.error('Error filtering exercises:', error);
    res.status(500).json({ error: 'Failed to filter exercises' });
  }
};

// Upload custom exercises from CSV/Excel
exports.uploadCustomExercises = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    let parsedExercises = [];

    // Parse CSV
    if (fileExt === '.csv') {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const records = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      parsedExercises = records.map(record => ({
        id: `custom-${uuidv4()}`,
        name: record['Exercise Name'] || record.name,
        category: record['Category'] || record.category || 'strength',
        muscleGroups: (record['Muscle Groups'] || record.muscleGroups || '').split(',').map(m => m.trim()),
        equipment: (record['Equipment'] || record.equipment || 'bodyweight').split(',').map(e => e.trim()),
        difficulty: record['Difficulty'] || record.difficulty || 'beginner',
        type: record['Type'] || record.type || 'compound',
        description: record['Description'] || record.description || '',
        userId,
        custom: true
      }));
    }

    // Parse Excel
    else if (fileExt === '.xlsx' || fileExt === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const records = xlsx.utils.sheet_to_json(worksheet);

      parsedExercises = records.map(record => ({
        id: `custom-${uuidv4()}`,
        name: record['Exercise Name'] || record.name,
        category: record['Category'] || record.category || 'strength',
        muscleGroups: (record['Muscle Groups'] || record.muscleGroups || '').split(',').map(m => m.trim()),
        equipment: (record['Equipment'] || record.equipment || 'bodyweight').split(',').map(e => e.trim()),
        difficulty: record['Difficulty'] || record.difficulty || 'beginner',
        type: record['Type'] || record.type || 'compound',
        description: record['Description'] || record.description || '',
        userId,
        custom: true
      }));
    }

    // Clean up uploaded file
    await fs.unlink(filePath);

    // Validate parsed exercises
    const validExercises = parsedExercises.filter(ex => ex.name && ex.name.trim() !== '');

    if (validExercises.length === 0) {
      return res.status(400).json({ error: 'No valid exercises found in file' });
    }

    // Save exercises to database
    const now = new Date().toISOString();
    const savedExercises = validExercises.map(ex => {
      return CustomExercise.create({
        id: ex.id,
        userId,
        name: ex.name,
        category: ex.category,
        muscleGroups: ex.muscleGroups,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        type: ex.type,
        description: ex.description,
        videoUrl: '',
        createdAt: now,
        updatedAt: now
      });
    });

    res.json({
      message: 'Exercises uploaded successfully',
      count: savedExercises.length,
      exercises: savedExercises
    });
  } catch (error) {
    console.error('Error uploading exercises:', error);
    // SECURITY FIX: Don't expose error details to prevent information disclosure
    res.status(500).json({ error: 'Failed to upload exercises' });
  }
};

// Add custom exercise manually
exports.addCustomExercise = async (req, res) => {
  try {
    const { name, category, muscleGroups, equipment, difficulty, type, description, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: 'name and userId are required' });
    }

    const now = new Date().toISOString();
    const newExercise = CustomExercise.create({
      id: `custom-${uuidv4()}`,
      userId,
      name,
      category: category || 'strength',
      muscleGroups: muscleGroups || [],
      equipment: equipment || ['bodyweight'],
      difficulty: difficulty || 'beginner',
      type: type || 'compound',
      description: description || '',
      videoUrl: '',
      createdAt: now,
      updatedAt: now
    });

    res.status(201).json({
      message: 'Exercise added successfully',
      exercise: newExercise
    });
  } catch (error) {
    console.error('Error adding exercise:', error);
    res.status(500).json({ error: 'Failed to add exercise' });
  }
};

// Update custom exercise
exports.updateCustomExercise = async (req, res) => {
  try {
    const { id } = req.params;
    // SECURITY FIX: Get userId from JWT token, not from user input
    const userId = req.user.userId;

    const exercise = CustomExercise.findById(id);

    if (!exercise || exercise.userId !== userId) {
      return res.status(404).json({ error: 'Exercise not found or unauthorized' });
    }

    const updatedExercise = CustomExercise.update(id, req.body);

    res.json({
      message: 'Exercise updated successfully',
      exercise: updatedExercise
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({ error: 'Failed to update exercise' });
  }
};

// Delete custom exercise
exports.deleteCustomExercise = async (req, res) => {
  try {
    const { id } = req.params;
    // SECURITY FIX: Get userId from JWT token, not from query string
    const userId = req.user.userId;

    const exercise = CustomExercise.findById(id);

    if (!exercise || exercise.userId !== userId) {
      return res.status(404).json({ error: 'Exercise not found or unauthorized' });
    }

    const deleted = CustomExercise.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Exercise not found or unauthorized' });
    }

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
};

// Get user's custom exercises
exports.getUserCustomExercises = async (req, res) => {
  try {
    const { userId } = req.params;

    const userExercises = CustomExercise.findByUserId(userId);

    res.json({
      exercises: userExercises,
      count: userExercises.length
    });
  } catch (error) {
    console.error('Error fetching custom exercises:', error);
    res.status(500).json({ error: 'Failed to fetch custom exercises' });
  }
};

// Get exercise substitutes (smart alternatives based on muscle groups, equipment, etc.)
exports.getExerciseSubstitutes = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, equipment } = req.query;

    // Find the original exercise
    let originalExercise = null;

    // Check all exercise sources
    const defaultData = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
    const defaultExercises = JSON.parse(defaultData);
    originalExercise = defaultExercises.exercises.find(ex => ex.id === id);

    if (!originalExercise) {
      const knownData = await fs.readFile(KNOWN_EXERCISES_PATH, 'utf8');
      const knownExercises = JSON.parse(knownData);
      originalExercise = knownExercises.exercises.find(ex => ex.id === id);
    }

    if (!originalExercise && userId) {
      originalExercise = CustomExercise.findById(id);
    }

    if (!originalExercise) {
      return res.status(404).json({ error: 'Original exercise not found' });
    }

    // Get user's exercise preference
    const preference = getUserExercisePreference(userId);

    // Load all available exercises
    let allExercises = await loadBuiltInExercises(preference);

    // Add user's custom exercises
    if (userId) {
      const userCustom = CustomExercise.findByUserId(userId);
      allExercises = [...allExercises, ...userCustom];
    }

    // Get user's available equipment
    let userEquipment = [];
    if (equipment) {
      userEquipment = equipment.split(',').map(e => e.trim());
    } else if (userId) {
      // Load from user preferences
      try {
        const user = User.findById(userId);
        userEquipment = user?.equipment || [];
      } catch (error) {
        console.error('Error loading user equipment:', error);
      }
    }

    // Score and filter substitutes
    const substitutes = allExercises
      .filter(ex => ex.id !== id) // Exclude the original exercise
      .map(ex => {
        let score = 0;

        // Score based on muscle group overlap (most important)
        const muscleOverlap = ex.muscleGroups.filter(mg =>
          originalExercise.muscleGroups.includes(mg)
        ).length;
        score += muscleOverlap * 10;

        // Bonus for targeting the same primary muscle
        if (muscleOverlap > 0 && ex.muscleGroups[0] === originalExercise.muscleGroups[0]) {
          score += 5;
        }

        // Score based on same type (compound/isolation)
        if (ex.type === originalExercise.type) {
          score += 3;
        }

        // Score based on similar difficulty
        const difficultyLevels = { beginner: 1, intermediate: 2, advanced: 3 };
        const diffDifference = Math.abs(
          (difficultyLevels[ex.difficulty] || 2) - (difficultyLevels[originalExercise.difficulty] || 2)
        );
        score += (3 - diffDifference);

        // Score based on equipment availability
        if (userEquipment.length > 0) {
          const hasRequiredEquipment = ex.equipment.every(eq => userEquipment.includes(eq));
          if (hasRequiredEquipment) {
            score += 5;
          } else {
            score -= 10; // Penalize if equipment not available
          }
        }

        // Score based on same category (strength/cardio)
        if (ex.category === originalExercise.category) {
          score += 2;
        }

        return {
          ...ex,
          score,
          matchReasons: {
            muscleGroupsMatched: muscleOverlap,
            sameType: ex.type === originalExercise.type,
            sameDifficulty: ex.difficulty === originalExercise.difficulty,
            equipmentAvailable: userEquipment.length === 0 || ex.equipment.every(eq => userEquipment.includes(eq)),
            sameCategory: ex.category === originalExercise.category
          }
        };
      })
      .filter(ex => ex.score > 0) // Only include exercises with positive scores
      .sort((a, b) => b.score - a.score) // Sort by score (best first)
      .slice(0, 20); // Limit to top 20 substitutes

    res.json({
      originalExercise,
      substitutes,
      count: substitutes.length,
      metadata: {
        preference,
        equipmentFilter: userEquipment.length > 0 ? userEquipment : 'none'
      }
    });
  } catch (error) {
    console.error('Error fetching exercise substitutes:', error);
    res.status(500).json({ error: 'Failed to fetch exercise substitutes' });
  }
};

// Get all stretches
exports.getAllStretches = async (req, res) => {
  try {
    const { targetArea, difficulty, type } = req.query;

    // Load stretches database
    const stretchesData = await fs.readFile(STRETCHES_DB_PATH, 'utf8');
    const stretchesDb = JSON.parse(stretchesData);
    let stretches = stretchesDb.stretches || [];

    // Filter by target area if provided
    if (targetArea) {
      stretches = stretches.filter(stretch =>
        stretch.targetAreas.some(area => area.toLowerCase().includes(targetArea.toLowerCase()))
      );
    }

    // Filter by difficulty if provided
    if (difficulty) {
      stretches = stretches.filter(stretch => stretch.difficulty === difficulty);
    }

    // Filter by type (static/dynamic) if provided
    if (type) {
      stretches = stretches.filter(stretch => stretch.type === type);
    }

    res.json({
      stretches,
      metadata: {
        totalStretches: stretches.length,
        filters: {
          targetArea: targetArea || 'all',
          difficulty: difficulty || 'all',
          type: type || 'all'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stretches:', error);
    res.status(500).json({ error: 'Failed to fetch stretches' });
  }
};

// Get stretch by ID
exports.getStretchById = async (req, res) => {
  try {
    const { id } = req.params;

    const stretchesData = await fs.readFile(STRETCHES_DB_PATH, 'utf8');
    const stretchesDb = JSON.parse(stretchesData);
    const stretch = stretchesDb.stretches.find(s => s.id === id);

    if (!stretch) {
      return res.status(404).json({ error: 'Stretch not found' });
    }

    res.json(stretch);
  } catch (error) {
    console.error('Error fetching stretch:', error);
    res.status(500).json({ error: 'Failed to fetch stretch' });
  }
};
