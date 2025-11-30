#!/usr/bin/env node

/**
 * Migration script to import existing JSON data into SQLite database
 *
 * Usage: node server/db/migrate-json-to-sqlite.js
 */

const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Plan = require('./models/Plan');
const Workout = require('./models/Workout');
const CustomExercise = require('./models/CustomExercise');

// Paths to JSON data files
const DATA_DIR = path.join(__dirname, '../data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const PLANS_PATH = path.join(DATA_DIR, 'plans.json');
const WORKOUTS_PATH = path.join(DATA_DIR, 'workouts.json');
const CUSTOM_EXERCISES_PATH = path.join(DATA_DIR, 'custom-exercises.json');

console.log('Starting migration from JSON to SQLite...\n');

// Helper to read JSON file
function readJSONFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Migrate users
function migrateUsers() {
  console.log('📝 Migrating users...');
  const data = readJSONFile(USERS_PATH);

  if (!data || !data.users || data.users.length === 0) {
    console.log('   No users to migrate.\n');
    return 0;
  }

  let count = 0;
  for (const user of data.users) {
    try {
      // Check if user already exists
      const existing = User.findById(user.id);
      if (existing) {
        console.log(`   ⏭️  Skipping existing user: ${user.email}`);
        continue;
      }

      User.create({
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        equipment: user.equipment || [],
        exercisePreference: user.exercisePreference || 'both',
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || user.createdAt || new Date().toISOString()
      });

      console.log(`   ✅ Migrated user: ${user.email}`);
      count++;
    } catch (error) {
      console.error(`   ❌ Error migrating user ${user.email}:`, error.message);
    }
  }

  console.log(`   📊 Migrated ${count} users.\n`);
  return count;
}

// Migrate plans
function migratePlans() {
  console.log('📝 Migrating plans...');
  const data = readJSONFile(PLANS_PATH);

  if (!data || !data.plans || data.plans.length === 0) {
    console.log('   No plans to migrate.\n');
    return 0;
  }

  let count = 0;
  for (const plan of data.plans) {
    try {
      // Check if plan already exists
      const existing = Plan.findById(plan.id);
      if (existing) {
        console.log(`   ⏭️  Skipping existing plan: ${plan.id}`);
        continue;
      }

      Plan.create({
        id: plan.id,
        userId: plan.userId,
        config: plan.config,
        splitType: plan.splitType,
        weekSchedule: plan.weekSchedule,
        duration: plan.duration,
        currentWeek: plan.currentWeek || 1,
        createdAt: plan.createdAt || new Date().toISOString(),
        updatedAt: plan.updatedAt || plan.createdAt || new Date().toISOString()
      });

      console.log(`   ✅ Migrated plan: ${plan.id} (user: ${plan.userId})`);
      count++;
    } catch (error) {
      console.error(`   ❌ Error migrating plan ${plan.id}:`, error.message);
    }
  }

  console.log(`   📊 Migrated ${count} plans.\n`);
  return count;
}

// Migrate workouts
function migrateWorkouts() {
  console.log('📝 Migrating workouts...');
  const data = readJSONFile(WORKOUTS_PATH);

  if (!data || !data.workouts || data.workouts.length === 0) {
    console.log('   No workouts to migrate.\n');
    return 0;
  }

  let count = 0;
  for (const workout of data.workouts) {
    try {
      // Check if workout already exists
      const existing = Workout.findById(workout.id);
      if (existing) {
        console.log(`   ⏭️  Skipping existing workout: ${workout.id}`);
        continue;
      }

      Workout.create({
        id: workout.id,
        userId: workout.userId,
        planId: workout.planId,
        date: workout.date,
        exercises: workout.exercises,
        duration: workout.duration || null,
        notes: workout.notes || '',
        rpe: workout.rpe || null,
        createdAt: workout.createdAt || new Date().toISOString(),
        updatedAt: workout.updatedAt || workout.createdAt || new Date().toISOString()
      });

      console.log(`   ✅ Migrated workout: ${workout.id} (date: ${workout.date})`);
      count++;
    } catch (error) {
      console.error(`   ❌ Error migrating workout ${workout.id}:`, error.message);
    }
  }

  console.log(`   📊 Migrated ${count} workouts.\n`);
  return count;
}

// Migrate custom exercises
function migrateCustomExercises() {
  console.log('📝 Migrating custom exercises...');
  const data = readJSONFile(CUSTOM_EXERCISES_PATH);

  if (!data || !data.exercises || data.exercises.length === 0) {
    console.log('   No custom exercises to migrate.\n');
    return 0;
  }

  let count = 0;
  for (const exercise of data.exercises) {
    try {
      // Check if exercise already exists
      const existing = CustomExercise.findById(exercise.id);
      if (existing) {
        console.log(`   ⏭️  Skipping existing exercise: ${exercise.name}`);
        continue;
      }

      CustomExercise.create({
        id: exercise.id,
        userId: exercise.userId,
        name: exercise.name,
        category: exercise.category || 'strength',
        muscleGroups: exercise.muscleGroups || [],
        equipment: exercise.equipment || ['bodyweight'],
        difficulty: exercise.difficulty || 'beginner',
        type: exercise.type || 'compound',
        description: exercise.description || '',
        videoUrl: exercise.videoUrl || '',
        createdAt: exercise.createdAt || new Date().toISOString(),
        updatedAt: exercise.updatedAt || exercise.createdAt || new Date().toISOString()
      });

      console.log(`   ✅ Migrated custom exercise: ${exercise.name}`);
      count++;
    } catch (error) {
      console.error(`   ❌ Error migrating exercise ${exercise.name}:`, error.message);
    }
  }

  console.log(`   📊 Migrated ${count} custom exercises.\n`);
  return count;
}

// Run migration
try {
  const stats = {
    users: migrateUsers(),
    plans: migratePlans(),
    workouts: migrateWorkouts(),
    customExercises: migrateCustomExercises()
  };

  console.log('='.repeat(50));
  console.log('✅ Migration completed successfully!');
  console.log('='.repeat(50));
  console.log('Summary:');
  console.log(`  - Users: ${stats.users}`);
  console.log(`  - Plans: ${stats.plans}`);
  console.log(`  - Workouts: ${stats.workouts}`);
  console.log(`  - Custom Exercises: ${stats.customExercises}`);
  console.log('='.repeat(50));
  console.log('\n💡 Your SQLite database is now ready!');
  console.log('   Database location: server/db/mygymplanner.db');
  console.log('\n📁 Your original JSON files are still intact in server/data/');
  console.log('   You can keep them as backups or delete them after verifying the migration.');
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
