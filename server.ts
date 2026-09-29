import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Setup Gemini AI Client with required telemetry User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware to support base64 audio payloads up to 50MB
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Status & Configuration Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    });
  });

  // Curated Neural Voices metadata
  app.get('/api/voices', (req: Request, res: Response) => {
    const voices = [
      {
        id: 'Kore',
        name: 'Kore',
        gender: 'Female',
        tone: 'Warm & Natural',
        description: 'Balanced, articulate, and rich with natural conversational cadence. Ideal for storytelling, audiobooks, and executive briefings.',
        accent: 'Standard American',
        bestFor: 'Narration, Audiobooks, Tutorials',
        sampleText: 'Welcome to the future of neural voice synthesis. Every inflection feels effortlessly human.',
      },
      {
        id: 'Puck',
        name: 'Puck',
        gender: 'Male',
        tone: 'Crisp & Engaging',
        description: 'Vibrant, clear, and energetic with an upbeat, relatable tempo. Perfect for product demos, podcasts, and casual conversations.',
        accent: 'Standard American',
        bestFor: 'Podcasts, Demos, Commercials',
        sampleText: 'Hey there! Ready to bring your ideas to life with voice intelligence that sounds truly alive?',
      },
      {
        id: 'Charon',
        name: 'Charon',
        gender: 'Male',
        tone: 'Deep & Authoritative',
        description: 'Low-frequency resonance, steady gravitas, and commanding clarity. Recommended for documentaries, news analysis, and legal briefs.',
        accent: 'Mid-Atlantic',
        bestFor: 'Documentaries, Deep Narration, Broadcasts',
        sampleText: 'In the silence between words lies the weight of intent and deep acoustic precision.',
      },
      {
        id: 'Zephyr',
        name: 'Zephyr',
        gender: 'Female',
        tone: 'Calm & Gentle',
        description: 'Soft-spoken, breathy, and tranquil. Exceptionally soothing for meditation, wellness guides, and ambient readings.',
        accent: 'Standard American',
        bestFor: 'Meditation, Mindfulness, Audio Guides',
        sampleText: 'Take a slow, deep breath, and let the quiet rhythm of the sound ground your focus.',
      },
      {
        id: 'Fenrir',
        name: 'Fenrir',
        gender: 'Male',
        tone: 'Dynamic & Cinematic',
        description: 'Intense, expressive, and compelling. Ideal for dramatic voice acting, trailers, and punchy marketing copy.',
        accent: 'Standard American',
        bestFor: 'Trailers, Video Games, Dramatic Audio',
        sampleText: 'From the edge of the unknown to the frontlines of innovation, we dare to push beyond limits.',
      },
    ];

    res.json({ voices });
  });

  // Text-To-Speech Generation Endpoint
  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const {
        text,
        voiceName = 'Kore',
        style,
        modelType = 'expressive',
      } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text prompt is required.' });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: 'Gemini API key is not configured in environment variables.',
        });
      }

      // Model choice:
      // gemini-3.8-flash-tts is the flagship audio model for expressive voice design & natural cadence
      // gemini-3.8-flash-lite-tts is the high-efficiency model
      const model = modelType === 'standard' ? 'gemini-3.8-flash-lite-tts' : 'gemini-3.8-flash-tts';

      // Build speech request with voice configuration
      const speechPart: any = {
        text: text.trim(),
      };

      if (style && style.trim().length > 0) {
        speechPart.speechMetadata = {
          style: style.trim(),
        };
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            role: 'user',
            parts: [speechPart],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      // Extract WAV binary from unary response candidate
      const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
      const audioBase64 = candidatePart?.inlineData?.data;

      if (!audioBase64) {
        return res.status(502).json({
          error: 'No audio data was returned by the speech model.',
        });
      }

      // Gemini unary TTS returns a 24kHz mono 16-bit WAV file
      return res.json({
        audioBase64: audioBase64,
        mimeType: 'audio/wav',
        voiceName: voiceName,
        modelUsed: model,
        charCount: text.length,
        styleApplied: style || 'Default natural delivery',
      });
    } catch (err: any) {
      console.error('TTS Generation error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to synthesize speech.',
      });
    }
  });

  // Speech-To-Text Transcription Endpoint
  app.post('/api/stt', async (req: Request, res: Response) => {
    try {
      const {
        audioBase64,
        mimeType = 'audio/webm',
        languageHint = 'English',
        promptInstruction,
      } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: 'Audio data is required.' });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: 'Gemini API key is not configured in environment variables.',
        });
      }

      const cleanMimeType = mimeType.split(';')[0].trim() || 'audio/webm';

      const audioPart = {
        inlineData: {
          mimeType: cleanMimeType,
          data: audioBase64,
        },
      };

      const instruction = promptInstruction || 
        `You are a high-precision transcription engine. 
Transcribe the provided audio into accurate, pristine English text.
Apply proper punctuation, sentence capitalization, correct spelling, and natural paragraphing.
Do NOT output any conversational preface, explanation, or tags. Output only the verbatim transcription.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            { text: instruction },
          ],
        },
      });

      const transcript = response.text?.trim() || '';

      const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;

      return res.json({
        transcript: transcript,
        wordCount: wordCount,
        detectedLanguage: languageHint,
      });
    } catch (err: any) {
      console.error('STT Transcription error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to transcribe audio.',
      });
    }
  });

  // Script Nuance & Expressiveness Enhancer Endpoint
  app.post('/api/enhance-script', async (req: Request, res: Response) => {
    try {
      const { text, targetTone = 'conversational' } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required.' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured.' });
      }

      const prompt = `You are an expert voice actor director preparing a script for ultra-natural text-to-speech.
Rewrite the following text so it sounds exceptionally natural when spoken aloud. 
Depending on the requested tone ("${targetTone}"), introduce natural rhythm, rhythmic commas for breath pauses, and where appropriate, subtle natural vocal tags supported by Gemini TTS like:
- "<breath>" for a natural intake of air before key phrases
- "<laugh>" for warm chuckle
- "<sigh>" for relaxed release
- "|mhm|" or "|yeah|" for conversational affirmation

Original text:
"""
${text}
"""

Rules:
1. Preserve the original message and meaning completely.
2. Don't overdo the tags—keep it tasteful and believable.
3. Output ONLY the enhanced script ready to be read aloud. No markdown code blocks, no greetings.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        enhancedText: response.text?.trim() || text,
      });
    } catch (err: any) {
      console.error('Script enhancer error:', err);
      return res.status(500).json({ error: err?.message || 'Failed to enhance script.' });
    }
  });

  // Mount Vite middleware in development or serve static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Augen Voice Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
