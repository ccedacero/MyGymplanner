const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');

// Load built-in exercise databases
const EXERCISES_DB_PATH = path.join(__dirname, '../data/exercises-database.json');
const KNOWN_EXERCISES_PATH = path.join(__dirname, '../data/known-exercises.json');
const CUSTOM_EXERCISES_PATH = path.join(__dirname, '../data/custom-exercises.json');
const USERS_PATH = path.join(__dirname, '../data/users.json');

// Initialize custom exercises file if it doesn't exist
async function initCustomExercises() {
  try {
    await fs.access(CUSTOM_EXERCISES_PATH);
  } catch {
    await fs.writeFile(CUSTOM_EXERCISES_PATH, JSON.stringify({ exercises: [] }, null, 2));
  }
}

initCustomExercises();

// Helper: Get user's exercise preference
async function getUserExercisePreference(userId) {
  if (!userId) return 'both'; // Default if no userId

  try {
    const usersData = await fs.readFile(USERS_PATH, 'utf8');
    const users = JSON.parse(usersData);
    const user = users.users.find(u => u.id === userId);

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
    const preference = await getUserExercisePreference(userId);

    // Load built-in exercises based on preference
    let exercises = await loadBuiltInExercises(preference);

    // Load custom exercises if userId provided
    if (userId) {
      const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
      const custom = JSON.parse(customData);
      const userCustom = custom.exercises.filter(ex => ex.userId === userId);
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
      const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
      const custom = JSON.parse(customData);
      exercise = custom.exercises.find(ex => ex.id === id);
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
      const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
      const custom = JSON.parse(customData);
      const userCustom = custom.exercises.filter(ex => {
        return ex.userId === userId && ex.equipment.some(eq => equipmentArray.includes(eq));
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

    // Load existing custom exercises
    const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
    const custom = JSON.parse(customData);

    // Add new exercises
    custom.exercises.push(...validExercises);

    // Save
    await fs.writeFile(CUSTOM_EXERCISES_PATH, JSON.stringify(custom, null, 2));

    res.json({
      message: 'Exercises uploaded successfully',
      count: validExercises.length,
      exercises: validExercises
    });
  } catch (error) {
    console.error('Error uploading exercises:', error);
    res.status(500).json({ error: 'Failed to upload exercises', details: error.message });
  }
};

// Add custom exercise manually
exports.addCustomExercise = async (req, res) => {
  try {
    const { name, category, muscleGroups, equipment, difficulty, type, description, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: 'name and userId are required' });
    }

    const newExercise = {
      id: `custom-${uuidv4()}`,
      name,
      category: category || 'strength',
      muscleGroups: muscleGroups || [],
      equipment: equipment || ['bodyweight'],
      difficulty: difficulty || 'beginner',
      type: type || 'compound',
      description: description || '',
      userId,
      custom: true
    };

    const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
    const custom = JSON.parse(customData);
    custom.exercises.push(newExercise);

    await fs.writeFile(CUSTOM_EXERCISES_PATH, JSON.stringify(custom, null, 2));

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
    const { userId } = req.body;

    const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
    const custom = JSON.parse(customData);

    const index = custom.exercises.findIndex(ex => ex.id === id && ex.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Exercise not found or unauthorized' });
    }

    custom.exercises[index] = {
      ...custom.exercises[index],
      ...req.body,
      id,  // Preserve ID
      userId,  // Preserve userId
      custom: true  // Preserve custom flag
    };

    await fs.writeFile(CUSTOM_EXERCISES_PATH, JSON.stringify(custom, null, 2));

    res.json({
      message: 'Exercise updated successfully',
      exercise: custom.exercises[index]
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
    const { userId } = req.query;

    const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
    const custom = JSON.parse(customData);

    const initialLength = custom.exercises.length;
    custom.exercises = custom.exercises.filter(ex => !(ex.id === id && ex.userId === userId));

    if (custom.exercises.length === initialLength) {
      return res.status(404).json({ error: 'Exercise not found or unauthorized' });
    }

    await fs.writeFile(CUSTOM_EXERCISES_PATH, JSON.stringify(custom, null, 2));

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

    const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
    const custom = JSON.parse(customData);

    const userExercises = custom.exercises.filter(ex => ex.userId === userId);

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
      const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
      const custom = JSON.parse(customData);
      originalExercise = custom.exercises.find(ex => ex.id === id);
    }

    if (!originalExercise) {
      return res.status(404).json({ error: 'Original exercise not found' });
    }

    // Get user's exercise preference
    const preference = await getUserExercisePreference(userId);

    // Load all available exercises
    let allExercises = await loadBuiltInExercises(preference);

    // Add user's custom exercises
    if (userId) {
      const customData = await fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8');
      const custom = JSON.parse(customData);
      const userCustom = custom.exercises.filter(ex => ex.userId === userId);
      allExercises = [...allExercises, ...userCustom];
    }

    // Get user's available equipment
    let userEquipment = [];
    if (equipment) {
      userEquipment = equipment.split(',').map(e => e.trim());
    } else if (userId) {
      // Load from user preferences
      try {
        const usersData = await fs.readFile(USERS_PATH, 'utf8');
        const users = JSON.parse(usersData);
        const user = users.users.find(u => u.id === userId);
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
