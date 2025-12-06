const db = require('../database');

class BackupCode {
  static create({ id, userId, codeHash, createdAt }) {
    const stmt = db.prepare(`
      INSERT INTO backup_codes (id, user_id, code_hash, used, created_at)
      VALUES (?, ?, ?, 0, ?)
    `);

    stmt.run(id, userId, codeHash, createdAt);
    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM backup_codes WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM backup_codes WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId);
  }

  static findUnusedByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM backup_codes WHERE user_id = ? AND used = 0 ORDER BY created_at DESC');
    return stmt.all(userId);
  }

  static countUnused(userId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM backup_codes WHERE user_id = ? AND used = 0');
    const result = stmt.get(userId);
    return result.count;
  }

  static markAsUsed(id) {
    const stmt = db.prepare(`
      UPDATE backup_codes
      SET used = 1, used_at = ?
      WHERE id = ?
    `);

    const now = new Date().toISOString();
    stmt.run(now, id);
    return this.findById(id);
  }

  static deleteAllForUser(userId) {
    const stmt = db.prepare('DELETE FROM backup_codes WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }

  static deleteUsedCodes(userId) {
    const stmt = db.prepare('DELETE FROM backup_codes WHERE user_id = ? AND used = 1');
    const result = stmt.run(userId);
    return result.changes;
  }
}

module.exports = BackupCode;
