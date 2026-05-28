/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom user agent and lazy API key validation
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (aiClient) return aiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it in the Secrets panel.');
  }
  aiClient = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Assistant endpoint
app.post('/api/gemini/assistant', async (req, res) => {
  try {
    const { mode, topics, problemStats, studySessions, projects, customPrompt } = req.body;
    const ai = getGeminiClient();

    let systemInstruction = "You are a professional, motivating AI study and productivity personal coach. You help students build robust schedules, learn hard topics, and stay highly consistent. Use friendly, supportive, yet outcome-oriented language.";
    let contents = "";

    const contextStr = `
- Current topics: ${JSON.stringify(topics || [])}
- Solved Coding Problems: ${JSON.stringify(problemStats || {})}
- Study Sessions: ${JSON.stringify(studySessions || [])}
- Live Projects: ${JSON.stringify(projects || [])}
`;

    if (mode === 'chat') {
      const userMessage = req.body.message || "Give me quick motivation";
      contents = `Answer this study productivity question: "${userMessage}" in relation to my current progress: ${contextStr}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: { systemInstruction }
      });
      
      return res.json({ response: response.text || "I'm with you! Keep studying." });
    }

    if (mode === 'schedule_suggestions') {
      contents = `Based on my current active topics and schedule data, suggest an optimized weekly timetable schedule. ${contextStr}`;
    } else if (mode === 'study_plan') {
      contents = `Create a structured study guide and step-by-step revision plan for my current topics. ${contextStr}`;
    } else if (mode === 'performance_analysis') {
      contents = `Analyze my current productivity, study patterns, and coding statistics. Highlight weak areas (e.g. if I am not solving enough medium/hard problems or neglecting revision) and provide specific recovery actions. ${contextStr}`;
    } else {
      contents = `Answer this study productivity question: "${customPrompt || 'Give me quick motivation'}" in relation to my current progress: ${contextStr}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: "A short, micro-motivational display title or punchy headline summarizing the response.",
            },
            summary: {
              type: Type.STRING,
              description: "A motivating and highly scannable introductory paragraph of feedback.",
            },
            points: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-5 high-impact, actionable study checklist recommendation bullet points.",
            },
            additionalMarkdown: {
              type: Type.STRING,
              description: "A detailed markdown block (e.g., custom schedules, tables, revision timelines, or comprehensive suggestions)."
            }
          },
          required: ["headline", "summary", "points", "additionalMarkdown"],
        }
      }
    });

    const responseText = response.text || "{}";
    res.json(JSON.parse(responseText.trim()));
  } catch (error: any) {
    console.error('Error in AI Assistant route:', error);
    res.status(500).json({
      error: error.message || 'Failed to call Gemini API'
    });
  }
});

// Setup Vite Dev server or production static assets distribution
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Study Dashboard Server running at http://localhost:${PORT}`);
  });
}

initServer().catch(console.error);
