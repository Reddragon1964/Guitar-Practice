import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  ArrowLeft,
  Radio,
  Sparkles,
  MessageSquare,
  Send,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Practice, Song, Goal } from "../../types";
import { cn } from "../../lib/utils";

interface LiveVoiceCoachModalProps {
  practices: Practice[];
  songs: Song[];
  goals: Goal[];
  onOpenChatbot: () => void;
  onBack: () => void;
}

type VoiceName = "Zephyr" | "Puck" | "Kore" | "Fenrir" | "Charon";

interface TranscriptEntry {
  id: string;
  speaker: "user" | "coach";
  text: string;
  timestamp: number;
}

const VOICE_OPTIONS: { name: VoiceName; description: string }[] = [
  { name: "Zephyr", description: "Warm, balanced & encouraging coach" },
  { name: "Kore", description: "Clear, articulate & structured instructor" },
  { name: "Puck", description: "Energetic, upbeat practice partner" },
  { name: "Fenrir", description: "Deep, steady rhythm & technique mentor" },
  { name: "Charon", description: "Calm, analytical music theory guide" },
];

// Convert Float32 [-1..1] audio buffer to base64 16-bit little-endian PCM
function float32ToPcm16Base64(float32Array: Float32Array): string {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Decode base64 16-bit little-endian PCM into Float32Array
function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768;
  }
  return float32;
}

