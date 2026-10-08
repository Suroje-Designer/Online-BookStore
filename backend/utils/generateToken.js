const jwt = require('jsonwebtoken');

// Signs a JWT that expires (default 7 days, override with JWT_EXPIRES_IN).
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

module.exports = generateToken;
