import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API routes FIRST
  app.post("/api/analyze", async (req, res) => {
    try {
      const { practices, goals, songs } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is missing." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an expert guitar coach and data analyst.
Analyze the user's practice data and provide a concise, encouraging, and actionable assessment.

Here is the user's data:
Songs: ${JSON.stringify(songs.map((s: any) => s.title))}
Goals/Milestones: ${JSON.stringify(goals)}
Practice Sessions: ${JSON.stringify(practices)}

Provide:
1. A brief overview of their recent progress (accuracy, speed).
2. Which songs they are doing well on, and which need more work.
3. Are they on track to hit their goals?
4. A specific recommendation for their next practice session.

Keep it structured with bullet points. Don't be too verbose. Limit to about 200-300 words.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: "Failed to generate analysis. " + String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
