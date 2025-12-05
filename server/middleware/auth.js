const { verifyAccessToken } = require('../utils/tokenUtils');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid or expired access token',
      code: 'TOKEN_EXPIRED'
    });
  }

  req.user = {
    userId: decoded.userId,
    email: decoded.email
  };

  next();
}

// Optional authentication (doesn't fail if no token)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };
    }
  }

  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
