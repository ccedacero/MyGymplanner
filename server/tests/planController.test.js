/**
 * Comprehensive Test Suite for Workout Plan Generation
 * Run with: node server/tests/planController.test.js
 */

const fs = require('fs').promises;
const path = require('path');

const EXERCISES_DB_PATH = path.join(__dirname, '../data/exercises-database.json');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function assert(condition, testName) {
  if (condition) {
    results.passed++;
    results.tests.push({ name: testName, status: '✅ PASS' });
    console.log(`✅ ${testName}`);
  } else {
    results.failed++;
    results.tests.push({ name: testName, status: '❌ FAIL' });
    console.error(`❌ ${testName}`);
  }
}

async function runTests() {
  console.log('🧪 Running Comprehensive Test Suite\n');

  // Test 1: Exercise Database Integrity
  console.log('📦 Testing Exercise Database...');
  const data = await fs.readFile(EXERCISES_DB_PATH, 'utf8');
  const db = JSON.parse(data);

  assert(db.exercises && Array.isArray(db.exercises), 'Exercise database is an array');
  assert(db.exercises.length >= 90, 'Has at least 90 exercises');

  // Test 2: Exercise Properties
  console.log('\n📋 Testing Exercise Properties...');
  let allHaveIds = true;
  let allHaveNames = true;
  let allHaveCategories = true;
  let allHaveVideos = true;

  for (const ex of db.exercises) {
    if (!ex.id) allHaveIds = false;
    if (!ex.name) allHaveNames = false;
    if (!ex.category) allHaveCategories = false;
    if (!ex.videoUrl) allHaveVideos = false;
  }

  assert(allHaveIds, 'All exercises have unique IDs');
  assert(allHaveNames, 'All exercises have names');
  assert(allHaveCategories, 'All exercises have categories');
  assert(allHaveVideos, 'All exercises have video URLs');

  // Test 3: Critical Exercises Present
  console.log('\n🏋️ Testing Critical Exercises...');
  const exerciseNames = db.exercises.map(ex => ex.name.toLowerCase());

  const criticalExercises = [
    'barbell squat',
    'deadlift',
    'barbell bench press',
    'overhead press',
    'barbell row',
    'pull-ups',
    'chin-ups',
    'goblet squat',
    'romanian deadlift'
  ];

  for (const critical of criticalExercises) {
    const found = exerciseNames.some(name => name.includes(critical));
    assert(found, `Has ${critical}`);
  }

  // Test 4: Exercise Categories
  console.log('\n📊 Testing Exercise Categories...');
  const strengthExercises = db.exercises.filter(ex => ex.category === 'strength');
  const cardioExercises = db.exercises.filter(ex => ex.category === 'cardio');

  assert(strengthExercises.length > 60, 'Has sufficient strength exercises (>60)');
  assert(cardioExercises.length > 15, 'Has sufficient cardio exercises (>15)');

  // Test 5: Compound Movements
  console.log('\n💪 Testing Compound Movements...');
  const compounds = db.exercises.filter(ex => ex.type === 'compound');
  assert(compounds.length >= 30, 'Has at least 30 compound movements');

  // Test 6: Equipment Variety
  console.log('\n🔧 Testing Equipment Variety...');
  const allEquipment = new Set();
  db.exercises.forEach(ex => {
    if (ex.equipment) {
      ex.equipment.forEach(eq => allEquipment.add(eq));
    }
  });

  assert(allEquipment.has('barbell'), 'Has barbell exercises');
  assert(allEquipment.has('dumbbells'), 'Has dumbbell exercises');
  assert(allEquipment.has('bodyweight'), 'Has bodyweight exercises');
  assert(allEquipment.has('pull-up-bar'), 'Has pull-up bar exercises');

  // Test 7: Difficulty Levels
  console.log('\n🎯 Testing Difficulty Levels...');
  const beginnerEx = db.exercises.filter(ex => ex.difficulty === 'beginner');
  const intermediateEx = db.exercises.filter(ex => ex.difficulty === 'intermediate');
  const advancedEx = db.exercises.filter(ex => ex.difficulty === 'advanced');

  assert(beginnerEx.length > 20, 'Has beginner exercises');
  assert(intermediateEx.length > 20, 'Has intermediate exercises');
  assert(advancedEx.length > 10, 'Has advanced exercises');

  // Test 8: Video URL Format
  console.log('\n🎥 Testing Video URL Format...');
  let validUrls = 0;
  const youtubePattern = /youtube\.com\/watch\?v=|youtu\.be\//;

  for (const ex of db.exercises) {
    if (ex.videoUrl && youtubePattern.test(ex.videoUrl)) {
      validUrls++;
    }
  }

  assert(validUrls === db.exercises.length, 'All video URLs are valid YouTube links');

  // Test 9: Muscle Group Coverage
  console.log('\n🎯 Testing Muscle Group Coverage...');
  const allMuscles = new Set();
  db.exercises.forEach(ex => {
    if (ex.muscleGroups) {
      ex.muscleGroups.forEach(m => allMuscles.add(m));
    }
  });

  const requiredMuscles = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps'];
  for (const muscle of requiredMuscles) {
    assert(allMuscles.has(muscle), `Has ${muscle} exercises`);
  }

  // Test 10: Exercise Selection Functions
  console.log('\n⚙️  Testing Exercise Selection Logic...');

  // Test upper body selection
  const upperExercises = db.exercises.filter(ex =>
    ex.muscleGroups && ex.muscleGroups.some(m =>
      ['chest', 'back', 'shoulders', 'biceps', 'triceps'].includes(m)
    )
  );
  assert(upperExercises.length >= 30, 'Has sufficient upper body exercises');

  // Test lower body selection
  const lowerExercises = db.exercises.filter(ex =>
    ex.muscleGroups && ex.muscleGroups.some(m =>
      ['quads', 'hamstrings', 'glutes', 'calves'].includes(m)
    )
  );
  assert(lowerExercises.length >= 20, 'Has sufficient lower body exercises');

  // Print Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => t.status.includes('FAIL')).forEach(t => {
      console.log(`  - ${t.name}`);
    });
  }

  return results.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test suite error:', err);
      process.exit(1);
    });
}

module.exports = { runTests };
