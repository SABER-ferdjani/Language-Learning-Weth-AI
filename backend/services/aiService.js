import { GoogleGenerativeAI } from '@google/generative-ai';
import * as googleTTS from 'google-tts-api';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getTutorReply = async (messages, skillFocus) => {
  try {
    const systemPrompt = `You are a friendly and encouraging English language tutor. 
The student's current skill focus is: ${skillFocus}.
Keep your responses short, helpful, and natural. Correct any major mistakes gently, but focus on keeping the conversation flowing.
Do not act like an examiner unless explicitly asked to evaluate.`;

    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const prompt = `${systemPrompt}\n\nHere is the conversation history. Reply as the ASSISTANT to the last USER message.\n\n${transcript}\nASSISTANT:`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    let reply = result.response.text().trim();
    if (reply.startsWith("ASSISTANT:")) reply = reply.replace(/^ASSISTANT:\s*/i, '');

    return reply;
  } catch (error) {
    console.error('Error in getTutorReply:', error);
    throw new Error('Failed to get tutor reply');
  }
};

export const evaluateSession = async (messages) => {
  try {
    const systemPrompt = `You are an expert English language evaluator. 
Review the following conversation between a student (user) and a tutor (assistant).
Evaluate the student's performance across Writing, Reading, Listening, and Speaking where applicable.
Return a JSON object with the following structure exactly (no markdown formatting, just raw JSON):
{
  "writingScore": number (0-100),
  "readingScore": number (0-100),
  "listeningScore": number (0-100),
  "speakingScore": number (0-100),
  "overallCEFR": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "feedback": "A short, encouraging feedback message in Arabic (1-2 sentences)."
}`;

    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const prompt = `${systemPrompt}\n\nHere is the transcript:\n\n${transcript}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    let rawResult = result.response.text().trim();
    if (rawResult.startsWith('\`\`\`json')) {
      rawResult = rawResult.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    }

    return JSON.parse(rawResult);
  } catch (error) {
    console.error('Error in evaluateSession:', error);
    throw new Error('Failed to evaluate session');
  }
};

export const transcribeAudio = async (audioStream) => {
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-large-v3',
    });
    return transcription.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw new Error('Failed to transcribe audio');
  }
};

export const generateSpeech = async (text) => {
  try {
    const base64Audio = await googleTTS.getAudioBase64(text, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
    });
    const buffer = Buffer.from(base64Audio, 'base64');
    return buffer;
  } catch (error) {
    console.error('Error in generateSpeech:', error);
    throw new Error('Failed to generate speech');
  }
};
