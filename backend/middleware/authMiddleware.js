import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (c, next) => {
  let token;

  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer')) {
    try {
      // Get token from header
      token = authHeader.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return c.json({ message: 'Not authorized, user not found' }, 401);
      }

      // Attach user to context
      c.set('user', user);

      await next();
    } catch (error) {
      console.error(error);
      return c.json({ message: 'Not authorized, token failed' }, 401);
    }
  } else {
    return c.json({ message: 'Not authorized, no token' }, 401);
  }
};
