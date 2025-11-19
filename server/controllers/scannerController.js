const fs = require('fs').promises;
const path = require('path');
const { identifyEquipmentFromImage, findExerciseVideo } = require('../services/aiWorkoutGenerator');

// Load exercise databases
const EXERCISES_DB_PATH = path.join(__dirname, '../data/exercises-database.json');
const KNOWN_EXERCISES_PATH = path.join(__dirname, '../data/known-exercises.json');
const CUSTOM_EXERCISES_PATH = path.join(__dirname, '../data/custom-exercises.json');

/**
 * Load all exercises from databases
 */
async function loadAllExercises() {
  try {
    const [defaultData, knownData, customData] = await Promise.all([
      fs.readFile(EXERCISES_DB_PATH, 'utf8'),
      fs.readFile(KNOWN_EXERCISES_PATH, 'utf8'),
      fs.readFile(CUSTOM_EXERCISES_PATH, 'utf8')
    ]);

    const defaultExercises = JSON.parse(defaultData).exercises || [];
    const knownExercises = JSON.parse(knownData).exercises || [];
    const customExercises = JSON.parse(customData).exercises || [];

    return [...defaultExercises, ...knownExercises, ...customExercises];
  } catch (error) {
    console.error('Error loading exercises:', error);
    return [];
  }
}

/**
 * Find exact or fuzzy match in exercise database
 */
function findExerciseMatch(exerciseName, allExercises) {
  const nameLower = exerciseName.toLowerCase();

  // Try exact match first
  let match = allExercises.find(ex => ex.name.toLowerCase() === nameLower);
  if (match) return { ...match, matchType: 'exact' };

  // Try partial match (e.g., "Lat Pulldown" matches "Wide Grip Lat Pulldown")
  match = allExercises.find(ex =>
    ex.name.toLowerCase().includes(nameLower) || nameLower.includes(ex.name.toLowerCase())
  );
  if (match) return { ...match, matchType: 'partial' };

  // Try fuzzy match on key words
  const nameWords = nameLower.split(' ');
  match = allExercises.find(ex => {
    const exWords = ex.name.toLowerCase().split(' ');
    const commonWords = nameWords.filter(word => exWords.includes(word));
    return commonWords.length >= 2; // At least 2 words in common
  });
  if (match) return { ...match, matchType: 'fuzzy' };

  return null;
}

/**
 * Match AI-identified exercises to database exercises
 */
async function matchExercises(aiResults) {
  const allExercises = await loadAllExercises();
  const enrichedExercises = [];

  for (const aiExercise of aiResults.exercises) {
    const dbMatch = findExerciseMatch(aiExercise.name, allExercises);

    if (dbMatch) {
      // Found in database - use database exercise with AI enhancements
      enrichedExercises.push({
        ...dbMatch,
        aiEnhanced: {
          recommendedVolume: aiExercise.recommendedVolume,
          matchType: dbMatch.matchType,
          originalAIName: aiExercise.name
        },
        source: 'database'
      });
    } else {
      // Not in database - create new exercise from AI data
      enrichedExercises.push({
        id: `ai-${Date.now()}-${enrichedExercises.length}`,
        name: aiExercise.name,
        muscleGroups: aiExercise.muscleGroups || [],
        difficulty: aiExercise.difficulty || 'intermediate',
        equipment: [aiResults.equipmentType],
        category: 'strength',
        type: aiExercise.type || 'compound',
        description: `Exercise for ${aiResults.equipmentType}`,
        videoUrl: null, // Will be found later
        aiEnhanced: {
          recommendedVolume: aiExercise.recommendedVolume,
          matchType: 'ai-generated'
        },
        source: 'ai-generated',
        needsVideo: true
      });
    }
  }

  return enrichedExercises;
}

/**
 * Enrich exercises with YouTube video links
 */
async function enrichWithVideos(exercises) {
  const videoPromises = exercises.map(async (exercise) => {
    if (!exercise.videoUrl || exercise.needsVideo) {
      try {
        const videoUrl = await findExerciseVideo(exercise.name);
        return { ...exercise, videoUrl, needsVideo: false };
      } catch (error) {
        console.error(`Failed to find video for ${exercise.name}:`, error);
        return exercise;
      }
    }
    return exercise;
  });

  return Promise.all(videoPromises);
}

/**
 * POST /api/scanner/identify
 * Identify equipment from uploaded image
 */
async function identifyEquipment(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the uploaded image file
    const imageBuffer = await fs.readFile(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');

    // Determine media type from file mimetype
    const mediaType = req.file.mimetype || 'image/jpeg';

    // Identify equipment using AI vision
    const aiResults = await identifyEquipmentFromImage(imageBase64, mediaType);

    // Match exercises to database
    let exercises = await matchExercises(aiResults);

    // Find videos for exercises (run in background for faster response)
    // We'll do this async and return results immediately
    enrichWithVideos(exercises).then(enrichedExercises => {
      // Videos found - could cache or store if needed
      console.log(`📹 Videos found for ${enrichedExercises.filter(e => e.videoUrl).length}/${enrichedExercises.length} exercises`);
    });

    // Clean up uploaded file after processing
    fs.unlink(req.file.path).catch(err =>
      console.error('Failed to delete uploaded file:', err)
    );

    // Return results
    res.json({
      equipmentType: aiResults.equipmentType,
      confidence: aiResults.confidence,
      brand: aiResults.brand,
      exercises: exercises,
      formTips: aiResults.formTips || [],
      commonMistakes: aiResults.commonMistakes || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Equipment identification error:', error);

    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path).catch(err =>
        console.error('Failed to delete uploaded file:', err)
      );
    }

    res.status(500).json({
      error: 'Failed to identify equipment',
      message: error.message
    });
  }
}

/**
 * POST /api/scanner/find-video
 * Find YouTube video for a specific exercise
 */
async function findVideoForExercise(req, res) {
  try {
    const { exerciseName } = req.body;

    if (!exerciseName) {
      return res.status(400).json({ error: 'Exercise name is required' });
    }

    const videoUrl = await findExerciseVideo(exerciseName);

    res.json({
      exerciseName,
      videoUrl,
      found: !!videoUrl
    });

  } catch (error) {
    console.error('Video finding error:', error);
    res.status(500).json({
      error: 'Failed to find video',
      message: error.message
    });
  }
}

module.exports = {
  identifyEquipment,
  findVideoForExercise
};
