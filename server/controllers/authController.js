const { v4: uuidv4 } = require('uuid');
const Session = require('../db/models/Session');
const User = require('../db/models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiration,
  REFRESH_TOKEN_EXPIRY
} = require('../utils/tokenUtils');
const { parseUserAgent, getClientIp } = require('../utils/deviceUtils');

// Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken, sessionId } = req.body;

    if (!refreshToken || !sessionId) {
      return res.status(400).json({
        error: 'Refresh token and session ID required'
      });
    }

    // Validate refresh token
    const session = await Session.validateRefreshToken(sessionId, refreshToken);

    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token',
        code: 'REFRESH_TOKEN_INVALID'
      });
    }

    // Get user
    const user = User.findById(session.user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken();

    // Rotate refresh token in database (security best practice)
    await Session.rotateRefreshToken(session.id, newRefreshToken);

    // Update last used timestamp
    Session.updateLastUsed(session.id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

// Get all sessions for a user
exports.getSessions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user from JWT matches requested userId
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const sessions = Session.findByUserId(userId);

    // Format sessions for frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      deviceName: session.device_name,
      deviceType: session.device_type,
      ipAddress: session.ip_address,
      lastUsedAt: session.last_used_at,
      createdAt: session.created_at,
      isCurrent: req.headers['x-session-id'] === session.id
    }));

    res.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// Revoke a specific session
exports.revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.user;

    // Get session to verify ownership
    const session = Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    Session.revoke(sessionId);

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
};

// Revoke all sessions except current
exports.revokeAllOtherSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentSessionId = req.headers['x-session-id'];

    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const count = Session.revokeAllUserSessions(userId, currentSessionId);

    res.json({
      message: 'All other sessions revoked successfully',
      count
    });
  } catch (error) {
    console.error('Error revoking sessions:', error);
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
};
