import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const authRoutes = new Hono();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
authRoutes.post('/register', async (c) => {
  const { name, email, password } = await c.req.json();

  if (!name || !email || !password) {
    return c.json({ message: 'Please add all fields' }, 400);
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return c.json({ message: 'User already exists' }, 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    return c.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      currentLevel: user.currentLevel,
      token: generateToken(user._id),
    }, 201);
  } else {
    return c.json({ message: 'Invalid user data' }, 400);
  }
});

// @route   POST /api/auth/login
authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    return c.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      currentLevel: user.currentLevel,
      token: generateToken(user._id),
    });
  } else {
    return c.json({ message: 'Invalid credentials' }, 401);
  }
});

// @route   GET /api/auth/me
authRoutes.get('/me', protect, async (c) => {
  const user = c.get('user');
  return c.json({
    id: user._id,
    name: user.name,
    email: user.email,
    currentLevel: user.currentLevel,
  });
});

export default authRoutes;
