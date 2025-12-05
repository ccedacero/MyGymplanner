const db = require('../database');
const bcrypt = require('bcryptjs');

class Session {
  static async create({
    id,
    userId,
    refreshToken,
    deviceName,
    deviceType,
    userAgent,
    ipAddress,
    createdAt,
    expiresAt
  }) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const stmt = db.prepare(`
      INSERT INTO sessions (
        id, user_id, refresh_token_hash, device_name, device_type,
        user_agent, ip_address, last_used_at, created_at, expires_at, is_revoked
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(
      id,
      userId,
      refreshTokenHash,
      deviceName,
      deviceType,
      userAgent,
      ipAddress,
      createdAt,
      createdAt,
      expiresAt
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserId(userId, includeRevoked = false) {
    const query = includeRevoked
      ? 'SELECT * FROM sessions WHERE user_id = ? ORDER BY last_used_at DESC'
      : "SELECT * FROM sessions WHERE user_id = ? AND is_revoked = 0 AND datetime(expires_at) > datetime('now') ORDER BY last_used_at DESC";

    const stmt = db.prepare(query);
    return stmt.all(userId);
  }

  static async validateRefreshToken(sessionId, refreshToken) {
    const session = this.findById(sessionId);

    if (!session) return null;
    if (session.is_revoked === 1) return null;
    if (new Date(session.expires_at) < new Date()) return null;

    const isValid = await bcrypt.compare(refreshToken, session.refresh_token_hash);
    return isValid ? session : null;
  }

  static updateLastUsed(id) {
    const stmt = db.prepare(`
      UPDATE sessions
      SET last_used_at = ?
      WHERE id = ?
    `);

    stmt.run(new Date().toISOString(), id);
  }

  static async rotateRefreshToken(sessionId, newRefreshToken) {
    const newHash = await bcrypt.hash(newRefreshToken, 10);

    const stmt = db.prepare(`
      UPDATE sessions
      SET refresh_token_hash = ?, last_used_at = ?
      WHERE id = ?
    `);

    stmt.run(newHash, new Date().toISOString(), sessionId);
  }

  static revoke(id) {
    const stmt = db.prepare(`
      UPDATE sessions
      SET is_revoked = 1
      WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }

  static revokeAllUserSessions(userId, exceptSessionId = null) {
    const query = exceptSessionId
      ? 'UPDATE sessions SET is_revoked = 1 WHERE user_id = ? AND id != ?'
      : 'UPDATE sessions SET is_revoked = 1 WHERE user_id = ?';

    const stmt = db.prepare(query);
    const result = exceptSessionId
      ? stmt.run(userId, exceptSessionId)
      : stmt.run(userId);

    return result.changes;
  }

  static deleteExpired() {
    const stmt = db.prepare(`
      DELETE FROM sessions
      WHERE datetime(expires_at) < datetime("now")
    `);

    const result = stmt.run();
    return result.changes;
  }
}

module.exports = Session;
