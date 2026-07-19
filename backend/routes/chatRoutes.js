import { Hono } from 'hono';
import { protect } from '../middleware/authMiddleware.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { getTutorReply, evaluateSession, transcribeAudio, generateSpeech } from '../services/aiService.js';

const chatRoutes = new Hono();

chatRoutes.use('/*', protect);

// @route   POST /api/chat/:conversationId?/message
chatRoutes.post('/:conversationId?/message', async (c) => {
  const user = c.get('user');
  const { conversationId } = c.req.param();
  const { content, skillFocus } = await c.req.json();

  let conversation;

  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.user.toString() !== user._id.toString()) {
      return c.json({ message: 'Conversation not found' }, 404);
    }
  } else {
    // Create new conversation
    conversation = await Conversation.create({
      user: user._id,
      skillFocus: skillFocus || 'Mixed',
      messages: []
    });
  }

  // Add user message
  conversation.messages.push({ role: 'user', content });

  try {
    // Get AI reply
    const reply = await getTutorReply(conversation.messages, conversation.skillFocus);
    conversation.messages.push({ role: 'assistant', content: reply });
    
    await conversation.save();

    return c.json({
      conversationId: conversation._id,
      reply,
      messages: conversation.messages
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Failed to process message' }, 500);
  }
});

// @route   POST /api/chat/:conversationId/evaluate
chatRoutes.post('/:conversationId/evaluate', async (c) => {
  const user = c.get('user');
  const { conversationId } = c.req.param();

  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.user.toString() !== user._id.toString()) {
    return c.json({ message: 'Conversation not found' }, 404);
  }

  try {
    const evaluation = await evaluateSession(conversation.messages);
    conversation.evaluation = evaluation;
    conversation.isCompleted = true;
    conversation.endedAt = Date.now();
    await conversation.save();

    // Update user's overall level
    const dbUser = await User.findById(user._id);
    dbUser.currentLevel = evaluation.overallCEFR;
    await dbUser.save();

    return c.json({ evaluation });
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Evaluation failed' }, 500);
  }
});

// @route   POST /api/chat/:conversationId?/voice
chatRoutes.post('/:conversationId?/voice', async (c) => {
  const user = c.get('user');
  const { conversationId } = c.req.param();
  
  const body = await c.req.parseBody();
  const audioFile = body['audio'];
  const skillFocus = body['skillFocus'] || 'Mixed';

  if (!audioFile) {
    return c.json({ message: 'No audio file uploaded' }, 400);
  }

  let conversation;
  if (conversationId && conversationId !== 'undefined') {
    conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.user.toString() !== user._id.toString()) {
      return c.json({ message: 'Conversation not found' }, 404);
    }
  } else {
    conversation = await Conversation.create({
      user: user._id,
      skillFocus,
      messages: []
    });
  }

  try {
    // Transcribe audio using Whisper
    // Ensure that audioFile satisfies the interface for OpenAI file upload
    const userText = await transcribeAudio(audioFile);
    conversation.messages.push({ role: 'user', content: userText });

    // Get tutor reply text
    const replyText = await getTutorReply(conversation.messages, conversation.skillFocus);
    conversation.messages.push({ role: 'assistant', content: replyText });

    await conversation.save();

    // Convert tutor reply to speech
    const speechBuffer = await generateSpeech(replyText);

    // Return the audio as response along with IDs in headers
    c.header('Content-Type', 'audio/mpeg');
    c.header('X-Conversation-Id', conversation._id.toString());
    c.header('X-Reply-Text', encodeURIComponent(replyText));
    c.header('X-User-Text', encodeURIComponent(userText));

    return c.body(speechBuffer);
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Voice processing failed' }, 500);
  }
});

export default chatRoutes;
