import { Hono } from 'hono';
import { protect } from '../middleware/authMiddleware.js';
import Conversation from '../models/Conversation.js';

const historyRoutes = new Hono();

historyRoutes.use('/*', protect);

// @route   GET /api/history
historyRoutes.get('/', async (c) => {
  const user = c.get('user');
  
  const sessions = await Conversation.find({ user: user._id })
    .select('-messages')
    .sort({ startedAt: -1 });

  return c.json(sessions);
});

// @route   GET /api/history/activity
historyRoutes.get('/activity', async (c) => {
  const user = c.get('user');

  // Simple aggregation for daily activity
  const activity = await Conversation.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } },
        count: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return c.json(activity);
});

// @route   GET /api/history/:conversationId
historyRoutes.get('/:conversationId', async (c) => {
  const user = c.get('user');
  const { conversationId } = c.req.param();

  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation || conversation.user.toString() !== user._id.toString()) {
    return c.json({ message: 'Conversation not found' }, 404);
  }

  return c.json(conversation);
});

export default historyRoutes;
