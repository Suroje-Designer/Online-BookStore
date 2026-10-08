const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Requires a valid "Authorization: Bearer <token>" header.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error(
      err.name === 'TokenExpiredError'
        ? 'Session expired, please log in again'
        : 'Not authorized, token is invalid'
    );
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    res.status(401);
    throw new Error('Not authorized, user no longer exists');
  }

  req.user = user;
  next();
});

// Must run after `protect`.
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403);
  next(new Error('Access denied, admin privileges required'));
};

module.exports = { protect, admin };
