import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import historyRoutes from './routes/historyRoutes.js';

dotenv.config();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Conversation-Id', 'X-Reply-Text', 'X-User-Text'],
  maxAge: 600,
  credentials: true,
}));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/chat', chatRoutes);
app.route('/api/history', historyRoutes);

// Error Handling
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ message: err.message || 'Internal Server Error' }, 500);
});

const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

// Connect to MongoDB

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/language-learning')
  .then(() => {
    console.log('MongoDB Connected');
    serve({ fetch: app.fetch, port }, (info) => {
      console.log(`Server is running on port ${info.port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // لا تشغّل السيرفر إذا فشل الاتصال
  });