export const LiveVoiceCoachModal: React.FC<LiveVoiceCoachModalProps> = ({
  practices,
  songs,
  goals,
  onOpenChatbot,
  onBack,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>("Zephyr");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [quickTextPrompt, setQuickTextPrompt] = useState("");

  // Refs for audio & WebSocket to avoid stale closures in onaudioprocess / onmessage
  const wsRef = useRef<WebSocket | null>(null);
  const isMicMutedRef = useRef<boolean>(false);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Build concise system instruction with user's guitar context
  const liveSystemInstruction = useMemo(() => {
    const activeSongTitles = songs
      .filter((s) => !s.retired)
      .map((s) => s.title)
      .slice(0, 8);
    const recentSummary = practices.slice(0, 5).map((p) => ({
      song: p.songTitle,
      lvl: p.difficulty,
      acc: `${p.accuracy}%`,
      spd: `${p.speed}%`,
    }));
    const activeGoals = goals
      .filter((g) => !g.achieved)
      .slice(0, 4)
      .map((g) => g.title);

    return `You are a real-time interactive Guitar Practice Voice Coach powered by gemini-3.8-live. Speak naturally, concisely, and encouragingly.
Player's active songs: ${activeSongTitles.join(", ") || "None yet"}.
Recent sessions: ${JSON.stringify(recentSummary)}.
Goals: ${activeGoals.join(", ") || "General improvement"}.
Help the player with live practice check-ins, rhythm/tempo coaching, chord transitions, and motivation.`;
  }, [songs, practices, goals]);

  const stopAllPlayback = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current.clear();
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    setIsModelSpeaking(false);
  };

  const playAudioChunk = (base64Audio: string) => {
    const outputCtx = outputAudioCtxRef.current;
    if (!outputCtx) return;

    if (outputCtx.state === "suspended") {
      outputCtx.resume().catch(() => {});
    }

    const float32Data = pcm16Base64ToFloat32(base64Audio);
    if (float32Data.length === 0) return;

    const audioBuffer = outputCtx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = outputCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputCtx.destination);

    // Gapless scheduling using nextStartTimeRef
    const now = outputCtx.currentTime;
    const startTime = Math.max(now, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    activeSourcesRef.current.add(source);
    setIsModelSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0) {
        setIsModelSpeaking(false);
      }
    };
  };

  const cleanupSession = () => {
    stopAllPlayback();

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsModelSpeaking(false);
    setMicLevel(0);
  };

  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, []);

  const appendTranscript = (speaker: "user" | "coach", text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker && Date.now() - last.timestamp < 5000) {
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            text: `${last.text} ${cleaned}`.replace(/\s+/g, " ").trim(),
            timestamp: Date.now(),
          },
        ];
      }
      return [
        ...prev,
        {
          id: `${speaker}-${Date.now()}-${Math.random()}`,
          speaker,
          text: cleaned,
          timestamp: Date.now(),
        },
      ];
    });
  };

  const startLiveConversation = async () => {
    if (isConnected || isConnecting) return;
    setErrorMessage(null);
    setIsConnecting(true);

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Initialize 16kHz input AudioContext and 24kHz output AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 3. Connect WebSocket to server /live endpoint
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/live?voice=${encodeURIComponent(
        selectedVoice
      )}&instruction=${encodeURIComponent(liveSystemInstruction)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setIsConnected(true);

        // Start microphone PCM streaming
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (isMicMutedRef.current) {
            setMicLevel(0);
            return;
          }
          const channelData = e.inputBuffer.getChannelData(0);

          // Compute RMS level for visual meter
          let sumSq = 0;
          for (let i = 0; i < channelData.length; i += 8) {
            sumSq += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sumSq / (channelData.length / 8));
          setMicLevel(Math.min(100, Math.round(rms * 350)));

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const base64Audio = float32ToPcm16Base64(channelData);
            wsRef.current.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.interrupted) {
            stopAllPlayback();
          }
          if (msg.inputTranscript) {
            appendTranscript("user", msg.inputTranscript);
          }
          if (msg.outputTranscript) {
            appendTranscript("coach", msg.outputTranscript);
          }
          if (msg.error) {
            setErrorMessage(msg.error);
          }
        } catch (err) {
          console.error("Failed to parse Live WebSocket message:", err);
        }
      };

      ws.onerror = () => {
        setErrorMessage("WebSocket connection error while communicating with Live API.");
        cleanupSession();
      };

      ws.onclose = () => {
        cleanupSession();
      };
    } catch (err: any) {
      console.error("Error starting Live Voice session:", err);
      setErrorMessage(
        err?.message ||
          "Could not access microphone or connect to Live API. Please check microphone permissions."
      );
      cleanupSession();
    }
  };

  const handleSendTextToLive = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTextPrompt.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text: trimmed }));
    appendTranscript("user", trimmed);
    setQuickTextPrompt("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
            <Radio className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Live Voice Guitar Coach
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
                gemini-3.8-live
              </span>
            </h2>
            <p className="text-xs text-indigo-300/80 mt-0.5">
              Have a real-time, low-latency voice conversation with your AI guitar coach while you practice
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              cleanupSession();
              onOpenChatbot();
            }}
            className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800"
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Text Chatbot
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              cleanupSession();
              onBack();
            }}
            className="text-indigo-300 hover:text-indigo-100 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Live Studio Card */}
      <Card className="border-indigo-700/80 bg-slate-950/90 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-indigo-800/70 bg-indigo-950/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "w-3 h-3 rounded-full",
                isConnected
                  ? "bg-emerald-400 animate-ping"
                  : isConnecting
                  ? "bg-amber-400 animate-pulse"
                  : "bg-indigo-600"
              )}
            />
            <CardTitle className="text-base text-white">
              {isConnected
                ? "Live Session Active — Speak into your microphone"
                : isConnecting
                ? "Connecting to gemini-3.8-live..."
                : "Ready to start voice conversation"}
            </CardTitle>
          </div>

          {/* Voice Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-indigo-300 font-medium whitespace-nowrap">
              Coach Voice:
            </label>
            <Select
              disabled={isConnected || isConnecting}
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
              className="h-9 text-xs w-48 bg-slate-950 border-indigo-700"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} — {v.description}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Visualizer & Call Controls */}
          <div className="flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-slate-950/90 border border-indigo-800/60 space-y-6">
            {/* Animated Orb */}
            <div className="relative flex items-center justify-center">
              <div
                className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isConnected
                    ? isModelSpeaking
                      ? "bg-emerald-500/20 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.45)] scale-105"
                      : "bg-indigo-500/20 border-indigo-400 shadow-[0_0_35px_rgba(99,102,241,0.35)]"
                    : "bg-indigo-950/60 border-indigo-800/70"
                )}
              >
                {isModelSpeaking ? (
                  <Volume2 className="w-12 h-12 text-emerald-300 animate-bounce" />
                ) : isConnected ? (
                  isMicMuted ? (
                    <MicOff className="w-12 h-12 text-rose-400" />
                  ) : (
                    <Mic className="w-12 h-12 text-indigo-300" />
                  )
                ) : (
                  <Radio className="w-12 h-12 text-indigo-500" />
                )}
              </div>
            </div>

            {/* Mic Level Bar */}
            {isConnected && (
              <div className="w-full max-w-xs space-y-1.5 text-center">
                <div className="flex items-center justify-between text-[11px] font-mono text-indigo-300">
                  <span>{isMicMuted ? "Microphone Muted" : "Mic Input (16kHz PCM)"}</span>
                  <span>
                    {isModelSpeaking ? "Coach Speaking (24kHz)" : `${micLevel}%`}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-indigo-800/70">
                  <div
                    className={cn(
                      "h-full transition-all duration-75 rounded-full",
                      isModelSpeaking
                        ? "bg-emerald-400 w-full animate-pulse"
                        : isMicMuted
                        ? "bg-rose-500 w-0"
                        : "bg-indigo-400"
                    )}
                    style={!isModelSpeaking && !isMicMuted ? { width: `${micLevel}%` } : undefined}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isConnected ? (
                <Button
                  size="lg"
                  disabled={isConnecting}
                  onClick={startLiveConversation}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 gap-2 shadow-lg shadow-emerald-950/60"
                >
                  <PhoneCall className="w-5 h-5" />
                  {isConnecting ? "Connecting to Live API..." : "Start Voice Conversation"}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMicMuted((prev) => !prev)}
                    className={cn(
                      "gap-2 border-indigo-700",
                      isMicMuted
                        ? "bg-rose-950/60 border-rose-600 text-rose-200 hover:bg-rose-900/60"
                        : "bg-indigo-950/70 text-indigo-100 hover:bg-indigo-900"
                    )}
                  >
                    {isMicMuted ? (
                      <>
                        <MicOff className="w-4 h-4 text-rose-400" /> Unmute Mic
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-emerald-400" /> Mute Mic
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={cleanupSession}
                    className="gap-2 px-6"
                  >
                    <PhoneOff className="w-4 h-4" /> End Conversation
                  </Button>
                </>
              )}
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs max-w-lg">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Live Transcript & Quick Text Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Real-Time Voice Transcript
              </span>
              {transcripts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTranscripts([])}
                  className="text-xs text-indigo-400 hover:text-indigo-200 underline"
                >
                  Clear transcript
                </button>
              )}
            </div>

            <div className="h-52 overflow-y-auto rounded-xl border border-indigo-800/70 bg-slate-950/80 p-4 space-y-2.5 dialog-scrollbar">
              {transcripts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-xs text-indigo-400/80">
                  {isConnected
                    ? "Say hello or ask your coach for a practice drill — live speech transcription will appear here."
                    : "Click 'Start Voice Conversation' above to talk hands-free with gemini-3.8-live while holding your guitar."}
                </div>
              ) : (
                transcripts.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "p-2.5 rounded-xl text-xs max-w-[85%]",
                      entry.speaker === "user"
                        ? "ml-auto bg-indigo-600/30 border border-indigo-500/40 text-indigo-100"
                        : "mr-auto bg-emerald-950/60 border border-emerald-700/50 text-emerald-100"
                    )}
                  >
                    <div className="font-semibold text-[10px] uppercase tracking-wider mb-0.5 opacity-75">
                      {entry.speaker === "user" ? "You" : `Coach (${selectedVoice})`}
                    </div>
                    <div>{entry.text}</div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {isConnected && (
              <form onSubmit={handleSendTextToLive} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={quickTextPrompt}
                  onChange={(e) => setQuickTextPrompt(e.target.value)}
                  placeholder="Or type a message to send into the live voice session..."
                  className="flex-1 h-9 text-xs bg-slate-950 border-indigo-700"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!quickTextPrompt.trim()}
                  className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
