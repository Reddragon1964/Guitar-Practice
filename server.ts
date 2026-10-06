import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";

function createGenAIClient(apiKey: string) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // 1. Practice Data Analysis Endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { practices, goals, songs } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is missing." });
      }

      const ai = createGenAIClient(apiKey);

      const prompt = `You are an expert guitar coach and data analyst.
Analyze the user's practice data and provide a concise, encouraging, and actionable assessment.
CRITICAL: You must write the entire response strictly in English.

Here is the user's data:
Songs: ${JSON.stringify(songs.map((s: any) => s.title))}
Goals/Milestones: ${JSON.stringify(goals)}
Practice Sessions: ${JSON.stringify(practices)}

Provide:
1. A brief overview of their recent progress (accuracy, speed).
2. Which songs they are doing well on, and which need more work.
3. Are they on track to hit their goals?
4. A specific recommendation for their next practice session.

Keep it structured with bullet points. Don't be too verbose. Limit to about 200-300 words. Everything must be written in English.`;

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

  // 2. Multi-Turn Gemini Chatbot Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], model = "gemini-3.5-flash", systemInstruction } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "A valid message string is required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is missing." });
      }

      const ai = createGenAIClient(apiKey);

      // Map model selection:
      // - gemini-3.1-pro-preview for complex tasks
      // - gemini-3.5-flash (or fallback to gemini-3.8-flash) for general tasks
      // - gemini-3.1-flash-lite for fast tasks
      const allowedModels = [
        "gemini-3.1-pro-preview",
        "gemini-3.5-flash",
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
      ];
      const requestedModel = allowedModels.includes(model) ? model : "gemini-3.8-flash";

      const formattedHistory = Array.isArray(history)
        ? history
            .filter(
              (turn: any) =>
                turn &&
                (turn.role === "user" || turn.role === "model") &&
                typeof turn.text === "string" &&
                turn.text.trim() !== ""
            )
            .map((turn: any) => ({
              role: turn.role as "user" | "model",
              parts: [{ text: turn.text }],
            }))
        : [];

      const runChatWithModel = async (targetModel: string) => {
        const chat = ai.chats.create({
          model: targetModel,
          history: formattedHistory,
          config: {
            systemInstruction:
              `${systemInstruction || "You are an expert guitar coach, music theory mentor, and practice strategist. Help the user improve their guitar playing, accuracy, speed, and musicality."}\n\nCRITICAL LANGUAGE REQUIREMENT: You MUST speak, reply, and generate all content strictly in English. Never use any other language.`,
          },
        });
        return await chat.sendMessage({ message });
      };

      let response;
      let actualModelUsed = requestedModel;
      try {
        response = await runChatWithModel(requestedModel);
      } catch (err: any) {
        const errStr = String(err?.message || err);
        // If gemini-3.5-flash or gemini-3.1-pro-preview encounters a 404/unsupported error, fallback gracefully to gemini-3.8-flash
        if (
          requestedModel !== "gemini-3.8-flash" &&
          (errStr.includes("404") || errStr.includes("NOT_FOUND") || errStr.includes("not found"))
        ) {
          actualModelUsed = "gemini-3.8-flash";
          response = await runChatWithModel("gemini-3.8-flash");
        } else {
          throw err;
        }
      }

      res.json({
        reply: response.text || "I couldn't generate a response. Please try again.",
        modelUsed: actualModelUsed,
      });
    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      res.status(500).json({
        error: error?.message || "Failed to get response from Gemini chatbot.",
      });
    }
  });

  // 3. Live API WebSocket Server (/live) using gemini-3.8-live
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      if (url.pathname === "/live") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
    } catch (err) {
      console.error("WebSocket upgrade error:", err);
    }
  });

  wss.on("connection", (clientWs: WebSocket, request: http.IncomingMessage) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.send(JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server." }));
      clientWs.close();
      return;
    }

    const url = new URL(request.url || "", `http://${request.headers.host}`);
    const voiceParam = url.searchParams.get("voice") || "Zephyr";
    const validVoices = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"];
    const voiceName = validVoices.includes(voiceParam) ? voiceParam : "Zephyr";
    const rawInstruction =
      url.searchParams.get("instruction") ||
      "You are a warm, encouraging real-time guitar practice voice coach. Keep your spoken responses natural, concise, and conversational. Help the guitarist with tempo, rhythm, fretboard technique, chord transitions, and practice motivation.";
    const customInstruction = `${rawInstruction}\n\nCRITICAL LANGUAGE REQUIREMENT: You MUST speak, respond, and transcribe ONLY in English at all times. Never switch to any other language, even if background guitar audio, string buzz, or musical sounds resemble foreign speech.`;

    const ai = createGenAIClient(apiKey);

    const sessionPromise = ai.live.connect({
      model: "gemini-3.8-live",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
        systemInstruction: customInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ status: "connected", model: "gemini-3.8-live", voice: voiceName }));
          }
        },
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // Forward all audio parts in modelTurn
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && Array.isArray(parts)) {
            for (const part of parts) {
              const audioData = part.inlineData?.data;
              if (audioData) {
                clientWs.send(JSON.stringify({ audio: audioData }));
              }
            }
          }

          // Forward interruption signal
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }

          // Forward live audio transcriptions if present
          const inputTranscript = (message.serverContent as any)?.inputTranscription?.text;
          if (inputTranscript) {
            clientWs.send(JSON.stringify({ inputTranscript }));
          }

          const outputTranscript = (message.serverContent as any)?.outputTranscription?.text;
          if (outputTranscript) {
            clientWs.send(JSON.stringify({ outputTranscript }));
          }

          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ turnComplete: true }));
          }
        },
        onerror: (err: any) => {
          console.error("Gemini Live API error:", err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                error: err?.message || "Live voice connection encountered an error.",
              })
            );
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ status: "closed" }));
          }
        },
      },
    });

    sessionPromise.catch((err) => {
      console.error("Failed to connect to Gemini Live session:", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            error: "Failed to initialize gemini-3.8-live session: " + String(err?.message || err),
          })
        );
        clientWs.close();
      }
    });

    clientWs.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        sessionPromise
          .then((session) => {
            if (msg.audio) {
              session.sendRealtimeInput({
                audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
              });
            } else if (msg.text) {
              session.sendRealtimeInput({
                text: msg.text,
              });
            }
          })
          .catch((err) => {
            console.error("Error sending realtime input to Live session:", err);
          });
      } catch (err) {
        console.error("Invalid WebSocket message from client:", err);
      }
    });

    clientWs.on("close", () => {
      sessionPromise
        .then((session) => {
          session.close();
        })
        .catch(() => {});
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
