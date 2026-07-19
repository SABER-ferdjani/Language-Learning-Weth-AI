import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillFocus: { 
    type: String, 
    enum: ['Writing', 'Reading', 'Listening', 'Speaking', 'Mixed'], 
    default: 'Mixed' 
  },
  messages: [messageSchema],
  evaluation: {
    writingScore: { type: Number, min: 0, max: 100 },
    readingScore: { type: Number, min: 0, max: 100 },
    listeningScore: { type: Number, min: 0, max: 100 },
    speakingScore: { type: Number, min: 0, max: 100 },
    overallCEFR: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
    feedback: { type: String }
  },
  isCompleted: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
});

export default mongoose.model('Conversation', conversationSchema);
