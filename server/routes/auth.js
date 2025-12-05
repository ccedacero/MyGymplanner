const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Refresh access token (no auth required - uses refresh token)
router.post('/refresh', authController.refreshToken);

// Get all sessions for user (requires auth)
router.get('/sessions/:userId', authenticateToken, authController.getSessions);

// Revoke specific session (requires auth)
router.delete('/sessions/:sessionId', authenticateToken, authController.revokeSession);

// Revoke all other sessions (requires auth)
router.post('/sessions/:userId/revoke-others', authenticateToken, authController.revokeAllOtherSessions);

module.exports = router;
