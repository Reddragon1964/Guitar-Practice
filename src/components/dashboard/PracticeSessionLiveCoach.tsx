import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  Radio,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Send,
  MessageSquare,
} from "lucide-react";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

type VoiceName = "Zephyr" | "Puck" | "Kore" | "Fenrir" | "Charon";

interface TranscriptEntry {
  id: string;
  speaker: "user" | "coach";
  text: string;
  timestamp: number;
}

const VOICE_OPTIONS: { name: VoiceName; label: string }[] = [
  { name: "Zephyr", label: "Zephyr (Warm & Encouraging)" },
  { name: "Kore", label: "Kore (Clear & Structured)" },
  { name: "Puck", label: "Puck (Upbeat Partner)" },
  { name: "Fenrir", label: "Fenrir (Steady Rhythm Coach)" },
  { name: "Charon", label: "Charon (Calm & Analytical)" },
];

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

interface PracticeSessionLiveCoachProps {
  songTitle: string;
  difficulty: number;
  speed: string;
  duration: string;
  isTimerRunning?: boolean;
}

export const PracticeSessionLiveCoach: React.FC<PracticeSessionLiveCoachProps> = ({
  songTitle,
  difficulty,
  speed,
  duration,
  isTimerRunning = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>("Zephyr");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [micLevel, setMicLevel] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [quickTextPrompt, setQuickTextPrompt] = useState<string>("");

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

  // Enumerate audio input devices (microphones)
  const loadAudioDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((d) => d.kind === "audioinput");
      setAudioDevices(mics);
      if (mics.length > 0) {
        setSelectedMicId((prev) => {
          if (prev && mics.some((m) => m.deviceId === prev)) return prev;
          const defaultMic = mics.find((m) => m.deviceId === "default") || mics[0];
          return defaultMic.deviceId;
        });
      }
    } catch (err) {
      console.error("Failed to enumerate audio input devices:", err);
    }
  };

  useEffect(() => {
    loadAudioDevices();
    const handleDeviceChange = () => {
      loadAudioDevices();
    };
    navigator.mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Build live session system instruction with current dialog context
  const liveSystemInstruction = useMemo(() => {
    const currentSong = songTitle.trim() || "Freestyle practice / warmup";
    const currentSpeed = speed.trim() ? `${speed.trim()}%` : "100%";
    const currentLvl = difficulty || 1;
    const currentDur = duration.trim() || "0:00";

    return `You are a real-time interactive Guitar Practice Voice Coach (gemini-3.8-live) coaching a guitarist who is actively practicing right now with their session dialog open.
Current Session Details:
- Active Song / Exercise: "${currentSong}"
- Difficulty Level: ${currentLvl}/12
- Target Tempo Speed: ${currentSpeed}
- Elapsed Time: ${currentDur}
${isTimerRunning ? "- Practice timer is currently running!" : ""}

CRITICAL LANGUAGE REQUIREMENT: You MUST speak, reply, and generate all output and transcriptions strictly in ENGLISH at all times. Never switch to any other language, even if background acoustic or electric guitar sounds, picking noises, or harmonics are heard.

Keep all your verbal responses natural, brief, conversational, and encouraging. You are listening to the guitarist play and talk. Offer tempo guidance, count-ins (e.g. '1, 2, 3, 4'), relaxation tips for fret-hand tension, and positive reinforcement!`;
  }, [songTitle, difficulty, speed, duration, isTimerRunning]);

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
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
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

  const startLiveCoach = async () => {
    if (isConnected || isConnecting) return;
    setErrorMessage(null);
    setIsConnecting(true);

    try {
      const audioConstraints: MediaTrackConstraints = {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };
      if (selectedMicId) {
        audioConstraints.deviceId = { exact: selectedMicId };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      mediaStreamRef.current = stream;

      // Refresh devices with actual human labels now that permission is granted
      loadAudioDevices();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/live?voice=${encodeURIComponent(
        selectedVoice
      )}&instruction=${encodeURIComponent(liveSystemInstruction)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setIsConnected(true);
        setIsExpanded(true);

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
          console.error("Live message parse error:", err);
        }
      };

      ws.onerror = () => {
        setErrorMessage("Connection error to gemini-3.8-live.");
        cleanupSession();
      };

      ws.onclose = () => {
        cleanupSession();
      };
    } catch (err: any) {
      console.error("Live coach start error:", err);
      setErrorMessage(
        err?.message ||
          "Could not access microphone for live coaching. Please verify microphone permissions."
      );
      cleanupSession();
    }
  };

  const handleMicChange = async (newDeviceId: string) => {
    setSelectedMicId(newDeviceId);
    if (isConnected && inputAudioCtxRef.current) {
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: newDeviceId ? { exact: newDeviceId } : undefined,
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = newStream;
        if (scriptProcessorRef.current && inputAudioCtxRef.current) {
          const newSource = inputAudioCtxRef.current.createMediaStreamSource(newStream);
          newSource.connect(scriptProcessorRef.current);
        }
        loadAudioDevices();
      } catch (err: any) {
        console.error("Failed to switch microphone:", err);
        setErrorMessage("Could not switch to selected microphone: " + (err?.message || "error"));
      }
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTextPrompt.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text: trimmed }));
    appendTranscript("user", trimmed);
    setQuickTextPrompt("");
  };

  return (
    <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-indigo-950/40 to-slate-950/70 p-3 sm:p-3.5 space-y-3 transition-all shadow-md">
      {/* Header bar of Live Coach widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
              isConnected
                ? isModelSpeaking
                  ? "bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                : "bg-indigo-950/60 border-indigo-700/60 text-indigo-400"
            )}
          >
            {isModelSpeaking ? (
              <Volume2 className="w-4 h-4 text-emerald-300 animate-bounce" />
            ) : isConnected ? (
              <Radio className="w-4 h-4 text-emerald-400" />
            ) : (
              <Mic className="w-4 h-4 text-emerald-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                Practice with Live Coach
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-600/70 text-emerald-300 font-normal">
                  gemini-3.8-live
                </span>
              </span>
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected
                    ? isModelSpeaking
                      ? "bg-emerald-400 animate-ping"
                      : "bg-emerald-400"
                    : isConnecting
                    ? "bg-amber-400 animate-pulse"
                    : "bg-slate-600"
                )}
              />
            </div>
            <p className="text-[11px] text-indigo-300/80">
              {isConnected
                ? isModelSpeaking
                  ? "Coach is speaking..."
                  : isMicMuted
                  ? "Microphone is muted (Coach listening paused)"
                  : `Listening while you play ${songTitle ? `"${songTitle}"` : "your guitar"}`
                : "Talk hands-free with your AI coach while practicing"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button
              type="button"
              size="sm"
              disabled={isConnecting}
              onClick={startLiveCoach}
              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-md shadow-emerald-950/50"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{isConnecting ? "Connecting..." : "Start Live Coach"}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMicMuted((prev) => !prev)}
                className={cn(
                  "h-8 text-xs gap-1 border-emerald-700/60",
                  isMicMuted
                    ? "bg-rose-950/60 border-rose-600 text-rose-200 hover:bg-rose-900/60"
                    : "bg-indigo-950/80 text-indigo-200 hover:bg-indigo-900"
                )}
                title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="hidden sm:inline">{isMicMuted ? "Unmute" : "Mute"}</span>
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={cleanupSession}
                className="h-8 text-xs gap-1 px-2.5"
                title="End live voice session"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">End Coach</span>
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-md text-indigo-400 hover:text-white hover:bg-indigo-900/40 transition-colors"
            title={isExpanded ? "Collapse Live Coach" : "Expand Live Coach"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded controls & live feedback */}
      {isExpanded && (
        <div className="space-y-2.5 pt-1 border-t border-emerald-900/40 animate-in fade-in duration-150">
          {/* Top row: Voice selector + Microphone selector + audio visualizer bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              {/* Voice Persona Dropdown */}
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] text-indigo-300 font-medium whitespace-nowrap">
                  Voice:
                </label>
                <Select
                  disabled={isConnected || isConnecting}
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
                  className="h-7 text-xs w-40 bg-slate-950/90 border-indigo-700/80 py-0.5"
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Microphone Selection Dropdown */}
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] text-indigo-300 font-medium whitespace-nowrap flex items-center gap-1">
                  <Mic className="w-3 h-3 text-emerald-400" />
                  Microphone:
                </label>
                <Select
                  value={selectedMicId}
                  onChange={(e) => handleMicChange(e.target.value)}
                  className="h-7 text-xs w-48 sm:w-56 bg-slate-950/90 border-indigo-700/80 py-0.5 truncate"
                  title="Select audio input microphone"
                >
                  {audioDevices.length === 0 ? (
                    <option value="">Default Microphone</option>
                  ) : (
                    audioDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || `Microphone ${idx + 1}`}
                      </option>
                    ))
                  )}
                </Select>
              </div>
            </div>

            {isConnected && (
              <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                <span className="text-[10px] font-mono text-indigo-300 whitespace-nowrap">
                  {isModelSpeaking ? "Speaking" : isMicMuted ? "Muted" : "Mic Level"}
                </span>
                <div className="h-1.5 flex-1 rounded-full bg-slate-900 overflow-hidden border border-indigo-800/80">
                  <div
                    className={cn(
                      "h-full transition-all duration-75 rounded-full",
                      isModelSpeaking
                        ? "bg-emerald-400 w-full animate-pulse"
                        : isMicMuted
                        ? "bg-rose-500 w-0"
                        : "bg-emerald-400"
                    )}
                    style={!isModelSpeaking && !isMicMuted ? { width: `${micLevel}%` } : undefined}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real-time transcript box when connected */}
          {isConnected && (
            <div className="space-y-1.5">
              <div className="h-28 overflow-y-auto rounded-lg border border-indigo-800/80 bg-slate-950/90 p-2.5 space-y-1.5 dialog-scrollbar text-xs">
                {transcripts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-[11px] text-indigo-400/80">
                    Live Coach is connected! Say <em>"Hey Coach, give me a count-in for {songTitle || 'my song'}"</em> or ask for quick tempo feedback.
                  </div>
                ) : (
                  transcripts.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "p-1.5 rounded-md text-[11px] max-w-[90%]",
                        entry.speaker === "user"
                          ? "ml-auto bg-indigo-600/30 border border-indigo-500/40 text-indigo-100"
                          : "mr-auto bg-emerald-950/70 border border-emerald-700/60 text-emerald-100"
                      )}
                    >
                      <div className="font-semibold text-[9px] uppercase tracking-wider opacity-75">
                        {entry.speaker === "user" ? "You" : `Coach (${selectedVoice})`}
                      </div>
                      <div>{entry.text}</div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Quick text input into active session */}
              <form onSubmit={handleSendText} className="flex items-center gap-1.5">
                <Input
                  type="text"
                  value={quickTextPrompt}
                  onChange={(e) => setQuickTextPrompt(e.target.value)}
                  placeholder="Or type a question for the live coach..."
                  className="flex-1 h-7 text-xs bg-slate-950/90 border-indigo-700/80 py-0"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!quickTextPrompt.trim()}
                  className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </Button>
              </form>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
