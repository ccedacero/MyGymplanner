const db = require('../database');
const Workout = require('./Workout');
const { v4: uuidv4 } = require('uuid');

class WorkoutSession {
  static create({
    userId,
    planId,
    day,
    sessionDate,
    exercises,
    currentExerciseIndex = 0,
    notes = '',
    rpe = 5,
    workoutStartTime,
    substitutedExercises = {}
  }) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO workout_sessions (
        id, user_id, plan_id, day, session_date, status, exercises,
        current_exercise_index, notes, rpe, workout_start_time,
        substituted_exercises, sync_version, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      planId,
      day,
      sessionDate,
      'in_progress',
      JSON.stringify(exercises),
      currentExerciseIndex,
      notes,
      rpe,
      workoutStartTime,
      JSON.stringify(substitutedExercises),
      1,
      now,
      now
    );

    return this.findById(id);
  }

  static upsert({
    userId,
    planId,
    day,
    sessionDate,
    exercises,
    currentExerciseIndex = 0,
    notes = '',
    rpe = 5,
    workoutStartTime,
    substitutedExercises = {},
    lastSyncVersion = null
  }) {
    // Check if session exists
    const existing = this.findActiveByUserAndWorkout(userId, planId, day, sessionDate);

    if (existing) {
      // Check for sync version conflict
      if (lastSyncVersion !== null && existing.syncVersion !== lastSyncVersion) {
        throw new Error('SYNC_CONFLICT');
      }

      // Update existing session
      return this.update(existing.id, {
        exercises,
        currentExerciseIndex,
        notes,
        rpe,
        workoutStartTime,
        substitutedExercises
      });
    } else {
      // Create new session
      return this.create({
        userId,
        planId,
        day,
        sessionDate,
        exercises,
        currentExerciseIndex,
        notes,
        rpe,
        workoutStartTime,
        substitutedExercises
      });
    }
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM workout_sessions WHERE id = ?');
    const session = stmt.get(id);
    return session ? this.deserialize(session) : null;
  }

  static findActiveByUserId(userId) {
    const stmt = db.prepare(`
      SELECT * FROM workout_sessions
      WHERE user_id = ? AND status = 'in_progress'
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    const session = stmt.get(userId);
    return session ? this.deserialize(session) : null;
  }

  static findActiveByUserAndWorkout(userId, planId, day, sessionDate) {
    const stmt = db.prepare(`
      SELECT * FROM workout_sessions
      WHERE user_id = ? AND plan_id = ? AND day = ? AND session_date = ? AND status = 'in_progress'
      LIMIT 1
    `);
    const session = stmt.get(userId, planId, day, sessionDate);
    return session ? this.deserialize(session) : null;
  }

  static update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.exercises !== undefined) {
      fields.push('exercises = ?');
      values.push(JSON.stringify(updates.exercises));
    }
    if (updates.currentExerciseIndex !== undefined) {
      fields.push('current_exercise_index = ?');
      values.push(updates.currentExerciseIndex);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.rpe !== undefined) {
      fields.push('rpe = ?');
      values.push(updates.rpe);
    }
    if (updates.workoutStartTime !== undefined) {
      fields.push('workout_start_time = ?');
      values.push(updates.workoutStartTime);
    }
    if (updates.substitutedExercises !== undefined) {
      fields.push('substituted_exercises = ?');
      values.push(JSON.stringify(updates.substitutedExercises));
    }

    // Increment sync version
    fields.push('sync_version = sync_version + 1');

    // Update timestamp
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE workout_sessions SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static complete(id, { duration, notes, rpe }) {
    // Get the session
    const session = this.findById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    // Create a workout record
    const workoutId = uuidv4();
    const now = new Date().toISOString();

    Workout.create({
      id: workoutId,
      userId: session.userId,
      planId: session.planId,
      date: now,
      exercises: session.exercises,
      duration,
      notes,
      rpe,
      createdAt: now,
      updatedAt: now
    });

    // Mark session as completed
    const stmt = db.prepare(`
      UPDATE workout_sessions
      SET status = 'completed', updated_at = ?
      WHERE id = ?
    `);
    stmt.run(now, id);

    return { workoutId, sessionId: id };
  }

  static abandon(id) {
    const stmt = db.prepare(`
      UPDATE workout_sessions
      SET status = 'abandoned', updated_at = ?
      WHERE id = ?
    `);
    const result = stmt.run(new Date().toISOString(), id);
    return result.changes > 0;
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM workout_sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static deserialize(session) {
    if (!session) return null;
    return {
      id: session.id,
      userId: session.user_id,
      planId: session.plan_id,
      day: session.day,
      sessionDate: session.session_date,
      status: session.status,
      exercises: JSON.parse(session.exercises),
      currentExerciseIndex: session.current_exercise_index,
      notes: session.notes,
      rpe: session.rpe,
      workoutStartTime: session.workout_start_time,
      substitutedExercises: JSON.parse(session.substituted_exercises),
      syncVersion: session.sync_version,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    };
  }
}

module.exports = WorkoutSession;
