const db = require('../database');

class User {
  static create({ id, email, password, name, equipment = [], exercisePreference = 'both', createdAt, updatedAt }) {
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, equipment, exercise_preference, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      email,
      password,
      name,
      JSON.stringify(equipment),
      exercisePreference,
      createdAt,
      updatedAt
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id);
    return user ? this.deserialize(user) : null;
  }

  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    return user ? this.deserialize(user) : null;
  }

  static findAll() {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    const users = stmt.all();
    return users.map(user => this.deserialize(user));
  }

  static update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.password !== undefined) {
      fields.push('password = ?');
      values.push(updates.password);
    }
    if (updates.equipment !== undefined) {
      fields.push('equipment = ?');
      values.push(JSON.stringify(updates.equipment));
    }
    if (updates.exercisePreference !== undefined) {
      fields.push('exercise_preference = ?');
      values.push(updates.exercisePreference);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static deserialize(user) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      equipment: JSON.parse(user.equipment),
      exercisePreference: user.exercise_preference,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }
}

module.exports = User;
