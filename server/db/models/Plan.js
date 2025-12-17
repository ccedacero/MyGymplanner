const db = require('../database');

class Plan {
  static create({ id, userId, config, splitType, weekSchedule, duration, currentWeek = 1, createdAt, updatedAt }) {
    const stmt = db.prepare(`
      INSERT INTO plans (id, user_id, config, split_type, week_schedule, duration, current_week, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      JSON.stringify(config),
      splitType,
      JSON.stringify(weekSchedule),
      duration,
      currentWeek,
      createdAt,
      updatedAt
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM plans WHERE id = ?');
    const plan = stmt.get(id);
    return plan ? this.deserialize(plan) : null;
  }

  static findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC');
    const plans = stmt.all(userId);
    return plans.map(plan => this.deserialize(plan));
  }

  static findAll() {
    const stmt = db.prepare('SELECT * FROM plans ORDER BY created_at DESC');
    const plans = stmt.all();
    return plans.map(plan => this.deserialize(plan));
  }

  static update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.config !== undefined) {
      fields.push('config = ?');
      values.push(JSON.stringify(updates.config));
    }
    if (updates.splitType !== undefined) {
      fields.push('split_type = ?');
      values.push(updates.splitType);
    }
    if (updates.weekSchedule !== undefined) {
      fields.push('week_schedule = ?');
      values.push(JSON.stringify(updates.weekSchedule));
    }
    if (updates.duration !== undefined) {
      fields.push('duration = ?');
      values.push(updates.duration);
    }
    if (updates.currentWeek !== undefined) {
      fields.push('current_week = ?');
      values.push(updates.currentWeek);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE plans SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM plans WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static deserialize(plan) {
    if (!plan) return null;

    // Safely parse JSON fields with fallback values
    let config = {};
    let weekSchedule = [];

    try {
      config = JSON.parse(plan.config);
    } catch (error) {
      console.error('Error parsing plan config JSON:', error);
      config = {};
    }

    try {
      weekSchedule = JSON.parse(plan.week_schedule);
    } catch (error) {
      console.error('Error parsing plan week_schedule JSON:', error);
      weekSchedule = [];
    }

    return {
      id: plan.id,
      userId: plan.user_id,
      config,
      splitType: plan.split_type,
      weekSchedule,
      duration: plan.duration,
      currentWeek: plan.current_week,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    };
  }
}

module.exports = Plan;
