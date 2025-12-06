const Database = require('better-sqlite3');
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'mygymplanner.db');
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
const createTables = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      equipment TEXT DEFAULT '[]',
      exercise_preference TEXT DEFAULT 'both',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // Plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      config TEXT NOT NULL,
      split_type TEXT NOT NULL,
      week_schedule TEXT NOT NULL,
      duration TEXT NOT NULL,
      current_week INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
    CREATE INDEX IF NOT EXISTS idx_plans_created_at ON plans(created_at);
  `);

  // Workouts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      date TEXT NOT NULL,
      exercises TEXT NOT NULL,
      duration INTEGER,
      notes TEXT,
      rpe INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
    CREATE INDEX IF NOT EXISTS idx_workouts_plan_id ON workouts(plan_id);
    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
    CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date);
  `);

  // Workout sessions table (in-progress workouts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      day TEXT NOT NULL,
      session_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'abandoned')),
      exercises TEXT NOT NULL,
      current_exercise_index INTEGER NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      rpe INTEGER DEFAULT 5,
      workout_start_time INTEGER NOT NULL,
      substituted_exercises TEXT DEFAULT '{}',
      sync_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_active_workout
      ON workout_sessions(user_id, plan_id, day, session_date)
      WHERE status = 'in_progress';
    CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON workout_sessions(user_id, status);
  `);

  // Custom exercises table
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_exercises (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      muscle_groups TEXT NOT NULL,
      equipment TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      video_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_custom_exercises_user_id ON custom_exercises(user_id);
    CREATE INDEX IF NOT EXISTS idx_custom_exercises_category ON custom_exercises(category);
  `);

  // Sessions table for refresh token management
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      refresh_token_hash TEXT NOT NULL,
      device_name TEXT,
      device_type TEXT,
      user_agent TEXT,
      ip_address TEXT,
      last_used_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_revoked INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_active
      ON sessions(user_id, is_revoked, expires_at);
  `);

  // Backup codes table for account recovery
  db.exec(`
    CREATE TABLE IF NOT EXISTS backup_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON backup_codes(user_id);
    CREATE INDEX IF NOT EXISTS idx_backup_codes_user_unused ON backup_codes(user_id, used);
  `);

  console.log('Database tables created successfully');
};

// Initialize database
createTables();

module.exports = db;
