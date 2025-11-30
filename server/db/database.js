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

  console.log('Database tables created successfully');
};

// Initialize database
createTables();

module.exports = db;
