import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  Volume2,
  Sparkles,
  FileText,
  AlertCircle,
  Radio,
  RotateCcw,
} from "lucide-react";
import { Button } from "../ui/button";
import { WindowsVolumeSlider } from "../ui/WindowsVolumeSlider";
import { cn } from "../../lib/utils";
import { formatDurationColon } from "../../utils/durationFormat";
import { masterAudio } from "../../utils/masterAudioController";

export interface RecordedSongTake {
  id: string;
  takeNumber: number;
  songTitle: string;
  durationSeconds: number;
  createdAt: number;
  url: string;
  mimeType: string;
  peakLevel: number;
}

interface OnDemandSongRecorderProps {
  songTitle: string;
  speed?: string;
  difficulty?: number;
  onApplyDuration: (formattedColonDuration: string) => void;
  onAppendNote?: (noteSnippet: string) => void;
  compact?: boolean;
}

export const OnDemandSongRecorder: React.FC<OnDemandSongRecorderProps> = ({
  songTitle,
  speed = "100",
  difficulty = 1,
  onApplyDuration,
  onAppendNote,
  compact = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [useCountIn, setUseCountIn] = useState<boolean>(false);
  const [autoSyncDuration, setAutoSyncDuration] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [peakLevel, setPeakLevel] = useState<number>(0);
  const [frequencyBars, setFrequencyBars] = useState<number[]>(new Array(24).fill(4));
  const [takes, setTakes] = useState<RecordedSongTake[]>([]);
  const [playingTakeId, setPlayingTakeId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [appliedTakeId, setAppliedTakeId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countInTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef<number>(0);
  const peakRef = useRef<number>(0);
  const takeCounterRef = useRef<number>(0);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement | null>>({});

  const stopAudioAnalysis = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
    setFrequencyBars(new Array(24).fill(4));
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countInTimerRef.current) clearInterval(countInTimerRef.current);
      stopAudioAnalysis();
      stopStream();
      takes.forEach((t) => URL.revokeObjectURL(t.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateVisualizer = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    const normalized = Math.min(100, Math.round((avg / 180) * 100));
    setAudioLevel(normalized);

    if (normalized > peakRef.current) {
      peakRef.current = normalized;
      setPeakLevel(normalized);
    }

    const barCount = 24;
    const step = Math.max(1, Math.floor(dataArray.length / barCount));
    const bars: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const val = dataArray[i * step] || 0;
      bars.push(Math.max(6, Math.min(100, Math.round((val / 255) * 100))));
    }
    setFrequencyBars(bars);

    rafRef.current = requestAnimationFrame(updateVisualizer);
  }, []);

  const beginMediaRecording = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      // Setup Web Audio API visualizer
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Pick supported mimeType
      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ];
      let selectedMimeType = "";
      for (const mime of preferredMimeTypes) {
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const recorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      elapsedRef.current = 0;
      peakRef.current = 0;
      setElapsedSeconds(0);
      setPeakLevel(0);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalDuration = Math.max(1, elapsedRef.current);
        const finalMime = recorder.mimeType || selectedMimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMime });
        const url = URL.createObjectURL(blob);
        takeCounterRef.current += 1;

        const newTake: RecordedSongTake = {
          id: `take-${Date.now()}-${takeCounterRef.current}`,
          takeNumber: takeCounterRef.current,
          songTitle: songTitle.trim() || "Untitled Song Take",
          durationSeconds: finalDuration,
          createdAt: Date.now(),
          url,
          mimeType: finalMime,
          peakLevel: peakRef.current,
        };

        setTakes((prev) => [newTake, ...prev]);

        if (autoSyncDuration) {
          const formatted = formatDurationColon(finalDuration);
          onApplyDuration(formatted);
          setAppliedTakeId(newTake.id);
        }

        stopAudioAnalysis();
        stopStream();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);
        if (autoSyncDuration) {
          onApplyDuration(formatDurationColon(elapsedRef.current));
        }
      }, 1000);

      rafRef.current = requestAnimationFrame(updateVisualizer);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Microphone access was denied or no audio input device was found.";
      setMicError(
        `Unable to access microphone (${message}). Check browser microphone permissions and try again.`
      );
      setIsRecording(false);
      setCountdown(null);
    }
  }, [autoSyncDuration, onApplyDuration, songTitle, stopAudioAnalysis, stopStream, updateVisualizer]);

  const handleStartRecording = () => {
    setMicError(null);
    if (useCountIn) {
      let remaining = 3;
      setCountdown(remaining);
      masterAudio.playCountInClick(true);
      countInTimerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          if (countInTimerRef.current) clearInterval(countInTimerRef.current);
          setCountdown(null);
          masterAudio.playCountInClick(true);
          beginMediaRecording();
        } else {
          setCountdown(remaining);
          masterAudio.playCountInClick(false);
        }
      }, 1000);
    } else {
      beginMediaRecording();
    }
  };

  const handlePauseResume = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording) return;

    if (isPaused) {
      recorder.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsedSeconds(elapsedRef.current);
        if (autoSyncDuration) {
          onApplyDuration(formatDurationColon(elapsedRef.current));
        }
      }, 1000);
      rafRef.current = requestAnimationFrame(updateVisualizer);
    } else {
      recorder.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  };

  const handleStopRecording = () => {
    if (countInTimerRef.current) {
      clearInterval(countInTimerRef.current);
      countInTimerRef.current = null;
      setCountdown(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const handlePlayTake = (takeId: string) => {
    const audioEl = audioElementsRef.current[takeId];
    if (!audioEl) return;

    if (playingTakeId === takeId) {
      audioEl.pause();
      setPlayingTakeId(null);
    } else {
      // Pause any other playing take
      Object.entries(audioElementsRef.current).forEach(([id, el]) => {
        if (id !== takeId && el) {
          el.pause();
          el.currentTime = 0;
        }
      });
      audioEl.volume = masterAudio.getEffectiveVolume();
      audioEl.muted = masterAudio.getState().isMuted;
      audioEl.play().catch(() => {});
      setPlayingTakeId(takeId);
    }
  };

  const handleDownloadTake = (take: RecordedSongTake) => {
    const safeSong = (take.songTitle || "guitar-song")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const ext = take.mimeType.includes("mp4")
      ? "m4a"
      : take.mimeType.includes("ogg")
      ? "ogg"
      : "webm";
    const filename = `${safeSong || "song"}-take-${take.takeNumber}-${formatDurationColon(
      take.durationSeconds
    ).replace(":", "m")}s.${ext}`;

    const a = document.createElement("a");
    a.href = take.url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteTake = (takeId: string) => {
    setTakes((prev) => {
      const target = prev.find((t) => t.id === takeId);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((t) => t.id !== takeId);
    });
    if (playingTakeId === takeId) {
      setPlayingTakeId(null);
    }
  };

  const handleUseTakeDuration = (take: RecordedSongTake) => {
    const formatted = formatDurationColon(take.durationSeconds);
    onApplyDuration(formatted);
    setAppliedTakeId(take.id);
  };

  const handleLogTakeToNotes = (take: RecordedSongTake) => {
    if (!onAppendNote) return;
    const timeStr = new Date(take.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const snippet = `[Recorded Take #${take.takeNumber} (${timeStr}): "${take.songTitle}" — Duration ${formatDurationColon(
      take.durationSeconds
    )} @ ${speed || "100"}% speed, Diff ${difficulty}]`;
    onAppendNote(snippet);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-indigo-700/70 bg-slate-950/85 p-3.5 space-y-3 shadow-sm",
        isRecording && "border-rose-500/80 ring-1 ring-rose-500/40"
      )}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "p-1.5 rounded-lg border shrink-0 transition-colors",
              isRecording
                ? "bg-rose-950/90 border-rose-500 text-rose-300"
                : "bg-indigo-950 border-indigo-700/70 text-cyan-300"
            )}
          >
            <Radio className={cn("w-4 h-4", isRecording && !isPaused && "animate-pulse text-rose-400")} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                On-Demand Song Audio Recorder
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950/90 border border-indigo-700/60 text-cyan-300 truncate max-w-[220px]">
                {songTitle.trim() ? songTitle.trim() : "Ready to record any song"}
              </span>
            </div>
            {!compact && (
              <p className="text-[11px] text-indigo-300/80">
                Record your guitar performance on demand, listen back immediately, download audio, and auto-fill session duration
              </p>
            )}
          </div>
        </div>

        {/* Right Options: Volume Slider, Count-in & Auto-sync Duration */}
        <div className="flex items-center gap-3 flex-wrap">
          <WindowsVolumeSlider variant="compact" />

          <label className="inline-flex items-center gap-1.5 text-[11px] text-indigo-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useCountIn}
              disabled={isRecording || countdown !== null}
              onChange={(e) => setUseCountIn(e.target.checked)}
              className="rounded border-indigo-600 bg-indigo-950 text-indigo-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>3s Count-In</span>
          </label>

          <label className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSyncDuration}
              onChange={(e) => setAutoSyncDuration(e.target.checked)}
              className="rounded border-emerald-600 bg-indigo-950 text-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Auto-Fill Session Duration</span>
          </label>
        </div>
      </div>

      {/* Main Recorder Console Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center p-3 rounded-xl bg-slate-900/90 border border-slate-800">
        {/* Left: Primary Transport Controls */}
        <div className="lg:col-span-5 flex items-center gap-2 flex-wrap">
          {!isRecording && countdown === null ? (
            <Button
              type="button"
              size="sm"
              onClick={handleStartRecording}
              className="h-9 px-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold gap-1.5 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Record Song Now</span>
            </Button>
          ) : countdown !== null ? (
            <div className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg bg-amber-950/90 border border-amber-500 text-amber-200 font-mono text-xs font-bold">
              <span>Count-In: {countdown}...</span>
              <button
                type="button"
                onClick={handleStopRecording}
                className="ml-1 text-amber-300 hover:text-white underline text-[11px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handlePauseResume}
                variant="outline"
                className="h-9 px-3 border-amber-500/70 bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 gap-1.5 cursor-pointer"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleStopRecording}
                className="h-9 px-3.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/60 font-semibold gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                <span>Stop & Save Take</span>
              </Button>
            </>
          )}

          {/* Live Elapsed Timer */}
          <div className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-slate-950 border border-indigo-800/80 font-mono tabular-nums">
            <Clock
              className={cn(
                "w-3.5 h-3.5 shrink-0",
                isRecording && !isPaused ? "text-rose-400" : "text-emerald-400"
              )}
            />
            <span className="text-sm font-bold text-white tabular-nums">
              {formatDurationColon(elapsedSeconds)}
            </span>
            {elapsedSeconds > 0 && !isRecording && (
              <button
                type="button"
                onClick={() => {
                  setElapsedSeconds(0);
                  elapsedRef.current = 0;
                }}
                className="text-slate-400 hover:text-white ml-1 cursor-pointer"
                title="Reset elapsed counter"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Center: Live Audio Spectrum / Waveform Bars */}
        <div className="lg:col-span-5 flex items-center gap-2">
          <div className="flex-1 h-9 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800/90 flex items-end justify-between gap-0.5 overflow-hidden">
            {frequencyBars.map((heightPct, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex-1 rounded-t transition-all duration-75",
                  !isRecording || isPaused
                    ? "bg-indigo-900/50"
                    : heightPct > 80
                    ? "bg-rose-400"
                    : heightPct > 50
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                )}
                style={{
                  height: `${isRecording && !isPaused ? Math.max(12, heightPct) : 14}%`,
                }}
              />
            ))}
          </div>

          <div className="w-20 text-right font-mono tabular-nums shrink-0">
            <div className="text-[10px] text-indigo-300 uppercase">Input Lvl</div>
            <div className="text-xs font-bold text-emerald-300 tabular-nums">
              {isRecording ? `${audioLevel}%` : `Peak ${peakLevel}%`}
            </div>
          </div>
        </div>

        {/* Right: Quick Apply Current Elapsed Time */}
        <div className="lg:col-span-2 flex items-center justify-end">
          <button
            type="button"
            disabled={elapsedSeconds === 0}
            onClick={() => onApplyDuration(formatDurationColon(elapsedSeconds))}
            className="h-9 px-2.5 rounded-lg text-xs font-medium bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-600/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            title="Copy recorded elapsed time to the session Duration field"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Use {formatDurationColon(elapsedSeconds)}</span>
          </button>
        </div>
      </div>

      {/* Microphone Error Banner */}
      {micError && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-600/80 text-rose-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{micError}</span>
          </div>
          <button
            type="button"
            onClick={() => setMicError(null)}
            className="text-rose-300 hover:text-white underline text-[11px] shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Recorded Song Takes List */}
      {takes.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              Recorded Song Takes ({takes.length})
            </span>
            <span className="text-[11px] text-indigo-400">
              Listen back, apply duration to session, or download audio file
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 dialog-scrollbar">
            {takes.map((take) => {
              const isPlaying = playingTakeId === take.id;
              const isApplied = appliedTakeId === take.id;

              return (
                <div
                  key={take.id}
                  className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-lg bg-slate-900/95 border border-indigo-800/70 hover:border-indigo-600/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handlePlayTake(take.id)}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shrink-0",
                        isPlaying
                          ? "bg-amber-500/20 border-amber-400 text-amber-300"
                          : "bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white"
                      )}
                      title={isPlaying ? "Pause playback" : "Play recorded song take"}
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          Take #{take.takeNumber}
                        </span>
                        <span className="text-xs text-cyan-300 font-medium truncate max-w-[180px]">
                          {take.songTitle}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {formatDurationColon(take.durationSeconds)}
                        </span>
                        {take.peakLevel > 0 && (
                          <span className="text-[10px] font-mono tabular-nums text-slate-400">
                            Peak {take.peakLevel}%
                          </span>
                        )}
                      </div>
                    </div>

                    <audio
                      ref={(el) => {
                        audioElementsRef.current[take.id] = el;
                        if (el) {
                          masterAudio.registerMediaElement(el);
                        }
                      }}
                      src={take.url}
                      onEnded={() => {
                        if (playingTakeId === take.id) {
                          setPlayingTakeId(null);
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Take Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleUseTakeDuration(take)}
                      className={cn(
                        "h-8 px-2.5 rounded-md text-[11px] font-medium border transition-colors inline-flex items-center gap-1 cursor-pointer",
                        isApplied
                          ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
                          : "bg-indigo-950/80 hover:bg-indigo-900 border-indigo-700 text-indigo-200"
                      )}
                      title="Set session duration to this take's length"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>
                        {isApplied
                          ? `Applied (${formatDurationColon(take.durationSeconds)})`
                          : `Use Duration (${formatDurationColon(take.durationSeconds)})`}
                      </span>
                    </button>

                    {onAppendNote && (
                      <button
                        type="button"
                        onClick={() => handleLogTakeToNotes(take)}
                        className="h-8 px-2.5 rounded-md text-[11px] font-medium bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Append take details to session notes"
                      >
                        <FileText className="w-3 h-3 text-cyan-400" />
                        <span>Add to Notes</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadTake(take)}
                      className="h-8 px-2.5 rounded-md text-[11px] font-medium bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Download audio recording of this take"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTake(take.id)}
                      className="h-8 px-2 rounded-md text-[11px] bg-rose-950/50 hover:bg-rose-900/70 border border-rose-800/60 text-rose-300 transition-colors inline-flex items-center justify-center cursor-pointer"
                      title="Delete this take"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
