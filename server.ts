import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
// We use the new SDK as recommended.
// It will pick up GEMINI_API_KEY from the environment automatically if present.
let ai: GoogleGenAI | null = null;
try {
  ai = new GoogleGenAI();
} catch (e) {
  console.log("Could not initialize Gemini. Make sure GEMINI_API_KEY is set.");
}

app.post('/api/analyze', async (req, res) => {
  if (!ai) {
    try {
      ai = new GoogleGenAI();
    } catch (e) {
      return res.status(500).json({ error: 'Gemini API not configured. Please add GEMINI_API_KEY.' });
    }
  }

  try {
    const { code, language, analysisTypes } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const prompt = `
You are an expert Senior Software Architect and Security Engineer.
Please analyze the following ${language} code.

The user wants to perform an analysis focusing on: ${analysisTypes.join(', ')}

Provide a detailed JSON response analyzing the code. Look for bugs, security vulnerabilities, and optimizations. Also provide 4 scores out of 100 for readability, maintainability, security, and performance.

Output MUST be a valid JSON object matching exactly this schema, without any markdown formatting or \`\`\`json block. Just the raw JSON.

{
  "scores": {
    "readability": number,
    "maintainability": number,
    "security": number,
    "performance": number,
    "overall": number
  },
  "bugs": [
    {
      "severity": "High" | "Medium" | "Low",
      "line": number | "General",
      "issue": "string",
      "suggestedFix": "string"
    }
  ],
  "vulnerabilities": [
    {
      "riskLevel": "Critical" | "High" | "Medium" | "Low",
      "name": "string",
      "impact": "string",
      "recommendation": "string"
    }
  ],
  "optimizations": [
    {
      "type": "Performance" | "Memory" | "Database" | "Architecture",
      "suggestion": "string"
    }
  ],
  "reviewSummary": "A paragraph summarizing the overall code quality."
}

CODE TO ANALYZE:
${code.substring(0, 50000)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text();
    if (!resultText) {
      throw new Error('No response from Gemini API');
    }

    const parsedResult = JSON.parse(resultText);

    res.json(parsedResult);
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ error: error.message || 'Failed to analyze code' });
  }
});

// Mock Endpoints for History / Dashboard
const mockHistory = [
  { id: '1', project: 'AuthService', language: 'Python', bugs: 3, vulnerabilities: 1, score: 78, date: '2026-06-18' },
  { id: '2', project: 'UserDashboard', language: 'JavaScript', bugs: 0, vulnerabilities: 0, score: 95, date: '2026-06-17' },
  { id: '3', project: 'PaymentGateway', language: 'Java', bugs: 5, vulnerabilities: 2, score: 62, date: '2026-06-15' },
];

app.get('/api/history', (req, res) => {
  res.json(mockHistory);
});


// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
