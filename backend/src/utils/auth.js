const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ignite_super_secret_jwt_key_2026';

/**
 * Generate a signed JWT token for a user.
 * Admin sessions receive a shorter 2-hour lifetime for security.
 * Trader sessions receive a 24-hour lifetime.
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    role: user.role
  };

  const expiresIn = user.role === 'ADMIN' ? '2h' : '24h';

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken
};
