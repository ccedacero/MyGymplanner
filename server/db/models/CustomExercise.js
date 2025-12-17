const db = require('../database');

class CustomExercise {
  static create({ id, userId, name, category, muscleGroups, equipment, difficulty, type, description = '', videoUrl = '', createdAt, updatedAt }) {
    const stmt = db.prepare(`
      INSERT INTO custom_exercises (id, user_id, name, category, muscle_groups, equipment, difficulty, type, description, video_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      name,
      category,
      JSON.stringify(muscleGroups),
      JSON.stringify(equipment),
      difficulty,
      type,
      description,
      videoUrl,
      createdAt,
      updatedAt
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM custom_exercises WHERE id = ?');
    const exercise = stmt.get(id);
    return exercise ? this.deserialize(exercise) : null;
  }

  static findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM custom_exercises WHERE user_id = ? ORDER BY created_at DESC');
    const exercises = stmt.all(userId);
    return exercises.map(exercise => this.deserialize(exercise));
  }

  static findAll() {
    const stmt = db.prepare('SELECT * FROM custom_exercises ORDER BY created_at DESC');
    const exercises = stmt.all();
    return exercises.map(exercise => this.deserialize(exercise));
  }

  static update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.muscleGroups !== undefined) {
      fields.push('muscle_groups = ?');
      values.push(JSON.stringify(updates.muscleGroups));
    }
    if (updates.equipment !== undefined) {
      fields.push('equipment = ?');
      values.push(JSON.stringify(updates.equipment));
    }
    if (updates.difficulty !== undefined) {
      fields.push('difficulty = ?');
      values.push(updates.difficulty);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.videoUrl !== undefined) {
      fields.push('video_url = ?');
      values.push(updates.videoUrl);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const stmt = db.prepare(`
      UPDATE custom_exercises SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM custom_exercises WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static deserialize(exercise) {
    if (!exercise) return null;

    // Safely parse JSON fields with fallback values
    let muscleGroups = [];
    let equipment = [];

    try {
      muscleGroups = JSON.parse(exercise.muscle_groups);
    } catch (error) {
      console.error('Error parsing custom exercise muscle_groups JSON:', error);
      muscleGroups = [];
    }

    try {
      equipment = JSON.parse(exercise.equipment);
    } catch (error) {
      console.error('Error parsing custom exercise equipment JSON:', error);
      equipment = [];
    }

    return {
      id: exercise.id,
      userId: exercise.user_id,
      name: exercise.name,
      category: exercise.category,
      muscleGroups,
      equipment,
      difficulty: exercise.difficulty,
      type: exercise.type,
      description: exercise.description,
      videoUrl: exercise.video_url,
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at
    };
  }
}

module.exports = CustomExercise;
