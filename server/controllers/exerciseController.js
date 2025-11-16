const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');

// Load built-in exercise database
const EXERCISES_DB_PATH = path.join(__dirname, '../data/exercises-database.json');
const CUSTOM_EXERCISES_PATH = path.join(__dirname, '../data/custom-exercises.json');

// Initialize custom exercises file if it doesn't exist
async function initCustomExercises() {
  try {
    await fs.access(CUSTOM_EXERCISES_PATH);
  } catch {
    await fs.writeFile(CUSTOM_EXERCISES_PATH, JSON.stringify({ exercises: [] }, null, 2));
  }
}

initCustomExercises();

// Get all exercises (built-in + user's custom)
exports.getAllExercises = async (req, res) => {
  try {
    const { userId, equipment } = req.query;

    // Load built-in exercises
    const builtInData = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
    const builtIn = JSON.parse(builtInData);
    let exercises = [...builtIn.exercises];

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
      metadata: builtIn.metadata
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

    // Check built-in exercises
    const builtInData = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
    const builtIn = JSON.parse(builtInData);
    let exercise = builtIn.exercises.find(ex => ex.id === id);

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

    const builtInData = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
    const builtIn = JSON.parse(builtInData);
    let exercises = builtIn.exercises.filter(ex => {
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

    res.json({ exercises, count: exercises.length });
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
