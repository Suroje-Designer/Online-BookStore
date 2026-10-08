const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400);
    throw new Error('Please enter a valid email address');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }
  if (await User.findOne({ email })) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Role is never taken from the request: public registration always creates a "user".
  const user = await User.create({ name, email, password, role: 'user' });
  res.status(201).json({ ...userResponse(user), token: generateToken(user._id) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({ ...userResponse(user), token: generateToken(user._id) });
});

// GET /api/auth/profile
const getProfile = asyncHandler(async (req, res) => {
  res.json(userResponse(req.user));
});

module.exports = { register, login, getProfile };
