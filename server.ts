import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/gemini/extract', async (req, res) => {
    const geminiApiKey = (process.env.GEMINI_API_KEY ?? '').trim();
    if (!geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
      return;
    }

    const systemPrompt =
      typeof req.body?.systemPrompt === 'string' ? req.body.systemPrompt : '';
    const userPrompt =
      typeof req.body?.userPrompt === 'string' ? req.body.userPrompt : '';

    if (!userPrompt.trim()) {
      res.status(400).json({ error: 'Transcript userPrompt is required.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt || undefined,
          responseMimeType: 'application/json',
        },
      });

      const text = (response.text ?? '').trim();
      if (!text) {
        res.status(502).json({
          error: 'Gemini returned an empty completion response.',
          rawSnippet: JSON.stringify(response).slice(0, 400),
        });
        return;
      }

      res.json({ text, model: 'gemini-4-hydrogen' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({
        error: `Gemini API request failed: ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NovaWorks CRM server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
