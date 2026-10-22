import React, { useMemo, useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import {
  Clock,
  Music,
  Calendar,
  Gauge,
  Sparkles,
  X,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Plus,
  ListMusic,
  AlertCircle,
  Loader2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Bot,
  Sliders,
  FileText,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { NumericKeypadInput } from "../ui/numeric-keypad-input";
import { Select } from "../ui/select";
import { Song, Practice } from "../../types";
import { cn } from "../../lib/utils";
import {
  formatDurationColon,
  parseDurationInputToSeconds,
  formatDurationLabel,
} from "../../utils/durationFormat";
import { PracticeSessionLiveCoach } from "./PracticeSessionLiveCoach";
import { MoveableResizableFrame } from "../ui/MoveableResizableFrame";
import { WindowsVolumeSlider } from "../ui/WindowsVolumeSlider";

export type SessionFrameId =
  | "songInfo"
  | "metrics"
  | "duration"
  | "coach"
  | "options"
  | "notes";

interface SessionFrameMeta {
  id: SessionFrameId;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_SESSION_FRAMES: SessionFrameMeta[] = [
  {
    id: "songInfo",
    title: "Song & Practice Date",
    subtitle: "Select song title or enter custom exercise, and choose date",
    icon: Music,
  },
  {
    id: "metrics",
    title: "Session Metrics & Accuracy",
    subtitle: "Difficulty, total notes, correct notes, and playback speed",
    icon: Gauge,
  },
  {
    id: "duration",
    title: "Duration & Live Stopwatch",
    subtitle: "Format 1:01 (minutes:seconds) with interactive timer and presets",
    icon: Clock,
  },
  {
    id: "coach",
    title: "Live Voice Coach",
    subtitle: "Real-time speech coaching and encouragement during practice",
    icon: Bot,
  },
  {
    id: "options",
    title: "Session Options & Test Score",
    subtitle: "Partial practice, short version, test session mode, and score input",
    icon: Sliders,
  },
  {
    id: "notes",
    title: "Session Notes & Reflections",
    subtitle: "Personal practice log notes, technique focus, and breakthroughs",
    icon: FileText,
  },
];

const FRAMES_ORDER_STORAGE_KEY = "guitar_record_session_frames_order_v2";
const FRAMES_MINIMIZED_STORAGE_KEY = "guitar_record_session_frames_minimized_v2";

interface PracticeSessionModalProps {
  practices?: Practice[];
  editingPracticeId: string | null;
  activeSongs: Song[];
  songTitle: string;
  onSongTitleChange: (newTitle: string) => void;
  difficulty: number;
  onDifficultyChange: (val: number) => void;
  practiceDate: string;
  onPracticeDateChange: (val: string) => void;
  correctNotes: string;
  onCorrectNotesChange: (val: string) => void;
  totalNotes: string;
  onTotalNotesChange: (val: string) => void;
  duration: string;
  onDurationChange: (val: string) => void;
  isPartial: boolean;
  onIsPartialChange: (val: boolean) => void;
  isShortVersion?: boolean;
  onIsShortVersionChange?: (val: boolean) => void;
  isTestSession: boolean;
  onIsTestSessionChange: (checked: boolean) => void;
  score: string;
  onScoreChange: (val: string) => void;
  speed: string;
  onSpeedChange: (val: string) => void;
  note: string;
  onNoteChange: (val: string) => void;
  isSaving?: boolean;
  saveError?: string | null;
  onUpdateSongDefaults?: (title: string, durationSec?: number, diffLevel?: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const DURATION_PRESETS = ["0:30", "0:45", "1:00", "1:01", "1:15", "1:30", "2:00", "3:00", "5:00"];

export const PracticeSessionModal: React.FC<PracticeSessionModalProps> = ({
  practices = [],
  editingPracticeId,
  activeSongs,
  songTitle,
  onSongTitleChange,
  difficulty,
  onDifficultyChange,
  practiceDate,
  onPracticeDateChange,
  correctNotes,
  onCorrectNotesChange,
  totalNotes,
  onTotalNotesChange,
  duration,
  onDurationChange,
  isPartial,
  onIsPartialChange,
  isShortVersion = false,
  onIsShortVersionChange,
  isTestSession,
  onIsTestSessionChange,
  score,
  onScoreChange,
  speed,
  onSpeedChange,
  note,
  onNoteChange,
  isSaving = false,
  saveError = null,
  onUpdateSongDefaults,
  onSubmit,
  onCancel,
}) => {
  const [isCustomSongMode, setIsCustomSongMode] = useState<boolean>(activeSongs.length === 0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const dialogTopRef = useRef<HTMLDivElement>(null);

  // Compute previous session specifically for this song (or fallback to latest session overall)
  const previousSessionForSong = useMemo(() => {
    if (!songTitle || !practices || practices.length === 0) return null;
    const normalized = songTitle.trim().toLowerCase();
    const songSessions = practices.filter(
      (p) =>
        p.id !== editingPracticeId &&
        p.songTitle &&
        p.songTitle.trim().toLowerCase() === normalized
    );
    if (songSessions.length === 0) return null;
    return [...songSessions].sort((a, b) => {
      const dateCmp = (b.date || "").localeCompare(a.date || "");
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAt || 0) - (a.createdAt || 0);
    })[0];
  }, [songTitle, practices, editingPracticeId]);

  const latestOverallSession = useMemo(() => {
    if (!practices || practices.length === 0) return null;
    const valid = practices.filter((p) => p.id !== editingPracticeId);
    if (valid.length === 0) return null;
    return [...valid].sort((a, b) => {
      const dateCmp = (b.date || "").localeCompare(a.date || "");
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAt || 0) - (a.createdAt || 0);
    })[0];
  }, [practices, editingPracticeId]);

  const prevSession = previousSessionForSong || latestOverallSession;
  const isSongSpecific = Boolean(previousSessionForSong);
  const prevCorrectNotes = prevSession?.correctNotes;
  const prevSpeed = prevSession?.speed;
  const prevTotalNotes = prevSession?.totalNotes;
  const prevDifficulty = prevSession?.difficulty;

  // Green flash for speed textbox to remind user to set external practice software to the same speed
  const [isSpeedFlashing, setIsSpeedFlashing] = useState<boolean>(false);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevSongTitleRef = useRef<string>(songTitle);

  const triggerSpeedFlash = useCallback(() => {
    setIsSpeedFlashing(true);
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = setTimeout(() => {
      setIsSpeedFlashing(false);
    }, 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  // Flash whenever a song is selected / changed
  useEffect(() => {
    if (songTitle && songTitle.trim() !== "" && songTitle !== prevSongTitleRef.current) {
      triggerSpeedFlash();
    }
    prevSongTitleRef.current = songTitle;
  }, [songTitle, triggerSpeedFlash]);

  // Always scroll to the top of the Record Practice Session dialog when it opens
  useLayoutEffect(() => {
    const scrollToDialogTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (dialogTopRef.current) {
        dialogTopRef.current.scrollTop = 0;
      }
    };

    scrollToDialogTop();
    const rafId = requestAnimationFrame(scrollToDialogTop);
    return () => cancelAnimationFrame(rafId);
  }, [editingPracticeId]);

  useEffect(() => {
    if (activeSongs.length === 0) {
      setIsCustomSongMode(true);
    }
  }, [activeSongs.length]);

  // Live practice timer effect
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      const currentSec = parseDurationInputToSeconds(duration) ?? 0;
      onDurationChange(formatDurationColon(currentSec + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, duration, onDurationChange]);

  // Live accuracy computation for immediate feedback
  const liveAccuracy = useMemo(() => {
    if (isTestSession) return null;
    const c = parseInt(correctNotes, 10);
    const t = parseInt(totalNotes, 10);
    if (!isNaN(c) && !isNaN(t) && t > 0) {
      return Math.min(100, Math.max(0, Math.round((c / t) * 100)));
    }
    return null;
  }, [correctNotes, totalNotes, isTestSession]);

  // Duration helpers for "1:01 (minutes:seconds)" format
  const parsedDurationSeconds = useMemo(() => {
    return parseDurationInputToSeconds(duration);
  }, [duration]);

  const formattedDurationColon = useMemo(() => {
    if (parsedDurationSeconds !== undefined) {
      return formatDurationColon(parsedDurationSeconds);
    }
    return duration.trim();
  }, [parsedDurationSeconds, duration]);

  const durationHumanLabel = useMemo(() => {
    if (parsedDurationSeconds !== undefined && parsedDurationSeconds > 0) {
      return formatDurationLabel(parsedDurationSeconds);
    }
    return "";
  }, [parsedDurationSeconds]);

  const handleAdjustDuration = (deltaSeconds: number) => {
    const current = parsedDurationSeconds ?? 0;
    const next = Math.max(0, current + deltaSeconds);
    if (next === 0) {
      onDurationChange("");
    } else {
      onDurationChange(formatDurationColon(next));
    }
  };

  const handleDurationBlur = () => {
    if (!duration || duration.trim() === "") return;
    const seconds = parseDurationInputToSeconds(duration);
    if (seconds !== undefined) {
      onDurationChange(formatDurationColon(seconds));
    }
  };

  // Modular rearrangeable frames state
  const [framesOrder, setFramesOrder] = useState<SessionFrameId[]>(() => {
    try {
      const saved = localStorage.getItem(FRAMES_ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_SESSION_FRAMES.length) {
          const allValid = DEFAULT_SESSION_FRAMES.every((f) => parsed.includes(f.id));
          if (allValid) {
            return parsed as SessionFrameId[];
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load saved session frame order", e);
    }
    return DEFAULT_SESSION_FRAMES.map((f) => f.id);
  });

  const [minimizedFrames, setMinimizedFrames] = useState<Record<SessionFrameId, boolean>>(() => {
    try {
      const saved = localStorage.getItem(FRAMES_MINIMIZED_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load minimized frames state", e);
    }
    return {
      songInfo: false,
      metrics: false,
      duration: false,
      coach: false,
      options: false,
      notes: false,
    };
  });

  const [draggedFrameId, setDraggedFrameId] = useState<SessionFrameId | null>(null);
  const [dragOverFrameId, setDragOverFrameId] = useState<SessionFrameId | null>(null);

  const toggleFrameMinimize = useCallback((id: SessionFrameId) => {
    setMinimizedFrames((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(FRAMES_MINIMIZED_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save minimized frames state", e);
      }
      return next;
    });
  }, []);

  const moveFrame = useCallback((index: number, direction: "up" | "down") => {
    setFramesOrder((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      try {
        localStorage.setItem(FRAMES_ORDER_STORAGE_KEY, JSON.stringify(copy));
      } catch (e) {
        console.warn("Failed to save session frames order", e);
      }
      return copy;
    });
  }, []);

  const resetFramesLayout = useCallback(() => {
    const defaultOrder = DEFAULT_SESSION_FRAMES.map((f) => f.id);
    setFramesOrder(defaultOrder);
    const defaultMinimized: Record<SessionFrameId, boolean> = {
      songInfo: false,
      metrics: false,
      duration: false,
      coach: false,
      options: false,
      notes: false,
    };
    setMinimizedFrames(defaultMinimized);
    try {
      localStorage.setItem(FRAMES_ORDER_STORAGE_KEY, JSON.stringify(defaultOrder));
      localStorage.setItem(FRAMES_MINIMIZED_STORAGE_KEY, JSON.stringify(defaultMinimized));
    } catch (e) {
      console.warn("Failed to reset frames layout", e);
    }
  }, []);

  const toggleAllFrames = useCallback(() => {
    const allMin = Object.values(minimizedFrames).every(Boolean);
    const next: Record<SessionFrameId, boolean> = {
      songInfo: !allMin,
      metrics: !allMin,
      duration: !allMin,
      coach: !allMin,
      options: !allMin,
      notes: !allMin,
    };
    setMinimizedFrames(next);
    try {
      localStorage.setItem(FRAMES_MINIMIZED_STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to save minimized state", e);
    }
  }, [minimizedFrames]);

  const handleDragStart = (id: SessionFrameId, e: React.DragEvent) => {
    setDraggedFrameId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (id: SessionFrameId, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverFrameId !== id) {
      setDragOverFrameId(id);
    }
  };

  const handleDrop = (targetId: SessionFrameId, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFrameId || draggedFrameId === targetId) {
      setDraggedFrameId(null);
      setDragOverFrameId(null);
      return;
    }
    setFramesOrder((prev) => {
      const fromIndex = prev.indexOf(draggedFrameId);
      const toIndex = prev.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      try {
        localStorage.setItem(FRAMES_ORDER_STORAGE_KEY, JSON.stringify(copy));
      } catch (err) {
        console.warn("Failed to save frames order", err);
      }
      return copy;
    });
    setDraggedFrameId(null);
    setDragOverFrameId(null);
  };

  const handleDragEnd = () => {
    setDraggedFrameId(null);
    setDragOverFrameId(null);
  };

  const getFrameBadge = (id: SessionFrameId) => {
    switch (id) {
      case "songInfo":
        return songTitle.trim() ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-950/90 border border-indigo-700/60 text-indigo-200 truncate max-w-[220px]">
            <Music className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{songTitle}</span>
            <span className="text-slate-400 text-[10px]">({practiceDate})</span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 italic">No song chosen</span>
        );
      case "metrics":
        return liveAccuracy !== null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold border",
              liveAccuracy >= 90
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                : liveAccuracy >= 70
                ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                : "bg-rose-950/80 text-rose-300 border-rose-500/40"
            )}
          >
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            {liveAccuracy}% Acc · {correctNotes}/{totalNotes} · {speed || "100"}% Spd
          </span>
        ) : (
          <span className="text-[11px] font-mono text-indigo-300">
            Diff {difficulty} · Spd {speed || "100"}%
          </span>
        );
      case "duration":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
            <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
            {duration ? duration : "0:00"}
            {isTimerRunning && (
              <span className="text-amber-300 animate-pulse text-[10px] ml-1">(Live)</span>
            )}
          </span>
        );
      case "coach":
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border",
              isTimerRunning
                ? "bg-cyan-950/90 text-cyan-300 border-cyan-400 animate-pulse"
                : "bg-indigo-950/70 text-indigo-300 border-indigo-800/60"
            )}
          >
            <Bot className="w-3 h-3 text-cyan-400 shrink-0" />
            {isTimerRunning ? "Live Voice Active" : "Voice Coach Ready"}
          </span>
        );
      case "options":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
            {isTestSession
              ? `Test Session · ${score ? `Score: ${score}` : "No score"}`
              : isPartial
              ? "Partial Song"
              : isShortVersion
              ? "Short Version"
              : "Standard Practice"}
          </span>
        );
      case "notes":
        return (
          <span className="text-[11px] text-indigo-300/80 font-mono">
            {note.trim() ? `${note.trim().length} chars logged` : "No notes"}
          </span>
        );
      default:
        return null;
    }
  };

  const renderFrameContent = (id: SessionFrameId) => {
    switch (id) {
      case "songInfo":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="space-y-1.5 sm:col-span-2">
              <div className="h-7 flex items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  Song / Exercise Title
                </label>
                {activeSongs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSongMode((prev) => !prev);
                      if (!isCustomSongMode) {
                        onSongTitleChange("");
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-900/50 hover:bg-indigo-800/70 px-2 py-0.5 rounded-md border border-indigo-700/60 transition-colors cursor-pointer"
                  >
                    {isCustomSongMode ? (
                      <>
                        <ListMusic className="w-3 h-3 text-indigo-400" />
                        Choose from Library ({activeSongs.length})
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 text-emerald-400" />
                        Enter New Song
                      </>
                    )}
                  </button>
                )}
              </div>

              {!isCustomSongMode && activeSongs.length > 0 ? (
                <Select
                  required
                  value={songTitle}
                  onChange={(e) => {
                    onSongTitleChange(e.target.value);
                    if (e.target.value) {
                      triggerSpeedFlash();
                    }
                  }}
                  className="w-full bg-indigo-950/70 border-indigo-700 text-white font-medium h-10"
                >
                  <option value="" disabled>
                    Select a song...
                  </option>
                  {activeSongs.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  type="text"
                  required
                  maxLength={200}
                  value={songTitle}
                  onChange={(e) => onSongTitleChange(e.target.value)}
                  placeholder="e.g. Nothing Else Matters, Spider Walk Exercise..."
                  className="w-full bg-indigo-950/70 border-indigo-700 text-white font-medium h-10"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="h-7 flex items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  Date
                </label>
                <button
                  type="button"
                  onClick={() => onPracticeDateChange(new Date().toISOString().split("T")[0])}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-900/50 hover:bg-indigo-800/70 px-2 py-0.5 rounded-md border border-indigo-700/60 transition-colors cursor-pointer"
                  title="Set to today's date"
                >
                  Today
                </button>
              </div>
              <Input
                type="date"
                required
                value={practiceDate}
                onChange={(e) => onPracticeDateChange(e.target.value)}
                className="w-full bg-indigo-950/70 border-indigo-700 text-white h-10 font-mono"
              />
            </div>

            {/* Song Library Defaults Status & Sync */}
            {songTitle.trim() && (() => {
              const matchingSong = activeSongs.find(
                (s) => s.title.trim().toLowerCase() === songTitle.trim().toLowerCase()
              );
              const hasDefaults =
                matchingSong &&
                (matchingSong.duration !== undefined || matchingSong.difficulty !== undefined);

              return (
                <div className="sm:col-span-3 p-2.5 rounded-lg bg-indigo-950/70 border border-indigo-700/60 flex items-center justify-between flex-wrap gap-2 text-xs shadow-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-cyan-400" />
                      Song Library Defaults:
                    </span>
                    {matchingSong?.duration !== undefined && matchingSong.duration > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded text-[11px]">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        Time: {formatDurationColon(matchingSong.duration)}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans italic text-[11px]">
                        No default time set
                      </span>
                    )}
                    <span className="text-slate-600">·</span>
                    {matchingSong?.difficulty !== undefined && matchingSong.difficulty >= 1 ? (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded text-[11px]">
                        <Gauge className="w-3 h-3 text-amber-400" />
                        Difficulty: Level {matchingSong.difficulty}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans italic text-[11px]">
                        No default difficulty set
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {hasDefaults && (
                      <button
                        type="button"
                        onClick={() => {
                          if (matchingSong?.difficulty !== undefined) {
                            onDifficultyChange(matchingSong.difficulty);
                          }
                          if (matchingSong?.duration !== undefined) {
                            onDurationChange(formatDurationColon(matchingSong.duration));
                          }
                        }}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                        title="Re-apply this song's library defaults (time & difficulty) to the current form"
                      >
                        (Re-apply Library Defaults)
                      </button>
                    )}
                    {onUpdateSongDefaults && (
                      <button
                        type="button"
                        onClick={() => {
                          const parsedSec = duration ? parseDurationInputToSeconds(duration) : undefined;
                          onUpdateSongDefaults(songTitle, parsedSec, difficulty);
                        }}
                        className="text-[11px] font-medium text-cyan-300 hover:text-cyan-100 bg-cyan-950/70 border border-cyan-500/50 hover:border-cyan-400 px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
                        title="Save current time and difficulty level as this song's default in the Songs Library"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        Save as Song Defaults
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        );

      case "metrics":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Gauge className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                  Performance Numbers
                </span>
                {prevSession && (
                  <span
                    className="text-xs font-semibold text-emerald-400 font-mono normal-case"
                    title={
                      isSongSpecific
                        ? `Previous session for "${songTitle}": ${prevSession.correctNotes}/${prevSession.totalNotes} notes (${prevSession.accuracy}% accuracy) @ ${prevSession.speed}% speed`
                        : `Previous session: ${prevSession.correctNotes}/${prevSession.totalNotes} notes (${prevSession.accuracy}% accuracy) @ ${prevSession.speed}% speed`
                    }
                  >
                    (Prev: {prevSession.correctNotes}/{prevSession.totalNotes} notes · {prevSession.speed}% speed · {prevSession.accuracy}%)
                  </span>
                )}
              </div>
              {liveAccuracy !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold font-mono",
                    liveAccuracy >= 90
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                      : liveAccuracy >= 70
                      ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                      : "bg-rose-950/60 border-rose-500/40 text-rose-300"
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {correctNotes} / {totalNotes} notes ({liveAccuracy}% Accuracy)
                </span>
              )}
            </div>

            {/* Software Speed Match Banner when speed is changed / flashing */}
            {isSpeedFlashing && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/90 border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.7)] text-emerald-200 text-xs animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-white">⚡ SOFTWARE MATCH REMINDER:</span>
                  <span>Set your practice software (e.g., Rocksmith / Guitar Pro) to <strong className="text-white font-mono">{speed || "100"}%</strong> speed now!</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-400 text-emerald-950 font-black font-mono text-xs">
                  {speed || "100"}% SPEED
                </span>
              </div>
            )}

            {/* 4 Textboxes Lined Up Horizontally with Exact Equal Heights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
              {/* 1. Difficulty */}
              <div className="space-y-1.5">
                <div className="h-7 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <label className="text-xs font-medium text-indigo-200 truncate">
                      Difficulty
                    </label>
                    {prevDifficulty !== undefined && prevDifficulty !== null && (
                      <button
                        type="button"
                        onClick={() => onDifficultyChange(prevDifficulty)}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
                        title={`Click to fill previous difficulty: ${prevDifficulty}`}
                      >
                        ({prevDifficulty})
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-indigo-400 font-mono shrink-0">1-12</span>
                </div>
                <NumericKeypadInput
                  label="Difficulty"
                  min={1}
                  max={12}
                  required
                  value={difficulty}
                  onChange={(val) =>
                    onDifficultyChange(
                      val === "" ? 1 : Math.min(12, Math.max(1, parseInt(val, 10) || 1))
                    )
                  }
                  quickPresets={[
                    { label: "1", value: "1" },
                    { label: "3", value: "3" },
                    { label: "5", value: "5" },
                    { label: "8", value: "8" },
                    { label: "10", value: "10" },
                    { label: "12", value: "12" },
                  ]}
                  inputClassName="w-full h-10 text-center font-mono font-bold text-base text-white bg-indigo-950/80 border-indigo-700 focus:border-indigo-400"
                  placeholder="1"
                />
                <span className="text-[10px] text-indigo-400/80 block text-center h-5 leading-5 truncate">
                  Difficulty Level
                </span>
              </div>

              {/* 2. Total Notes */}
              <div className="space-y-1.5">
                <div className="h-7 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <label
                      className={cn(
                        "text-xs font-medium transition-colors truncate",
                        isTestSession ? "text-indigo-400/50" : "text-indigo-200"
                      )}
                    >
                      Total Notes
                    </label>
                    {prevTotalNotes !== undefined && prevTotalNotes !== null && (
                      <button
                        type="button"
                        disabled={isTestSession}
                        onClick={() => !isTestSession && onTotalNotesChange(String(prevTotalNotes))}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                        title={`Click to fill previous total notes: ${prevTotalNotes}`}
                      >
                        ({prevTotalNotes})
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-indigo-400 font-mono shrink-0">Goal</span>
                </div>
                <NumericKeypadInput
                  label="Total Notes"
                  min={1}
                  step={10}
                  disabled={isTestSession}
                  value={totalNotes}
                  onChange={(val) => onTotalNotesChange(val)}
                  quickPresets={[
                    { label: "50", value: "50" },
                    { label: "100", value: "100" },
                    { label: "150", value: "150" },
                    { label: "200", value: "200" },
                    { label: "300", value: "300" },
                  ]}
                  placeholder={isTestSession ? "Song default" : "e.g. 150"}
                  inputClassName={cn(
                    "w-full h-10 text-center font-mono font-bold text-base text-white bg-indigo-950/80 border-indigo-700 focus:border-indigo-400 transition-all",
                    isTestSession &&
                      "opacity-40 bg-indigo-950/20 border-indigo-900/40 cursor-not-allowed placeholder:text-indigo-500/40"
                  )}
                />
                <span className="text-[10px] text-indigo-400/80 block text-center h-5 leading-5 truncate">
                  {isTestSession ? "From song total" : "Notes in song"}
                </span>
              </div>

              {/* 3. Correct Notes */}
              <div className="space-y-1.5">
                <div className="h-7 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <label
                      className={cn(
                        "text-xs font-medium transition-colors truncate",
                        isTestSession ? "text-indigo-400/50 cursor-not-allowed" : "text-indigo-200"
                      )}
                    >
                      Correct Notes
                    </label>
                    {prevCorrectNotes !== undefined && prevCorrectNotes !== null && (
                      <button
                        type="button"
                        disabled={isTestSession}
                        onClick={() => !isTestSession && onCorrectNotesChange(String(prevCorrectNotes))}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                        title={`Click to fill previous correct notes: ${prevCorrectNotes}`}
                      >
                        ({prevCorrectNotes})
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-indigo-400 font-mono shrink-0">Hit</span>
                </div>
                <NumericKeypadInput
                  label="Correct Notes"
                  min={0}
                  max={parseInt(totalNotes, 10) > 0 ? parseInt(totalNotes, 10) : undefined}
                  disabled={isTestSession}
                  value={isTestSession ? "" : correctNotes}
                  onChange={(val) => onCorrectNotesChange(val)}
                  quickPresets={
                    parseInt(totalNotes, 10) > 0
                      ? [
                          { label: "100%", value: String(parseInt(totalNotes, 10)) },
                          {
                            label: "95%",
                            value: String(Math.round(parseInt(totalNotes, 10) * 0.95)),
                          },
                          {
                            label: "90%",
                            value: String(Math.round(parseInt(totalNotes, 10) * 0.9)),
                          },
                          {
                            label: "80%",
                            value: String(Math.round(parseInt(totalNotes, 10) * 0.8)),
                          },
                        ]
                      : [
                          { label: "50", value: "50" },
                          { label: "100", value: "100" },
                          { label: "150", value: "150" },
                          { label: "200", value: "200" },
                        ]
                  }
                  placeholder={isTestSession ? "N/A" : "e.g. 142"}
                  inputClassName={cn(
                    "w-full h-10 text-center font-mono font-bold text-base text-white bg-indigo-950/80 border-indigo-700 focus:border-indigo-400 transition-all",
                    isTestSession &&
                      "opacity-40 bg-indigo-950/20 border-indigo-900/40 cursor-not-allowed placeholder:text-indigo-500/40"
                  )}
                />
                <span className="text-[10px] text-indigo-400/80 block text-center h-5 leading-5 truncate">
                  {isTestSession ? "N/A for test" : "Accurate notes"}
                </span>
              </div>

              {/* 4. Speed with Green Flash Software Match Reminder */}
              <div className="space-y-1.5 relative">
                <div className="h-7 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <label className="text-xs font-medium text-indigo-200 truncate">
                      Speed
                    </label>
                    {prevSpeed !== undefined && prevSpeed !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          onSpeedChange(String(prevSpeed));
                          triggerSpeedFlash();
                        }}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
                        title={`Click to fill previous speed: ${prevSpeed}%`}
                      >
                        ({prevSpeed}%)
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-indigo-400 font-mono shrink-0">%</span>
                </div>
                <NumericKeypadInput
                  label="Speed (%)"
                  min={0}
                  max={200}
                  step={5}
                  value={speed}
                  onChange={(val) => {
                    onSpeedChange(val);
                    triggerSpeedFlash();
                  }}
                  quickPresets={[
                    { label: "50%", value: "50" },
                    { label: "75%", value: "75" },
                    { label: "85%", value: "85" },
                    { label: "90%", value: "90" },
                    { label: "100%", value: "100" },
                  ]}
                  placeholder="100"
                  containerClassName={cn(
                    "transition-all duration-300 rounded-md",
                    isSpeedFlashing && "ring-4 ring-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.95)] scale-[1.01]"
                  )}
                  inputClassName={cn(
                    "w-full h-10 text-center font-mono font-bold text-base text-white transition-all duration-300",
                    isSpeedFlashing
                      ? "animate-speed-flash-green !text-white font-black"
                      : "bg-indigo-950/80 border-indigo-700 focus:border-indigo-400"
                  )}
                />
                <div className="h-5 flex items-center justify-between text-[10px] pt-0.5">
                  <span className="text-indigo-400/80 truncate">
                    Speed %
                  </span>
                  <button
                    type="button"
                    onClick={triggerSpeedFlash}
                    className="text-indigo-400/70 hover:text-emerald-300 transition-colors flex items-center gap-0.5 cursor-pointer shrink-0"
                    title="Click to flash reminder: Set practice software to same speed"
                  >
                    ⚡ Match
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "duration":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <label className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                  Duration Setting
                </label>
                <span className="text-xs font-mono font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30">
                  1:01 (minutes:seconds)
                </span>
              </div>

              {/* Live Practice Stopwatch Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning((prev) => !prev)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                    isTimerRunning
                      ? "bg-amber-500/20 border-amber-400/60 text-amber-200 animate-pulse"
                      : "bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-300"
                  )}
                  title={isTimerRunning ? "Pause live timer" : "Start live practice timer"}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      Pause Timer
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Start Timer
                    </>
                  )}
                </button>
                {duration && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTimerRunning(false);
                      onDurationChange("");
                    }}
                    className="p-1 rounded-lg bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/60 transition-colors cursor-pointer"
                    title="Reset duration"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Horizontal Lineup for Duration Textbox, Steppers, and Quick Presets */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Duration Input & Steppers Lined Up Horizontally */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-36">
                  <NumericKeypadInput
                    label="Duration (m:ss)"
                    allowColon
                    maxLength={8}
                    value={duration}
                    onChange={(val) => onDurationChange(val)}
                    onBlur={handleDurationBlur}
                    stepLabel="15s"
                    onCustomStep={(dir) => handleAdjustDuration(dir * 15)}
                    quickPresets={[
                      { label: "0:30", value: "0:30" },
                      { label: "1:00", value: "1:00" },
                      { label: "1:01", value: "1:01" },
                      { label: "1:30", value: "1:30" },
                      { label: "2:00", value: "2:00" },
                      { label: "3:00", value: "3:00" },
                    ]}
                    placeholder="1:01"
                    inputClassName="h-10 text-center font-mono font-bold text-base text-white bg-indigo-950/80 border-indigo-700 focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdjustDuration(-15)}
                    className="h-10 px-2.5 text-xs font-mono font-medium rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition-colors cursor-pointer flex items-center justify-center"
                    title="Subtract 15 seconds"
                  >
                    -15s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustDuration(15)}
                    className="h-10 px-2.5 text-xs font-mono font-medium rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition-colors cursor-pointer flex items-center justify-center"
                    title="Add 15 seconds"
                  >
                    +15s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustDuration(60)}
                    className="h-10 px-2.5 text-xs font-mono font-medium rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition-colors cursor-pointer flex items-center justify-center"
                    title="Add 1 minute"
                  >
                    +1m
                  </button>
                </div>
              </div>

              {/* Quick Presets Lined Up Horizontally with Matching Height */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                <span className="text-[11px] text-indigo-400 mr-1 shrink-0">Presets:</span>
                {DURATION_PRESETS.map((p) => {
                  const isSelected =
                    duration.trim() === p ||
                    (parsedDurationSeconds !== undefined &&
                      formatDurationColon(parsedDurationSeconds) === p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onDurationChange(p)}
                      className={cn(
                        "h-10 px-3 text-xs font-mono rounded-lg border transition-colors cursor-pointer flex items-center justify-center",
                        isSelected
                          ? "bg-emerald-600/30 border-emerald-400 text-emerald-200 font-bold shadow-sm"
                          : "bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 border-indigo-700/50"
                      )}
                      title={`Set duration to ${p} (minutes:seconds)`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live duration summary */}
            <div className="flex items-center justify-between text-xs text-indigo-300/90 pt-0.5">
              <span className="text-[11px] text-indigo-400">
                Enter in <strong className="text-indigo-200 font-mono">1:01</strong> format (minutes:seconds) or use the live timer
              </span>
              {parsedDurationSeconds !== undefined && parsedDurationSeconds > 0 && (
                <span className="font-mono text-emerald-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {formattedDurationColon} ({durationHumanLabel} • {parsedDurationSeconds}s)
                </span>
              )}
            </div>
          </div>
        );

      case "coach":
        return (
          <div className="space-y-2">
            <PracticeSessionLiveCoach
              songTitle={songTitle}
              difficulty={difficulty}
              speed={speed}
              duration={duration}
              isTimerRunning={isTimerRunning}
            />
          </div>
        );

      case "options":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40 cursor-pointer select-none hover:bg-indigo-900/30 transition-colors h-10">
              <input
                type="checkbox"
                id="isPartial"
                className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                checked={isPartial}
                onChange={(e) => onIsPartialChange(e.target.checked)}
              />
              <span className="text-xs font-medium text-indigo-200">
                Partial Song Practice
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40 cursor-pointer select-none hover:bg-indigo-900/30 transition-colors h-10">
              <input
                type="checkbox"
                id="isShortVersion"
                className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                checked={Boolean(isShortVersion)}
                onChange={(e) => onIsShortVersionChange?.(e.target.checked)}
              />
              <span className="text-xs font-medium text-indigo-200">
                Short version
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-lg bg-indigo-950/40 border border-indigo-800/40 cursor-pointer select-none hover:bg-indigo-900/30 transition-colors h-10">
              <input
                type="checkbox"
                id="isTestSession"
                className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                checked={isTestSession}
                onChange={(e) => onIsTestSessionChange(e.target.checked)}
              />
              <span className="text-xs font-medium text-indigo-200">
                Test Session Mode
              </span>
            </label>

            {/* Score Input Lined Up Horizontally with Matching Height */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="score"
                className={cn(
                  "text-xs font-medium whitespace-nowrap transition-colors",
                  isTestSession
                    ? "text-indigo-200 cursor-pointer"
                    : "text-indigo-400/40 cursor-not-allowed"
                )}
              >
                Test Score:
              </label>
              <NumericKeypadInput
                id="score"
                label="Test Score"
                disabled={!isTestSession}
                min={0}
                max={999999999999999}
                maxLength={15}
                step={100}
                quickPresets={[
                  { label: "1k", value: "1000" },
                  { label: "5k", value: "5000" },
                  { label: "10k", value: "10000" },
                  { label: "50k", value: "50000" },
                  { label: "100k", value: "100000" },
                ]}
                inputClassName={cn(
                  "h-10 w-full text-xs font-mono font-bold text-center transition-all",
                  !isTestSession &&
                    "opacity-40 bg-indigo-950/20 border-indigo-900/40 cursor-not-allowed"
                )}
                value={score}
                onChange={(val) => {
                  if (val.length <= 15) {
                    onScoreChange(val);
                  }
                }}
                placeholder={isTestSession ? "Points / Score" : "N/A"}
              />
            </div>
          </div>
        );

      case "notes":
        return (
          <div className="space-y-1.5">
            <div className="h-7 flex items-center justify-between text-xs">
              <label className="font-semibold uppercase tracking-wider text-indigo-300">
                Personal Practice Log & Reflections
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {note.length} / 500 characters
              </span>
            </div>
            <textarea
              className="flex min-h-[85px] w-full rounded-xl border border-indigo-700/80 bg-indigo-950/60 text-indigo-50 px-3.5 py-2.5 text-sm placeholder:text-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none dialog-scrollbar"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="e.g. Focused on bridge section tempo and clean finger transitions..."
              rows={3}
              maxLength={500}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MoveableResizableFrame
      isOpen={true}
      onClose={onCancel}
      title={editingPracticeId ? "Edit Practice Session" : "Record Practice Session"}
      subtitle="Log date, duration, song title, difficulty level, accuracy, and speed"
      icon={<Music className="w-5 h-5 text-indigo-400" />}
      initialMaximized={true}
      initialWidth={880}
      initialHeight={800}
      minWidth={360}
      minHeight={320}
      ariaLabel={editingPracticeId ? "Edit Practice Session" : "Record Practice Session"}
      headerActions={<WindowsVolumeSlider variant="compact" />}
    >
      <div ref={dialogTopRef} className="max-w-5xl mx-auto space-y-4">
        {/* Top of Frame: Windows Volume Slider & Session Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-indigo-800/70 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Session Audio & Volume Control
              </span>
              <span className="text-[11px] text-indigo-300/80">
                Adjust backing tracks, metronome, and Windows volume levels
              </span>
            </div>
          </div>
          <WindowsVolumeSlider variant="toolbar" showLabel={true} />
        </div>

        {/* Rearrangeable Section Frames Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-800/60 shadow-sm">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Rearrangeable Section Frames ({framesOrder.length})
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400">
              • Drag handles or use ↑ / ↓ arrows to reorder
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAllFrames}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              {Object.values(minimizedFrames).every(Boolean) ? "Expand All" : "Collapse All"}
            </button>
            <button
              type="button"
              onClick={resetFramesLayout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/50 hover:bg-indigo-800/70 text-indigo-200 hover:text-white border border-indigo-700/60 text-xs font-medium transition-colors cursor-pointer"
              title="Reset frame order and expand state to default"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              Reset Order
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Dynamic Modular Frames */}
          <div className="space-y-3.5">
            {framesOrder.map((frameId, index) => {
              const meta = DEFAULT_SESSION_FRAMES.find((f) => f.id === frameId);
              if (!meta) return null;
              const Icon = meta.icon;
              const isMinimized = Boolean(minimizedFrames[frameId]);
              const isDragging = draggedFrameId === frameId;
              const isDragOver = dragOverFrameId === frameId;

              return (
                <div
                  key={frameId}
                  draggable
                  onDragStart={(e) => handleDragStart(frameId, e)}
                  onDragOver={(e) => handleDragOver(frameId, e)}
                  onDragLeave={() => {
                    if (dragOverFrameId === frameId) setDragOverFrameId(null);
                  }}
                  onDrop={(e) => handleDrop(frameId, e)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "rounded-xl border transition-all duration-200 overflow-hidden bg-slate-900/80 backdrop-blur shadow-md",
                    isDragging
                      ? "opacity-50 border-cyan-400 border-dashed ring-2 ring-cyan-400/40"
                      : isDragOver
                      ? "border-cyan-400 ring-2 ring-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                      : "border-indigo-800/70 hover:border-indigo-600/80"
                  )}
                >
                  {/* Frame Header */}
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 select-none border-b border-indigo-800/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors"
                        title="Drag to rearrange frame position"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-700/60 text-cyan-300 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
                            {meta.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                            #{index + 1}
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-300/75 truncate hidden sm:block">
                          {meta.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Dynamic Summary Badge */}
                      <div className="max-w-[240px] truncate">
                        {getFrameBadge(frameId)}
                      </div>

                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveFrame(index, "up")}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-indigo-900/50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Move frame up"
                        aria-label={`Move ${meta.title} frame up`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={index === framesOrder.length - 1}
                        onClick={() => moveFrame(index, "down")}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-indigo-900/50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Move frame down"
                        aria-label={`Move ${meta.title} frame down`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Minimize / Expand */}
                      <button
                        type="button"
                        onClick={() => toggleFrameMinimize(frameId)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-indigo-900/50 transition-colors cursor-pointer"
                        title={isMinimized ? "Expand frame" : "Minimize frame"}
                        aria-label={isMinimized ? `Expand ${meta.title} frame` : `Minimize ${meta.title} frame`}
                      >
                        {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Frame Body (when expanded) */}
                  {!isMinimized && (
                    <div className="p-3.5 sm:p-4 bg-slate-950/40">
                      {renderFrameContent(frameId)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error Message Alert if save failed */}
          {saveError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-800/60 sticky bottom-0 bg-slate-950/95 backdrop-blur-md p-3 -mx-2 rounded-xl shadow-lg border border-indigo-800/40">
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={() => {
                setIsTimerRunning(false);
                onCancel();
              }}
              className="text-indigo-300 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !songTitle.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 shadow-md shadow-indigo-600/30 gap-1.5 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving
                ? "Saving..."
                : editingPracticeId
                ? "Update Session"
                : "Save Practice Session"}
            </Button>
          </div>
        </form>
      </div>
    </MoveableResizableFrame>
  );
};
