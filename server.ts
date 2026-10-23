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

  // Helper to build a data-driven guitar coaching assessment from user practice logs
  function buildDataDrivenAssessment(practices: any[] = [], goals: any[] = [], songs: any[] = []): string {
    const safePractices = Array.isArray(practices) ? practices : [];
    const safeGoals = Array.isArray(goals) ? goals : [];
    const safeSongs = Array.isArray(songs) ? songs : [];

    if (safePractices.length === 0) {
      return [
        "### Practice Progress Overview",
        "- No practice sessions have been logged yet. Start by recording your first session with note accuracy, speed (% tempo), and difficulty level.",
        "",
        "### Song Performance Breakdown",
        `- You currently have **${safeSongs.length}** song(s) in your repertoire${safeSongs.length > 0 ? ` (${safeSongs.slice(0, 5).map((s: any) => s.title).join(", ")})` : ""}.`,
        "",
        "### Goal & Milestone Status",
        `- Active goals configured: **${safeGoals.filter((g: any) => !g.achieved).length}** pending, **${safeGoals.filter((g: any) => g.achieved).length}** achieved.`,
        "",
        "### Next Session Recommendation",
        "- Pick one song from your library, set your metronome to a comfortable 75%–85% speed, and log a baseline accuracy session focusing on clean note articulation."
      ].join("\n");
    }

    const sorted = [...safePractices].sort((a, b) => {
      const dateCmp = String(b.date || "").localeCompare(String(a.date || ""));
      if (dateCmp !== 0) return dateCmp;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });

    const totalSessions = sorted.length;
    const avgAccuracy =
      sorted.reduce((sum, p) => sum + (Number(p.accuracy) || 0), 0) / totalSessions;
    const avgSpeed =
      sorted.reduce((sum, p) => sum + (Number(p.speed) || 0), 0) / totalSessions;

    const recentSlice = sorted.slice(0, Math.min(10, totalSessions));
    const recentAccuracy =
      recentSlice.reduce((sum, p) => sum + (Number(p.accuracy) || 0), 0) / recentSlice.length;
    const recentSpeed =
      recentSlice.reduce((sum, p) => sum + (Number(p.speed) || 0), 0) / recentSlice.length;
    const accDelta = recentAccuracy - avgAccuracy;

    // Group by song
    const songStats = new Map<
      string,
      { count: number; totalAcc: number; bestAcc: number; totalSpeed: number; maxDiff: number }
    >();
    for (const p of sorted) {
      const title = String(p.songTitle || "Untitled").trim();
      const curr = songStats.get(title) || {
        count: 0,
        totalAcc: 0,
        bestAcc: 0,
        totalSpeed: 0,
        maxDiff: 1,
      };
      const acc = Number(p.accuracy) || 0;
      const spd = Number(p.speed) || 0;
      const diff = Number(p.difficulty) || 1;
      curr.count += 1;
      curr.totalAcc += acc;
      curr.bestAcc = Math.max(curr.bestAcc, acc);
      curr.totalSpeed += spd;
      curr.maxDiff = Math.max(curr.maxDiff, diff);
      songStats.set(title, curr);
    }

    const songSummaries = Array.from(songStats.entries()).map(([title, st]) => ({
      title,
      count: st.count,
      avgAcc: st.totalAcc / st.count,
      bestAcc: st.bestAcc,
      avgSpeed: st.totalSpeed / st.count,
      maxDiff: st.maxDiff,
    }));

    const strongestSongs = [...songSummaries]
      .sort((a, b) => b.avgAcc - a.avgAcc)
      .slice(0, 3);
    const focusSongs = [...songSummaries]
      .sort((a, b) => a.avgAcc - b.avgAcc)
      .slice(0, 3);

    const activeGoals = safeGoals.filter((g: any) => !g.achieved);
    const achievedGoals = safeGoals.filter((g: any) => g.achieved);
    const primaryFocus = focusSongs[0] || strongestSongs[0];

    return [
      "### 1. Recent Progress Overview",
      `- **Total Logged Sessions:** ${totalSessions} sessions across ${songSummaries.length} song(s).`,
      `- **Overall Average:** **${avgAccuracy.toFixed(1)}%** accuracy at **${avgSpeed.toFixed(0)}%** speed.`,
      `- **Recent Form (Last ${recentSlice.length} Sessions):** **${recentAccuracy.toFixed(1)}%** accuracy (${accDelta >= 0 ? `+${accDelta.toFixed(1)}%` : `${accDelta.toFixed(1)}%`} vs. historical average) at **${recentSpeed.toFixed(0)}%** tempo.`,
      "",
      "### 2. Song Performance Breakdown",
      strongestSongs.length > 0
        ? `- **Strongest Material:** ${strongestSongs
            .map(
              (s) =>
                `**${s.title}** (${s.avgAcc.toFixed(1)}% avg, ${s.bestAcc.toFixed(1)}% peak over ${s.count} session${s.count === 1 ? "" : "s"})`
            )
            .join("; ")}.`
        : "- **Strongest Material:** Keep logging sessions to establish song benchmarks.",
      focusSongs.length > 0
        ? `- **Needs Extra Focus:** ${focusSongs
            .map(
              (s) =>
                `**${s.title}** (${s.avgAcc.toFixed(1)}% avg at ${s.avgSpeed.toFixed(0)}% speed, Level ${s.maxDiff})`
            )
            .join("; ")}.`
        : "",
      "",
      "### 3. Goals & Milestones Status",
      `- You have completed **${achievedGoals.length}** milestone(s) with **${activeGoals.length}** active target(s) in progress.`,
      recentAccuracy >= 90
        ? "- Your recent accuracy is above 90%, keeping you well on track for your upcoming accuracy and tempo milestones."
        : "- Focus on stabilizing note accuracy above 90% before pushing tempo increments to stay on schedule for your milestones.",
      "",
      "### 4. Specific Next-Session Recommendation",
      primaryFocus
        ? `- Dedicate 15 minutes in your next session to **${primaryFocus.title}** at **${Math.max(
            60,
            Math.round(primaryFocus.avgSpeed - 5)
          )}%** speed. Isolate the toughest transition bars until you hit 3 consecutive clean repetitions at **95%+** accuracy, then bring tempo back up to **${Math.round(
            primaryFocus.avgSpeed + 5
          )}%**.`
        : "- Start your next practice with a 5-minute chromatic warm-up, then target your lowest-accuracy passage at 80% speed until note accuracy exceeds 92%."
    ]
      .filter(Boolean)
      .join("\n");
  }

  // 1. Practice Data Analysis Endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { practices = [], goals = [], songs = [] } = req.body || {};
      const safePractices = Array.isArray(practices) ? practices : [];
      const safeGoals = Array.isArray(goals) ? goals : [];
      const safeSongs = Array.isArray(songs) ? songs : [];

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          analysis: buildDataDrivenAssessment(safePractices, safeGoals, safeSongs),
        });
      }

      const ai = createGenAIClient(apiKey);

      // Bound practices sent to the prompt to the 60 most recent sessions to prevent payload overflow
      const recentPractices = [...safePractices]
        .sort((a: any, b: any) => {
          const d = String(b.date || "").localeCompare(String(a.date || ""));
          return d !== 0 ? d : Number(b.createdAt || 0) - Number(a.createdAt || 0);
        })
        .slice(0, 60)
        .map((p: any) => ({
          songTitle: p.songTitle,
          date: p.date,
          accuracy: p.accuracy,
          speed: p.speed,
          difficulty: p.difficulty,
          duration: p.duration,
          score: p.score,
          note: p.note,
        }));

      const prompt = `You are an expert guitar coach and data analyst.
Analyze the user's practice data and provide a concise, encouraging, and actionable assessment.
CRITICAL: You must write the entire response strictly in English.

Here is the user's data:
Total Logged Sessions: ${safePractices.length}
Songs: ${JSON.stringify(safeSongs.map((s: any) => s.title))}
Goals/Milestones: ${JSON.stringify(safeGoals)}
Recent Practice Sessions (up to 60 most recent): ${JSON.stringify(recentPractices)}

Provide:
1. A brief overview of their recent progress (accuracy, speed).
2. Which songs they are doing well on, and which need more work.
3. Are they on track to hit their goals?
4. A specific recommendation for their next practice session.

Keep it structured with bullet points. Don't be too verbose. Limit to about 200-300 words. Everything must be written in English.`;

      const candidateModels = [
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
      ];

      let generatedText = "";
      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });
          if (response?.text && response.text.trim()) {
            generatedText = response.text.trim();
            break;
          }
        } catch (modelErr) {
          console.warn(`Analyze with ${modelName} failed, trying next fallback...`, modelErr);
        }
      }

      if (!generatedText) {
        generatedText = buildDataDrivenAssessment(safePractices, safeGoals, safeSongs);
      }

      res.json({ analysis: generatedText });
    } catch (error) {
      console.error("Error in /api/analyze:", error);
      const { practices = [], goals = [], songs = [] } = req.body || {};
      res.json({
        analysis: buildDataDrivenAssessment(practices, goals, songs),
      });
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
