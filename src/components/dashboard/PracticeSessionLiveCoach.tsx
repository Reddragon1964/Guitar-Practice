import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Send,
  Monitor,
  MonitorUp,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { masterAudio } from "../../utils/masterAudioController";
import { WindowsVolumeSlider } from "../ui/WindowsVolumeSlider";

type VoiceName = "Zephyr" | "Puck" | "Kore" | "Fenrir" | "Charon";

export interface TranscriptEntry {
  id: string;
  speaker: "user" | "coach";
  text: string;
  timestamp: number;
  badge?: string;
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

export interface PracticeSessionLiveCoachProps {
  songTitle: string;
  difficulty: number;
  speed: string;
  duration: string;
  correctNotes?: string;
  totalNotes?: string;
  accuracy?: number | null;
  isTimerRunning?: boolean;
  isPartial?: boolean;
  isShortVersion?: boolean;
  isTestSession?: boolean;
  score?: string;
  note?: string;
  prevAccuracy?: number | null;
  prevSpeed?: number | null;
  autoStart?: boolean;
  onAdviceUpdate?: (advice: string, isSpeaking: boolean, screenFrameDataUrl?: string) => void;
}

export const PracticeSessionLiveCoach: React.FC<PracticeSessionLiveCoachProps> = ({
  songTitle,
  difficulty,
  speed,
  duration,
  correctNotes = "",
  totalNotes = "",
  accuracy = null,
  isTimerRunning = false,
  isPartial = false,
  isShortVersion = false,
  isTestSession = false,
  score = "",
  note = "",
  prevAccuracy = null,
  prevSpeed = null,
  autoStart = true,
  onAdviceUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isCoachVoiceMuted, setIsCoachVoiceMuted] = useState<boolean>(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>("Zephyr");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [micLevel, setMicLevel] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [quickTextPrompt, setQuickTextPrompt] = useState<string>("");

  // Screen Viewing & Proactive Advice State
  const [isScreenViewing, setIsScreenViewing] = useState<boolean>(true);
  const [isExternalDisplayShared, setIsExternalDisplayShared] = useState<boolean>(false);
  const [autoAdviceEnabled, setAutoAdviceEnabled] = useState<boolean>(true);
  const [adviceIntervalSec, setAdviceIntervalSec] = useState<number>(25);
  const [latestAdvice, setLatestAdvice] = useState<string>(
    "Initializing AI Screen Vision... Preparing real-time coaching advice for your practice session."
  );
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState<boolean>(false);
  const [framesSentCount, setFramesSentCount] = useState<number>(0);
  const [latestScreenPreviewUrl, setLatestScreenPreviewUrl] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const isMicMutedRef = useRef<boolean>(false);
  const isCoachVoiceMutedRef = useRef<boolean>(false);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const displayVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const activeHtmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const adviceHistoryRef = useRef<string[]>([]);
  const isFetchingAdviceRef = useRef<boolean>(false);
  const hasAutoStartedRef = useRef<boolean>(false);

  // Ref for latest session telemetry accessed inside intervals/callbacks
  const sessionStateRef = useRef({
    songTitle,
    difficulty,
    speed,
    duration,
    correctNotes,
    totalNotes,
    accuracy,
    isTimerRunning,
    isPartial,
    isShortVersion,
    isTestSession,
    score,
    note,
    prevAccuracy,
    prevSpeed,
    micLevel,
  });

  useEffect(() => {
    sessionStateRef.current = {
      songTitle,
      difficulty,
      speed,
      duration,
      correctNotes,
      totalNotes,
      accuracy,
      isTimerRunning,
      isPartial,
      isShortVersion,
      isTestSession,
      score,
      note,
      prevAccuracy,
      prevSpeed,
      micLevel,
    };
  }, [
    songTitle,
    difficulty,
    speed,
    duration,
    correctNotes,
    totalNotes,
    accuracy,
    isTimerRunning,
    isPartial,
    isShortVersion,
    isTestSession,
    score,
    note,
    prevAccuracy,
    prevSpeed,
    micLevel,
  ]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    isCoachVoiceMutedRef.current = isCoachVoiceMuted;
    if (isCoachVoiceMuted) {
      stopAllPlayback();
    }
  }, [isCoachVoiceMuted]);

  useEffect(() => {
    onAdviceUpdate?.(latestAdvice, isModelSpeaking, latestScreenPreviewUrl);
  }, [latestAdvice, isModelSpeaking, latestScreenPreviewUrl, onAdviceUpdate]);

  // Enumerate audio input devices (microphones)
  const loadAudioDevices = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadAudioDevices();
    const handleDeviceChange = () => {
      loadAudioDevices();
    };
    navigator.mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
    };
  }, [loadAudioDevices]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Render the live practice session screen onto the 640x360 canvas (either from external display stream or automatic built-in session screen mirror)
  const captureCurrentScreenFrameBase64 = useCallback((): string | null => {
    let canvas = screenCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      screenCanvasRef.current = canvas;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const st = sessionStateRef.current;
    const w = canvas.width;
    const h = canvas.height;

    // If external display share video is active and has frames, draw it first
    const videoEl = displayVideoRef.current;
    if (
      displayStreamRef.current &&
      videoEl &&
      videoEl.readyState >= 2 &&
      videoEl.videoWidth > 0
    ) {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(videoEl, 0, 0, w, h);

      // Draw a compact HUD overlay bar at the bottom with current session metrics
      ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
      ctx.fillRect(0, h - 48, w, 48);
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h - 48);
      ctx.lineTo(w, h - 48);
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 13px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(
        `SONG: ${(st.songTitle || "Freestyle Practice").slice(0, 28)} | SPD: ${st.speed || "100"}% | LVL: ${st.difficulty}/12 | TIME: ${st.duration || "0:00"}`,
        12,
        h - 20
      );
    } else {
      // Automatic Built-In Session Screen Mirror (Zero-prompt, works immediately on dialog open)
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#020617");
      grad.addColorStop(0.5, "#1e1b4b");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Outer neon frame border
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, w - 12, h - 12);

      // Header bar
      ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
      ctx.fillRect(14, 14, w - 28, 44);
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(32, 36, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("RECORD PRACTICE SESSION — LIVE SCREEN VIEW", 48, 41);

      ctx.fillStyle = st.isTimerRunning ? "#10b981" : "#f59e0b";
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.fillText(
        st.isTimerRunning ? "● PLAYING / TIMER RUNNING" : "● SESSION OPEN",
        w - 210,
        40
      );

      // Song Card Box
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 1.5;
      ctx.fillRect(14, 68, w - 28, 72);
      ctx.strokeRect(14, 68, w - 28, 72);

      ctx.fillStyle = "#a5b4fc";
      ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("ACTIVE SONG / EXERCISE ON SCREEN", 26, 88);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px ui-sans-serif, system-ui, sans-serif";
      const displaySong = (st.songTitle || "Freestyle Warmup / Unselected Song").slice(0, 38);
      ctx.fillText(displaySong, 26, 118);

      // 4 Metric Tiles (Speed, Difficulty, Accuracy, Timer)
      const metrics = [
        {
          label: "PRACTICE SPEED",
          value: `${st.speed || "100"}%`,
          sub: st.prevSpeed ? `Prev: ${st.prevSpeed}%` : "Target Tempo",
          color: "#34d399",
        },
        {
          label: "DIFFICULTY",
          value: `Lvl ${st.difficulty || 1}/12`,
          sub: st.isPartial ? "Partial Song" : "Full Arrangement",
          color: "#38bdf8",
        },
        {
          label: "NOTE ACCURACY",
          value: st.accuracy !== null && st.accuracy !== undefined ? `${st.accuracy}%` : "Live",
          sub:
            st.correctNotes && st.totalNotes
              ? `${st.correctNotes}/${st.totalNotes} notes`
              : st.prevAccuracy !== null && st.prevAccuracy !== undefined
              ? `Prev: ${st.prevAccuracy}%`
              : "Tracking notes",
          color: "#a78bfa",
        },
        {
          label: "ELAPSED TIMER",
          value: st.duration || "0:00",
          sub: st.isTimerRunning ? "Active Take" : "Ready",
          color: "#fbbf24",
        },
      ];

      const tileW = (w - 28 - 30) / 4;
      metrics.forEach((m, idx) => {
        const x = 14 + idx * (tileW + 10);
        const y = 152;
        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1.5;
        ctx.fillRect(x, y, tileW, 96);
        ctx.strokeRect(x, y, tileW, 96);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 10px ui-sans-serif, system-ui, sans-serif";
        ctx.fillText(m.label, x + 10, y + 22);

        ctx.fillStyle = m.color;
        ctx.font = "bold 22px ui-monospace, monospace";
        ctx.fillText(m.value, x + 10, y + 56);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
        ctx.fillText(m.sub.slice(0, 18), x + 10, y + 80);
      });

      // Bottom Live Audio / Notes Strip
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.fillRect(14, 260, w - 28, 84);
      ctx.strokeRect(14, 260, w - 28, 84);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("LIVE GUITAR INPUT SIGNAL & SESSION NOTES", 26, 282);

      // Audio meter bar
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(26, 292, 240, 14);
      const meterWidth = Math.min(240, Math.max(12, Math.round((st.micLevel / 100) * 240)));
      ctx.fillStyle = "#10b981";
      ctx.fillRect(26, 292, meterWidth, 14);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
      const notePreview = st.note
        ? `Note: "${st.note.slice(0, 62)}"`
        : "AI Coach is actively monitoring your screen metrics, tempo, and playing progress.";
      ctx.fillText(notePreview, 26, 328);
    }

    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      setLatestScreenPreviewUrl(dataUrl);
      return dataUrl.replace(/^data:image\/jpeg;base64,/, "");
    } catch {
      return null;
    }
  }, []);

  // Build live session system instruction with current dialog context
  const liveSystemInstruction = useMemo(() => {
    const currentSong = songTitle.trim() || "Freestyle practice / warmup";
    const currentSpeed = speed.trim() ? `${speed.trim()}%` : "100%";
    const currentLvl = difficulty || 1;
    const currentDur = duration.trim() || "0:00";

    return `You are a proactive, real-time Guitar Practice Screen & Voice Coach (gemini-3.8-live). You are viewing the guitarist's Record Practice Session screen in real time via 1 FPS video frames and listening to them practice.
Current Screen Details:
- Active Song / Exercise: "${currentSong}"
- Difficulty Level: ${currentLvl}/12
- Target Tempo Speed: ${currentSpeed}
- Elapsed Time: ${currentDur}
${isTimerRunning ? "- Practice timer is currently running!" : ""}

CRITICAL LANGUAGE REQUIREMENT: You MUST speak, reply, and generate all output and transcriptions strictly in ENGLISH at all times. Never switch to any other language.

Proactively offer brief, natural, encouraging guitar playing advice (1-2 sentences) based on what you see on their screen and hear while they play!`;
  }, [songTitle, difficulty, speed, duration, isTimerRunning]);

  const stopAllPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current.clear();

    if (activeHtmlAudioRef.current) {
      try {
        activeHtmlAudioRef.current.pause();
        activeHtmlAudioRef.current.currentTime = 0;
      } catch {}
      activeHtmlAudioRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    setIsModelSpeaking(false);
  }, []);

  const ensureOutputAudioContext = useCallback(() => {
    if (!outputAudioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      const masterGain = masterAudio.createMasterGain(outputCtx);
      masterGain.connect(outputCtx.destination);
      masterGainNodeRef.current = masterGain;
      nextStartTimeRef.current = outputCtx.currentTime;
    }
    if (outputAudioCtxRef.current.state === "suspended") {
      outputAudioCtxRef.current.resume().catch(() => {});
    }
    return outputAudioCtxRef.current;
  }, []);

  const playAudioChunk = useCallback(
    (base64Audio: string) => {
      if (isCoachVoiceMutedRef.current) return;
      const outputCtx = ensureOutputAudioContext();
      if (!outputCtx) return;

      const float32Data = pcm16Base64ToFloat32(base64Audio);
      if (float32Data.length === 0) return;

      const audioBuffer = outputCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      if (masterGainNodeRef.current) {
        source.connect(masterGainNodeRef.current);
      } else {
        source.connect(outputCtx.destination);
      }

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
    },
    [ensureOutputAudioContext]
  );

  // Play WAV base64 from /api/screen-coach TTS or fallback to Web Speech API
  const speakAdviceAudio = useCallback((wavBase64: string | null, textToSpeak: string) => {
    if (isCoachVoiceMutedRef.current) return;
    // Do not interrupt if Live API model stream is already actively speaking
    if (activeSourcesRef.current.size > 0) return;

    if (wavBase64) {
      try {
        if (activeHtmlAudioRef.current) {
          activeHtmlAudioRef.current.pause();
        }
        const audio = new Audio(`data:audio/wav;base64,${wavBase64}`);
        audio.volume = masterAudio.getEffectiveGain();
        activeHtmlAudioRef.current = audio;
        setIsModelSpeaking(true);
        audio.onended = () => {
          setIsModelSpeaking(false);
          activeHtmlAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsModelSpeaking(false);
          activeHtmlAudioRef.current = null;
        };
        audio.play().catch(() => {
          setIsModelSpeaking(false);
        });
        return;
      } catch {}
    }

    // Fallback to browser speechSynthesis if TTS WAV playback wasn't used
    if (typeof window !== "undefined" && "speechSynthesis" in window && textToSpeak) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(textToSpeak);
        utter.lang = "en-US";
        utter.rate = 1.02;
        utter.volume = masterAudio.getEffectiveGain();
        utter.onstart = () => setIsModelSpeaking(true);
        utter.onend = () => setIsModelSpeaking(false);
        utter.onerror = () => setIsModelSpeaking(false);
        window.speechSynthesis.speak(utter);
      } catch {}
    }
  }, []);

  const appendTranscript = useCallback(
    (speaker: "user" | "coach", text: string, badge?: string) => {
      const cleaned = text.trim();
      if (!cleaned) return;
      setTranscripts((prev) => {
        const last = prev[prev.length - 1];
        if (
          last &&
          last.speaker === speaker &&
          !badge &&
          Date.now() - last.timestamp < 5000
        ) {
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
            badge,
          },
        ];
      });
    },
    []
  );

  // Request proactive screen-based coaching advice automatically (no user prompt needed)
  const requestProactiveAdvice = useCallback(
    async (triggerReason: "initial" | "interval" | "screen-change" | "manual" = "interval") => {
      if (isFetchingAdviceRef.current) return;
      isFetchingAdviceRef.current = true;
      setIsGeneratingAdvice(true);

      try {
        const frameBase64 = captureCurrentScreenFrameBase64();
        const currentSt = sessionStateRef.current;

        // Also send the latest screen frame to the Live WebSocket if open
        if (frameBase64 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              video: frameBase64,
              mimeType: "image/jpeg",
            })
          );
          setFramesSentCount((c) => c + 1);
        }

        const response = await fetch("/api/screen-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: frameBase64,
            sessionState: currentSt,
            previousAdvice: adviceHistoryRef.current.slice(-4),
            generateVoice: !isCoachVoiceMutedRef.current,
            voiceName: selectedVoice,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.advice) {
            const adviceText = String(data.advice).trim();
            adviceHistoryRef.current = [...adviceHistoryRef.current.slice(-6), adviceText];
            setLatestAdvice(adviceText);
            appendTranscript(
              "coach",
              adviceText,
              triggerReason === "initial"
                ? "Auto Screen Init"
                : triggerReason === "screen-change"
                ? "Screen Update"
                : "Live Screen Advice"
            );
            speakAdviceAudio(data.audioBase64 || null, adviceText);
          }
        }
      } catch (err) {
        console.warn("Proactive screen advice error:", err);
      } finally {
        isFetchingAdviceRef.current = false;
        setIsGeneratingAdvice(false);
      }
    },
    [appendTranscript, captureCurrentScreenFrameBase64, selectedVoice, speakAdviceAudio]
  );

  // Attach microphone audio in the background (non-blocking: if denied or unavailable, screen coaching continues uninterrupted)
  const attachMicrophoneInBackground = useCallback(
    async (ws: WebSocket) => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
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
        setIsMicActive(true);
        loadAudioDevices();

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        inputAudioCtxRef.current = inputCtx;

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

          if (ws.readyState === WebSocket.OPEN) {
            const base64Audio = float32ToPcm16Base64(channelData);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      } catch (micErr) {
        // Non-fatal: AI Screen Coach continues viewing screen and prompting with advice even without mic!
        console.info("Microphone auto-attach skipped or not permitted; continuing with AI Screen Vision:", micErr);
        setIsMicActive(false);
      }
    },
    [loadAudioDevices, selectedMicId]
  );

  // Stop external display share if active
  const stopExternalDisplayShare = useCallback(() => {
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }
    if (displayVideoRef.current) {
      displayVideoRef.current.srcObject = null;
    }
    setIsExternalDisplayShared(false);
  }, []);

  // Optional: Share full desktop / external tab window via getDisplayMedia
  const handleToggleExternalDisplayShare = async () => {
    if (isExternalDisplayShared) {
      stopExternalDisplayShare();
      return;
    }
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setErrorMessage("External screen capture is not supported in this browser window; using built-in Live Session Screen View.");
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 2, max: 5 } },
        audio: false,
      });
      displayStreamRef.current = stream;
      if (!displayVideoRef.current) {
        const v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        displayVideoRef.current = v;
      }
      displayVideoRef.current.srcObject = stream;
      await displayVideoRef.current.play().catch(() => {});
      setIsExternalDisplayShared(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopExternalDisplayShare();
        };
      }
      requestProactiveAdvice("screen-change");
    } catch (err) {
      // Keep built-in session screen viewer active
      setIsExternalDisplayShared(false);
    }
  };

  const cleanupSession = useCallback(() => {
    stopAllPlayback();
    stopExternalDisplayShare();

    masterGainNodeRef.current = null;

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
    setIsMicActive(false);
    setIsModelSpeaking(false);
    setMicLevel(0);
  }, [stopAllPlayback, stopExternalDisplayShare]);

  // Connect to Live WebSocket + Start Screen Streaming immediately (no user interaction required)
  const startLiveCoach = useCallback(async () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    setErrorMessage(null);
    setIsConnecting(true);
    setIsScreenViewing(true);

    try {
      ensureOutputAudioContext();

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

        // Send initial screen frame immediately upon connection
        const initialFrame = captureCurrentScreenFrameBase64();
        if (initialFrame && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              video: initialFrame,
              mimeType: "image/jpeg",
            })
          );
          setFramesSentCount((c) => c + 1);
        }

        // Attach microphone in parallel without blocking screen vision
        attachMicrophoneInBackground(ws);
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
            appendTranscript("coach", msg.outputTranscript, "Live Voice");
            setLatestAdvice(msg.outputTranscript);
          }
          if (msg.error) {
            setErrorMessage(msg.error);
          }
        } catch (err) {
          console.error("Live message parse error:", err);
        }
      };

      ws.onerror = () => {
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (err: any) {
      console.error("Live coach start error:", err);
      setIsConnecting(false);
    }
  }, [
    appendTranscript,
    attachMicrophoneInBackground,
    captureCurrentScreenFrameBase64,
    ensureOutputAudioContext,
    liveSystemInstruction,
    playAudioChunk,
    selectedVoice,
    stopAllPlayback,
  ]);

  // AUTO-INITIALIZE immediately when the Record Practice Session dialog opens!
  useEffect(() => {
    if (!autoStart || hasAutoStartedRef.current) return;
    hasAutoStartedRef.current = true;

    // 1. Capture initial screen preview right away
    captureCurrentScreenFrameBase64();

    // 2. Connect Live Coach WebSocket & Screen Stream automatically
    startLiveCoach();

    // 3. Prompt the user with initial screen-based advice automatically (~1.2s after dialog opens)
    const initTimer = window.setTimeout(() => {
      requestProactiveAdvice("initial");
    }, 1200);

    return () => {
      window.clearTimeout(initTimer);
    };
  }, [autoStart, captureCurrentScreenFrameBase64, requestProactiveAdvice, startLiveCoach]);

  // Cleanup when Record Practice Session dialog closes
  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  // 1 FPS Screen Frame Streaming Loop while viewing screen (per Gemini Live API 1 FPS video rule)
  useEffect(() => {
    if (!isScreenViewing) return;
    const frameInterval = window.setInterval(() => {
      const base64Jpeg = captureCurrentScreenFrameBase64();
      if (base64Jpeg && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            video: base64Jpeg,
            mimeType: "image/jpeg",
          })
        );
        setFramesSentCount((c) => c + 1);
      }
    }, 1000);

    return () => {
      window.clearInterval(frameInterval);
    };
  }, [isScreenViewing, captureCurrentScreenFrameBase64]);

  // Periodic Proactive Advice Timer while playing (prompts user automatically without interaction)
  useEffect(() => {
    if (!autoAdviceEnabled || !isScreenViewing) return;
    const intervalMs = Math.max(12, adviceIntervalSec) * 1000;
    const adviceTimer = window.setInterval(() => {
      requestProactiveAdvice("interval");
    }, intervalMs);

    return () => {
      window.clearInterval(adviceTimer);
    };
  }, [autoAdviceEnabled, isScreenViewing, adviceIntervalSec, requestProactiveAdvice]);

  // Also trigger proactive advice when key screen fields change (song, speed, difficulty, timer started, or accuracy updated)
  const prevScreenKeyRef = useRef<string>(
    `${songTitle}|${speed}|${difficulty}|${isTimerRunning}|${accuracy}`
  );
  useEffect(() => {
    const nextKey = `${songTitle}|${speed}|${difficulty}|${isTimerRunning}|${accuracy}`;
    if (prevScreenKeyRef.current === nextKey) return;
    prevScreenKeyRef.current = nextKey;

    if (!autoAdviceEnabled || !isScreenViewing) return;
    const debounceTimer = window.setTimeout(() => {
      requestProactiveAdvice("screen-change");
    }, 3500);

    return () => {
      window.clearTimeout(debounceTimer);
    };
  }, [
    songTitle,
    speed,
    difficulty,
    isTimerRunning,
    accuracy,
    autoAdviceEnabled,
    isScreenViewing,
    requestProactiveAdvice,
  ]);

  const handleMicChange = async (newDeviceId: string) => {
    setSelectedMicId(newDeviceId);
    if (isConnected && wsRef.current) {
      try {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        await attachMicrophoneInBackground(wsRef.current);
      } catch (err: any) {
        console.error("Failed to switch microphone:", err);
      }
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTextPrompt.trim();
    if (!trimmed) return;
    appendTranscript("user", trimmed);
    setQuickTextPrompt("");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: trimmed }));
    } else {
      requestProactiveAdvice("manual");
    }
  };

  return (
    <div className="rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/50 via-indigo-950/50 to-slate-950/80 p-3 sm:p-3.5 space-y-3 transition-all shadow-md">
      {/* Header bar of Live Screen & Voice Coach widget */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center border transition-all shrink-0",
              isScreenViewing
                ? isModelSpeaking || isGeneratingAdvice
                  ? "bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"
                  : "bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                : "bg-indigo-950/60 border-indigo-700/60 text-indigo-400"
            )}
          >
            {isModelSpeaking ? (
              <Volume2 className="w-4 h-4 text-emerald-300 animate-bounce" />
            ) : isScreenViewing ? (
              <Eye className="w-4 h-4 text-cyan-300" />
            ) : (
              <Mic className="w-4 h-4 text-emerald-400" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                AI Screen Vision & Live Practice Coach
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/70 text-cyan-200 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  {isScreenViewing ? "VIEWING SCREEN (AUTO)" : "PAUSED"}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-600/70 text-emerald-300 font-normal">
                  gemini-3.8-live
                </span>
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/90 truncate">
              {isModelSpeaking
                ? "AI Coach is speaking advice while you play..."
                : isGeneratingAdvice
                ? "Analyzing your practice screen and generating live advice..."
                : `Auto-initialized • Viewing "${songTitle || "your practice screen"}" (${framesSentCount} frames analyzed) & prompting advice automatically`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <WindowsVolumeSlider variant="compact" />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => requestProactiveAdvice("manual")}
            disabled={isGeneratingAdvice}
            className="h-8 text-xs gap-1.5 border-cyan-600/70 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-100"
            title="Have the AI coach inspect your screen and give immediate advice right now"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-cyan-300", isGeneratingAdvice && "animate-spin")} />
            <span>Advice Now</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAutoAdviceEnabled((prev) => !prev)}
            className={cn(
              "h-8 text-xs gap-1 border",
              autoAdviceEnabled
                ? "bg-emerald-950/70 border-emerald-500/70 text-emerald-200 hover:bg-emerald-900/70"
                : "bg-slate-900 border-slate-700 text-slate-300"
            )}
            title="Toggle automatic hands-free advice prompts while you play"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Advice: {autoAdviceEnabled ? "ON" : "OFF"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCoachVoiceMuted((prev) => !prev)}
            className={cn(
              "h-8 text-xs gap-1 border",
              isCoachVoiceMuted
                ? "bg-rose-950/60 border-rose-600 text-rose-200"
                : "bg-indigo-950/80 border-indigo-700/70 text-indigo-200"
            )}
            title={isCoachVoiceMuted ? "Unmute AI Coach spoken voice" : "Mute AI Coach spoken voice"}
          >
            {isCoachVoiceMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">{isCoachVoiceMuted ? "Voice Muted" : "Voice On"}</span>
          </Button>

          {!isConnected ? (
            <Button
              type="button"
              size="sm"
              disabled={isConnecting}
              onClick={startLiveCoach}
              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-md shadow-emerald-950/50"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{isConnecting ? "Connecting..." : "Reconnect Live"}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMicMuted((prev) => !prev)}
              className={cn(
                "h-8 text-xs gap-1 border-emerald-700/60",
                isMicMuted || !isMicActive
                  ? "bg-rose-950/60 border-rose-600 text-rose-200 hover:bg-rose-900/60"
                  : "bg-indigo-950/80 text-indigo-200 hover:bg-indigo-900"
              )}
              title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMicMuted || !isMicActive ? (
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">
                {!isMicActive ? "Screen Only" : isMicMuted ? "Mic Muted" : "Mic Active"}
              </span>
            </Button>
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

      {/* Proactive Live Advice Callout Banner (Always Visible inside Coach) */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/90 border border-cyan-500/50 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shrink-0 mt-0.5">
            <Sparkles className={cn("w-4 h-4", (isModelSpeaking || isGeneratingAdvice) && "animate-spin")} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Live Proactive Screen Advice
              </span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/90 border border-emerald-700/60 px-1.5 py-0.2 rounded">
                {isExternalDisplayShared ? "External Screen + Session HUD" : "Auto Session Screen Mirror (1 FPS)"}
              </span>
              {isModelSpeaking && (
                <span className="text-[10px] font-mono text-amber-300 animate-pulse">
                  🔊 Speaking aloud...
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-white leading-snug">
              {latestAdvice}
            </p>
          </div>
        </div>

        {/* Live 1 FPS Screen Feed Preview Thumbnail */}
        {latestScreenPreviewUrl && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="relative rounded-lg overflow-hidden border border-cyan-400/70 bg-slate-950 w-28 h-16 shadow-md group">
              <img
                src={latestScreenPreviewUrl}
                alt="AI Live Screen Feed Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 px-1.5 py-0.5 flex items-center justify-between text-[9px] font-mono text-cyan-300">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AI VISION
                </span>
                <span>1 FPS</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded controls & live feedback */}
      {isExpanded && (
        <div className="space-y-2.5 pt-1 border-t border-emerald-900/40 animate-in fade-in duration-150">
          {/* Top row: Voice selector + Advice Frequency + Microphone selector + Optional External Screen Share */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
            {/* Voice Persona Dropdown (Span 3) */}
            <div className="flex flex-col gap-1 min-w-0 lg:col-span-3">
              <div className="h-5 flex items-center shrink-0">
                <label className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider truncate whitespace-nowrap">
                  Voice Persona
                </label>
              </div>
              <Select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as VoiceName)}
                className="h-9 py-1 text-xs w-full"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Auto-Advice Prompt Interval (Span 3) */}
            <div className="flex flex-col gap-1 min-w-0 lg:col-span-3">
              <div className="h-5 flex items-center shrink-0">
                <label className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider truncate whitespace-nowrap">
                  Advice Prompt Frequency
                </label>
              </div>
              <Select
                value={String(adviceIntervalSec)}
                onChange={(e) => setAdviceIntervalSec(Number(e.target.value) || 25)}
                className="h-9 py-1 text-xs w-full"
                title="How often the AI prompts you with new advice while you play"
              >
                <option value="15">Every 15 seconds (Frequent)</option>
                <option value="25">Every 25 seconds (Recommended)</option>
                <option value="45">Every 45 seconds (Relaxed)</option>
                <option value="60">Every 60 seconds (Minimal)</option>
              </Select>
            </div>

            {/* Microphone Selection Dropdown (Span 3) */}
            <div className="flex flex-col gap-1 min-w-0 lg:col-span-3">
              <div className="h-5 flex items-center shrink-0">
                <label className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider truncate whitespace-nowrap flex items-center gap-1">
                  <Mic className="w-3 h-3 text-emerald-400 shrink-0" />
                  Microphone Input
                </label>
              </div>
              <Select
                value={selectedMicId}
                onChange={(e) => handleMicChange(e.target.value)}
                className="h-9 py-1 text-xs w-full truncate"
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

            {/* Screen Capture Source Button (Span 3) */}
            <div className="flex flex-col gap-1 min-w-0 lg:col-span-3">
              <div className="h-5 flex items-center justify-between shrink-0">
                <label className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider truncate whitespace-nowrap flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-cyan-400 shrink-0" />
                  Screen Source
                </label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleExternalDisplayShare}
                className={cn(
                  "h-9 w-full text-xs gap-1.5 justify-center font-medium",
                  isExternalDisplayShared
                    ? "bg-cyan-950/90 border-cyan-400 text-cyan-200"
                    : "bg-indigo-950/70 border-indigo-700/80 text-indigo-200 hover:bg-indigo-900/70"
                )}
                title="Optionally share another tab or desktop window (e.g. Guitar Pro / Tab viewer), or keep automatic built-in Practice Screen View"
              >
                <MonitorUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">
                  {isExternalDisplayShared ? "Using Shared Window (Stop)" : "Auto App Screen (+Share Tab)"}
                </span>
              </Button>
            </div>
          </div>

          {/* Real-time transcript & proactive advice feed */}
          <div className="space-y-2">
            <div className="h-28 overflow-y-auto rounded-lg border border-indigo-800/80 bg-slate-950/90 p-2.5 space-y-1.5 dialog-scrollbar text-xs">
              {transcripts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-[11px] text-indigo-300/90">
                  AI Screen Coach is initialized and viewing your practice screen automatically. Start playing — the coach will prompt you with live advice automatically!
                </div>
              ) : (
                transcripts.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "p-1.5 rounded-md text-[11px] max-w-[92%]",
                      entry.speaker === "user"
                        ? "ml-auto bg-indigo-600/30 border border-indigo-500/40 text-indigo-100"
                        : "mr-auto bg-emerald-950/70 border border-emerald-700/60 text-emerald-100"
                    )}
                  >
                    <div className="font-semibold text-[9px] uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                      <span>{entry.speaker === "user" ? "You" : `AI Screen Coach (${selectedVoice})`}</span>
                      {entry.badge && (
                        <span className="px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono text-[8px]">
                          {entry.badge}
                        </span>
                      )}
                    </div>
                    <div>{entry.text}</div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Optional quick text input into active session */}
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <Input
                type="text"
                value={quickTextPrompt}
                onChange={(e) => setQuickTextPrompt(e.target.value)}
                placeholder="Hands-free auto-advice is active — or type a specific question if desired..."
                className="flex-1 h-9 py-1 text-xs"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!quickTextPrompt.trim()}
                className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </Button>
            </form>
          </div>

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
