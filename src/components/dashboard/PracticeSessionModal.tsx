import React, { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { NumericKeypadInput } from "../ui/numeric-keypad-input";
import { Select } from "../ui/select";
import { Song } from "../../types";
import { cn } from "../../lib/utils";
import {
  formatDurationColon,
  parseDurationInputToSeconds,
  formatDurationLabel,
} from "../../utils/durationFormat";

interface PracticeSessionModalProps {
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
  isTestSession: boolean;
  onIsTestSessionChange: (checked: boolean) => void;
  score: string;
  onScoreChange: (val: string) => void;
  speed: string;
  onSpeedChange: (val: string) => void;
  note: string;
  onNoteChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const DURATION_PRESETS = ["0:30", "0:45", "1:00", "1:01", "1:15", "1:30", "2:00", "3:00", "5:00"];

export const PracticeSessionModal: React.FC<PracticeSessionModalProps> = ({
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
  isTestSession,
  onIsTestSessionChange,
  score,
  onScoreChange,
  speed,
  onSpeedChange,
  note,
  onNoteChange,
  onSubmit,
  onCancel,
}) => {
  const [isCustomSongMode, setIsCustomSongMode] = useState<boolean>(activeSongs.length === 0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const dialogTopRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={dialogTopRef} className="max-w-2xl mx-auto">
      <Card className="border-indigo-800/80 bg-slate-950/95 shadow-2xl shadow-indigo-950/70 overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-indigo-800/50 p-4 sm:p-5 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-950/80 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
              <Music className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl text-white">
                {editingPracticeId ? "Edit Practice Session" : "Record Practice Session"}
              </CardTitle>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                Log date, duration, song title, difficulty level, accuracy (correct/total notes), and speed.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-indigo-400 hover:text-white p-1.5 rounded-lg hover:bg-indigo-900/50 transition-colors"
            title="Cancel"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Top Row: Song Title and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
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
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-900/50 hover:bg-indigo-800/70 px-2 py-0.5 rounded-md border border-indigo-700/60 transition-colors"
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
                    onChange={(e) => onSongTitleChange(e.target.value)}
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
                <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Date
                </label>
                <Input
                  type="date"
                  required
                  value={practiceDate}
                  onChange={(e) => onPracticeDateChange(e.target.value)}
                  className="w-full bg-indigo-950/70 border-indigo-700 text-white h-10"
                />
              </div>
            </div>

            {/* Small Numeric Fields Section: Difficulty, Total Notes, Correct Notes, Speed */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-b from-indigo-950/60 to-slate-900/60 border border-indigo-800/60 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                    Session Metrics & Accuracy Score
                  </span>
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Difficulty */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-indigo-200">
                      Difficulty
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">1-12</span>
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
                  <span className="text-[10px] text-indigo-400/80 block text-center">
                    Difficulty Level
                  </span>
                </div>

                {/* 2. Total Notes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isTestSession ? "text-indigo-400/50" : "text-indigo-200"
                      )}
                    >
                      Total Notes
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">Goal</span>
                  </div>
                  <NumericKeypadInput
                    label="Total Notes"
                    min={1}
                    step={10}
                    required={!isTestSession}
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
                  <span className="text-[10px] text-indigo-400/80 block text-center truncate">
                    {isTestSession ? "From song total" : "Notes in song"}
                  </span>
                </div>

                {/* 3. Correct Notes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className={cn(
                        "text-xs font-medium transition-colors",
                        isTestSession ? "text-indigo-400/50 cursor-not-allowed" : "text-indigo-200"
                      )}
                    >
                      Correct Notes
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">Hit</span>
                  </div>
                  <NumericKeypadInput
                    label="Correct Notes"
                    min={0}
                    max={parseInt(totalNotes, 10) > 0 ? parseInt(totalNotes, 10) : undefined}
                    required={!isTestSession}
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
                  <span className="text-[10px] text-indigo-400/80 block text-center truncate">
                    {isTestSession ? "N/A for test" : "Accurate notes"}
                  </span>
                </div>

                {/* 4. Speed */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-indigo-200">
                      Speed
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">%</span>
                  </div>
                  <NumericKeypadInput
                    label="Speed (%)"
                    min={0}
                    max={200}
                    step={5}
                    required
                    value={speed}
                    onChange={(val) => onSpeedChange(val)}
                    quickPresets={[
                      { label: "50%", value: "50" },
                      { label: "75%", value: "75" },
                      { label: "85%", value: "85" },
                      { label: "90%", value: "90" },
                      { label: "100%", value: "100" },
                    ]}
                    placeholder="100"
                    inputClassName="w-full h-10 text-center font-mono font-bold text-base text-white bg-indigo-950/80 border-indigo-700 focus:border-indigo-400"
                  />
                  <span className="text-[10px] text-indigo-400/80 block text-center">
                    Practice Speed %
                  </span>
                </div>
              </div>
            </div>

            {/* Duration Section: Formatted as "1:01  minutes:seconds" with built-in stopwatch */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-b from-indigo-950/60 to-slate-900/60 border border-indigo-800/60 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                    Duration
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
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all",
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
                      className="p-1 rounded-lg bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/60 transition-colors"
                      title="Reset duration"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Duration Input & Steppers */}
                <div className="flex items-center gap-2">
                  <div className="relative w-32">
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
                      className="px-2 py-2 text-xs font-mono font-medium rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition-colors"
                      title="Subtract 15 seconds"
                    >
                      -15s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustDuration(15)}
                      className="px-2 py-2 text-xs font-mono font-medium rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition-colors"
                      title="Add 15 seconds"
                    >
                      +15s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustDuration(60)}
                      className="px-2 py-2 text-xs font-mono font-medium rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition-colors"
                      title="Add 1 minute"
                    >
                      +1m
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  <span className="text-[11px] text-indigo-400 mr-1">Presets:</span>
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
                          "px-2 py-1 text-xs font-mono rounded-lg border transition-colors",
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

            {/* Session Options: Partial Song Practice, Test Session, Score */}
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
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

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="isTestSession"
                    className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={isTestSession}
                    onChange={(e) => onIsTestSessionChange(e.target.checked)}
                  />
                  <span className="text-xs font-medium text-indigo-200">
                    Test Session
                  </span>
                </label>
              </div>

              {/* Score Input (Active during Test Session) */}
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
                    "h-9 w-36 text-xs font-mono transition-all",
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

            {/* Session Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Session Notes
              </label>
              <textarea
                className="flex min-h-[75px] w-full rounded-xl border border-indigo-700/80 bg-indigo-950/60 text-indigo-50 px-3.5 py-2 text-sm placeholder:text-indigo-500/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none dialog-scrollbar"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="e.g. Focused on bridge section tempo and clean finger transitions..."
                rows={2}
                maxLength={500}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-800/60">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsTimerRunning(false);
                  onCancel();
                }}
                className="text-indigo-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!songTitle.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 shadow-md shadow-indigo-600/30"
              >
                {editingPracticeId ? "Update Session" : "Save Practice Session"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
