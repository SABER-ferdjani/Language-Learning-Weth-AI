import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getTutorReply = async (messages, skillFocus) => {
  try {
    const systemPrompt = `You are a friendly and encouraging English language tutor. 
The student's current skill focus is: ${skillFocus}.
Keep your responses short, helpful, and natural. Correct any major mistakes gently, but focus on keeping the conversation flowing.
Do not act like an examiner unless explicitly asked to evaluate.`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the transcript:\n\n${transcript}` }
      ],
      temperature: 0.2,
    });

    let rawResult = response.choices[0].message.content.trim();
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
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
    });
    return transcription.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw new Error('Failed to transcribe audio');
  }
};

export const generateSpeech = async (text) => {
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });
    // This returns a response object with arrayBuffer()
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('Error in generateSpeech:', error);
    throw new Error('Failed to generate speech');
  }
};
