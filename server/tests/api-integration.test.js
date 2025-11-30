#!/usr/bin/env node

/**
 * Comprehensive API Integration Tests for SQLite Migration
 * Tests all endpoints to ensure database migration was successful
 *
 * Usage: node server/tests/api-integration.test.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
let testUserId = null;
let testPlanId = null;
let testWorkoutId = null;
let testExerciseId = null;
let authToken = null;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function assert(condition, testName, details = '') {
  if (condition) {
    results.passed++;
    results.tests.push({ name: testName, status: '✅ PASS' });
    console.log(`✅ ${testName}`);
  } else {
    results.failed++;
    results.tests.push({ name: testName, status: '❌ FAIL', details });
    console.error(`❌ ${testName}${details ? `: ${details}` : ''}`);
  }
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsedBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running API Integration Tests for SQLite Migration\n');
  console.log('⏳ Waiting for server to be ready...\n');

  // Wait for server to be ready
  let serverReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      await makeRequest('GET', '/api/users/test-user-id');
      serverReady = true;
      break;
    } catch (e) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (!serverReady) {
    console.error('❌ Server is not running on port 3001');
    console.error('   Please start the server first: npm start');
    process.exit(1);
  }

  console.log('✅ Server is ready!\n');

  // ========================================
  // USER ENDPOINTS
  // ========================================
  console.log('👤 Testing User Endpoints...\n');

  // Test: Get existing user profile
  try {
    const res = await makeRequest('GET', '/api/users/user-b5c6e7e6-b652-41d8-9272-5ff00a81b4fb');
    assert(res.status === 200, 'GET /api/users/:userId returns 200');
    assert(res.data.email === 'ccedacero@gmail.com', 'User email matches');
    assert(Array.isArray(res.data.equipment), 'User has equipment array');
    testUserId = res.data.id;
  } catch (e) {
    assert(false, 'GET /api/users/:userId', e.message);
  }

  // Test: Update user equipment
  try {
    const res = await makeRequest('PUT', `/api/users/${testUserId}/equipment`, {
      equipment: ['barbell', 'dumbbells', 'pull-up-bar']
    });
    assert(res.status === 200, 'PUT /api/users/:userId/equipment returns 200');
    assert(Array.isArray(res.data.user.equipment), 'Equipment updated successfully');
    assert(res.data.user.equipment.length === 3, 'Equipment array has correct length');
  } catch (e) {
    assert(false, 'PUT /api/users/:userId/equipment', e.message);
  }

  // Test: Update exercise preference
  try {
    const res = await makeRequest('PUT', `/api/users/${testUserId}/exercise-preference`, {
      exercisePreference: 'both'
    });
    assert(res.status === 200, 'PUT /api/users/:userId/exercise-preference returns 200');
    assert(res.data.user.exercisePreference === 'both', 'Exercise preference updated');
  } catch (e) {
    assert(false, 'PUT /api/users/:userId/exercise-preference', e.message);
  }

  // ========================================
  // PLAN ENDPOINTS
  // ========================================
  console.log('\n📋 Testing Plan Endpoints...\n');

  // Test: Get user's plans
  try {
    const res = await makeRequest('GET', `/api/plans/user/${testUserId}`);
    assert(res.status === 200, 'GET /api/plans/user/:userId returns 200');
    assert(Array.isArray(res.data.plans), 'Plans is an array');
    assert(res.data.count >= 0, 'Has count property');
    if (res.data.plans.length > 0) {
      testPlanId = res.data.plans[0].id;
    }
  } catch (e) {
    assert(false, 'GET /api/plans/user/:userId', e.message);
  }

  // Test: Get specific plan
  if (testPlanId) {
    try {
      const res = await makeRequest('GET', `/api/plans/${testPlanId}`);
      assert(res.status === 200, 'GET /api/plans/:planId returns 200');
      assert(res.data.id === testPlanId, 'Plan ID matches');
      assert(res.data.weekSchedule, 'Plan has weekSchedule');
      assert(res.data.config, 'Plan has config');
    } catch (e) {
      assert(false, 'GET /api/plans/:planId', e.message);
    }

    // Test: Update plan
    try {
      const res = await makeRequest('PUT', `/api/plans/${testPlanId}`, {
        currentWeek: 2
      });
      assert(res.status === 200, 'PUT /api/plans/:planId returns 200');
      assert(res.data.plan.currentWeek === 2, 'Plan currentWeek updated');
    } catch (e) {
      assert(false, 'PUT /api/plans/:planId', e.message);
    }
  }

  // ========================================
  // WORKOUT ENDPOINTS
  // ========================================
  console.log('\n🏋️ Testing Workout Endpoints...\n');

  // Test: Log a new workout
  try {
    const res = await makeRequest('POST', '/api/workouts/log', {
      userId: testUserId,
      planId: testPlanId,
      date: new Date().toISOString(),
      exercises: [
        {
          exerciseId: 'ex001',
          sets: [
            { weight: 100, reps: 10, completed: true },
            { weight: 100, reps: 10, completed: true }
          ]
        }
      ],
      duration: 3600,
      notes: 'Test workout',
      rpe: 8
    });
    assert(res.status === 201, 'POST /api/workouts/log returns 201');
    assert(res.data.workout.id, 'Workout has ID');
    assert(res.data.workout.exercises.length === 1, 'Workout has exercises');
    testWorkoutId = res.data.workout.id;
  } catch (e) {
    assert(false, 'POST /api/workouts/log', e.message);
  }

  // Test: Get user's workout history
  try {
    const res = await makeRequest('GET', `/api/workouts/user/${testUserId}`);
    assert(res.status === 200, 'GET /api/workouts/user/:userId returns 200');
    assert(Array.isArray(res.data.workouts), 'Workouts is an array');
    assert(res.data.count >= 1, 'Has at least 1 workout');
  } catch (e) {
    assert(false, 'GET /api/workouts/user/:userId', e.message);
  }

  // Test: Get specific workout
  if (testWorkoutId) {
    try {
      const res = await makeRequest('GET', `/api/workouts/${testWorkoutId}`);
      assert(res.status === 200, 'GET /api/workouts/:workoutId returns 200');
      assert(res.data.id === testWorkoutId, 'Workout ID matches');
      assert(res.data.exercises, 'Workout has exercises');
    } catch (e) {
      assert(false, 'GET /api/workouts/:workoutId', e.message);
    }

    // Test: Update workout
    try {
      const res = await makeRequest('PUT', `/api/workouts/${testWorkoutId}`, {
        rpe: 9,
        notes: 'Updated test workout'
      });
      assert(res.status === 200, 'PUT /api/workouts/:workoutId returns 200');
      assert(res.data.workout.rpe === 9, 'Workout RPE updated');
    } catch (e) {
      assert(false, 'PUT /api/workouts/:workoutId', e.message);
    }
  }

  // Test: Get workout stats
  try {
    const res = await makeRequest('GET', `/api/workouts/stats/${testUserId}?period=month`);
    assert(res.status === 200, 'GET /api/workouts/stats/:userId returns 200');
    assert(res.data.stats, 'Has stats object');
    assert(typeof res.data.stats.totalWorkouts === 'number', 'Has totalWorkouts count');
  } catch (e) {
    assert(false, 'GET /api/workouts/stats/:userId', e.message);
  }

  // ========================================
  // EXERCISE ENDPOINTS
  // ========================================
  console.log('\n💪 Testing Exercise Endpoints...\n');

  // Test: Get all exercises
  try {
    const res = await makeRequest('GET', `/api/exercises?userId=${testUserId}`);
    assert(res.status === 200, 'GET /api/exercises returns 200');
    assert(Array.isArray(res.data.exercises), 'Exercises is an array');
    assert(res.data.exercises.length >= 90, 'Has at least 90 exercises');
    assert(res.data.metadata, 'Has metadata');
  } catch (e) {
    assert(false, 'GET /api/exercises', e.message);
  }

  // Test: Get exercise by ID
  try {
    const res = await makeRequest('GET', '/api/exercises/ex001');
    assert(res.status === 200, 'GET /api/exercises/:id returns 200');
    assert(res.data.id === 'ex001', 'Exercise ID matches');
    assert(res.data.name, 'Exercise has name');
  } catch (e) {
    assert(false, 'GET /api/exercises/:id', e.message);
  }

  // Test: Add custom exercise
  try {
    const res = await makeRequest('POST', '/api/exercises/custom', {
      userId: testUserId,
      name: 'Test Custom Exercise',
      category: 'strength',
      muscleGroups: ['chest'],
      equipment: ['barbell'],
      difficulty: 'intermediate',
      type: 'compound',
      description: 'A test exercise'
    });
    assert(res.status === 201, 'POST /api/exercises/custom returns 201');
    assert(res.data.exercise.id, 'Custom exercise has ID');
    assert(res.data.exercise.name === 'Test Custom Exercise', 'Custom exercise name matches');
    testExerciseId = res.data.exercise.id;
  } catch (e) {
    assert(false, 'POST /api/exercises/custom', e.message);
  }

  // Test: Get user's custom exercises
  try {
    const res = await makeRequest('GET', `/api/exercises/user/${testUserId}/custom`);
    assert(res.status === 200, 'GET /api/exercises/user/:userId/custom returns 200');
    assert(Array.isArray(res.data.exercises), 'Custom exercises is an array');
    assert(res.data.count >= 1, 'Has at least 1 custom exercise');
  } catch (e) {
    assert(false, 'GET /api/exercises/user/:userId/custom', e.message);
  }

  // Test: Get exercise substitutes
  try {
    const res = await makeRequest('GET', `/api/exercises/ex001/substitutes?userId=${testUserId}`);
    assert(res.status === 200, 'GET /api/exercises/:id/substitutes returns 200');
    assert(res.data.originalExercise, 'Has original exercise');
    assert(Array.isArray(res.data.substitutes), 'Substitutes is an array');
  } catch (e) {
    assert(false, 'GET /api/exercises/:id/substitutes', e.message);
  }

  // ========================================
  // CLEANUP
  // ========================================
  console.log('\n🧹 Cleaning up test data...\n');

  // Delete test workout
  if (testWorkoutId) {
    try {
      const res = await makeRequest('DELETE', `/api/workouts/${testWorkoutId}`);
      assert(res.status === 200, 'DELETE /api/workouts/:workoutId returns 200');
    } catch (e) {
      assert(false, 'DELETE /api/workouts/:workoutId', e.message);
    }
  }

  // Delete custom exercise
  if (testExerciseId) {
    try {
      const res = await makeRequest('DELETE', `/api/exercises/custom/${testExerciseId}?userId=${testUserId}`);
      assert(res.status === 200, 'DELETE /api/exercises/custom/:id returns 200');
    } catch (e) {
      assert(false, 'DELETE /api/exercises/custom/:id', e.message);
    }
  }

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Database migration is successful.');
    process.exit(0);
  }
}

// Run tests
runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
