const db = require('../database');

class Workout {
  static create({ id, userId, planId, date, exercises, duration = null, notes = '', rpe = null, createdAt, updatedAt }) {
    const stmt = db.prepare(`
      INSERT INTO workouts (id, user_id, plan_id, date, exercises, duration, notes, rpe, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      planId,
      date,
      JSON.stringify(exercises),
      duration,
      notes,
      rpe,
      createdAt,
      updatedAt
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM workouts WHERE id = ?');
    const workout = stmt.get(id);
    return workout ? this.deserialize(workout) : null;
  }

  static findByUserId(userId, options = {}) {
    let query = 'SELECT * FROM workouts WHERE user_id = ?';
    const params = [userId];

    if (options.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    query += ' ORDER BY date DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = db.prepare(query);
    const workouts = stmt.all(...params);
    return workouts.map(workout => this.deserialize(workout));
  }

  static findByPlanId(planId) {
    const stmt = db.prepare('SELECT * FROM workouts WHERE plan_id = ? ORDER BY date DESC');
    const workouts = stmt.all(planId);
    return workouts.map(workout => this.deserialize(workout));
  }

  static findByExerciseId(userId, exerciseId) {
    const stmt = db.prepare(`
      SELECT * FROM workouts
      WHERE user_id = ?
      AND exercises LIKE ?
      ORDER BY date DESC
      LIMIT 10
    `);
    // Escape exerciseId for JSON to prevent injection - properly quote it as JSON value
    const escapedExerciseId = JSON.stringify(exerciseId).slice(1, -1); // Remove outer quotes
    const likePattern = `%"exerciseId":"${escapedExerciseId}"%`;
    const workouts = stmt.all(userId, likePattern);
    return workouts.map(workout => this.deserialize(workout));
  }

  static findAll() {
    const stmt = db.prepare('SELECT * FROM workouts ORDER BY date DESC');
    const workouts = stmt.all();
    return workouts.map(workout => this.deserialize(workout));
  }

  static update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.exercises !== undefined) {
      fields.push('exercises = ?');
      values.push(JSON.stringify(updates.exercises));
    }
    if (updates.duration !== undefined) {
      fields.push('duration = ?');
      values.push(updates.duration);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.rpe !== undefined) {
      fields.push('rpe = ?');
      values.push(updates.rpe);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE workouts SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM workouts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static getStats(userId, options = {}) {
    let query = `
      SELECT
        COUNT(*) as total_workouts,
        COUNT(DISTINCT date(date)) as unique_days,
        SUM(duration) as total_duration,
        AVG(rpe) as avg_rpe
      FROM workouts
      WHERE user_id = ?
    `;
    const params = [userId];

    if (options.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  static deserialize(workout) {
    if (!workout) return null;

    // Safely parse exercises JSON with fallback to empty array
    let exercises = [];
    try {
      exercises = JSON.parse(workout.exercises);
    } catch (error) {
      console.error('Error parsing workout exercises JSON:', error);
      exercises = [];
    }

    return {
      id: workout.id,
      userId: workout.user_id,
      planId: workout.plan_id,
      date: workout.date,
      exercises,
      duration: workout.duration,
      notes: workout.notes,
      rpe: workout.rpe,
      createdAt: workout.created_at,
      updatedAt: workout.updated_at
    };
  }
}

module.exports = Workout;
