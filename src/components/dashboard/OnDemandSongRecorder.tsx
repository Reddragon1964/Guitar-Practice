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
  RefreshCw,
  Sliders,
  Headphones,
  Guitar,
} from "lucide-react";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { WindowsVolumeSlider } from "../ui/WindowsVolumeSlider";
import { cn } from "../../lib/utils";
import { formatDurationColon } from "../../utils/durationFormat";
import { masterAudio } from "../../utils/masterAudioController";

export type RecordingSoundSourceMode =
  | "guitar-interface"
  | "microphone-acoustic"
  | "system-audio"
  | "mixed-input";

export interface AudioInputDeviceOption {
  deviceId: string;
  label: string;
  groupId?: string;
}

export const SOUND_SOURCE_MODE_OPTIONS: {
  id: RecordingSoundSourceMode;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "guitar-interface",
    label: "Guitar Interface / Line-In (Raw Studio Audio)",
    shortLabel: "Guitar / Line-In (Raw)",
    description:
      "Unprocessed high-dynamic audio (echo cancellation & noise gate OFF) ideal for USB guitar interfaces, pedals, and direct amps.",
  },
  {
    id: "microphone-acoustic",
    label: "Microphone / Acoustic & Amp Mic (Filtered)",
    shortLabel: "Microphone (Filtered)",
    description:
      "Standard microphone input with room noise suppression and automatic gain control enabled.",
  },
  {
    id: "system-audio",
    label: "System / Browser Tab Audio (Backing Track / Amp Sim)",
    shortLabel: "System / Tab Audio",
    description:
      "Captures audio playing from a browser tab or desktop application (requires selecting 'Share Audio' in browser prompt).",
  },
  {
    id: "mixed-input",
    label: "Guitar Input + System Backing Track (Mixed)",
    shortLabel: "Mic/Guitar + System Mix",
    description:
      "Blends your selected microphone/guitar input with system/tab backing track audio into a single recorded take.",
  },
];

const SOUND_SOURCE_STORAGE_KEY = "guitar_recorder_sound_source_v1";

export interface RecordedSongTake {
  id: string;
  takeNumber: number;
  songTitle: string;
  durationSeconds: number;
  createdAt: number;
  url: string;
  mimeType: string;
  peakLevel: number;
  soundSourceLabel?: string;
}

interface OnDemandSongRecorderProps {
  songTitle: string;
  speed?: string;
  difficulty?: number;
  onApplyDuration: (formattedColonDuration: string) => void;
  onAppendNote?: (noteSnippet: string) => void;
  compact?: boolean;
  selectedDeviceId?: string;
  onSelectedDeviceIdChange?: (deviceId: string) => void;
  soundSourceMode?: RecordingSoundSourceMode;
  onSoundSourceModeChange?: (mode: RecordingSoundSourceMode) => void;
}

export const OnDemandSongRecorder: React.FC<OnDemandSongRecorderProps> = ({
  songTitle,
  speed = "100",
  difficulty = 1,
  onApplyDuration,
  onAppendNote,
  compact = false,
  selectedDeviceId: externalDeviceId,
  onSelectedDeviceIdChange,
  soundSourceMode: externalSourceMode,
  onSoundSourceModeChange,
}) => {
  // Persisted or controlled Sound Source settings
  const [internalDeviceId, setInternalDeviceId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(SOUND_SOURCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.deviceId === "string") return parsed.deviceId;
      }
    } catch {}
    return "default";
  });

  const [internalSourceMode, setInternalSourceMode] = useState<RecordingSoundSourceMode>(() => {
    try {
      const saved = localStorage.getItem(SOUND_SOURCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.mode === "guitar-interface" ||
          parsed.mode === "microphone-acoustic" ||
          parsed.mode === "system-audio" ||
          parsed.mode === "mixed-input"
        ) {
          return parsed.mode;
        }
      }
    } catch {}
    return "guitar-interface";
  });

  const [inputGainPct, setInputGainPct] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SOUND_SOURCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.inputGainPct === "number") return parsed.inputGainPct;
      }
    } catch {}
    return 100;
  });

  const selectedDeviceId = externalDeviceId !== undefined ? externalDeviceId : internalDeviceId;
  const soundSourceMode = externalSourceMode !== undefined ? externalSourceMode : internalSourceMode;

  const handleDeviceChange = useCallback(
    (newDeviceId: string) => {
      setInternalDeviceId(newDeviceId);
      onSelectedDeviceIdChange?.(newDeviceId);
      try {
        const prev = JSON.parse(localStorage.getItem(SOUND_SOURCE_STORAGE_KEY) || "{}");
        localStorage.setItem(
          SOUND_SOURCE_STORAGE_KEY,
          JSON.stringify({ ...prev, deviceId: newDeviceId })
        );
      } catch {}
    },
    [onSelectedDeviceIdChange]
  );

  const handleSourceModeChange = useCallback(
    (newMode: RecordingSoundSourceMode) => {
      setInternalSourceMode(newMode);
      onSoundSourceModeChange?.(newMode);
      try {
        const prev = JSON.parse(localStorage.getItem(SOUND_SOURCE_STORAGE_KEY) || "{}");
        localStorage.setItem(
          SOUND_SOURCE_STORAGE_KEY,
          JSON.stringify({ ...prev, mode: newMode })
        );
      } catch {}
    },
    [onSoundSourceModeChange]
  );

  const handleGainChange = useCallback((newGain: number) => {
    setInputGainPct(newGain);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newGain / 100;
    }
    try {
      const prev = JSON.parse(localStorage.getItem(SOUND_SOURCE_STORAGE_KEY) || "{}");
      localStorage.setItem(
        SOUND_SOURCE_STORAGE_KEY,
        JSON.stringify({ ...prev, inputGainPct: newGain })
      );
    } catch {}
  }, []);

  const [audioInputDevices, setAudioInputDevices] = useState<AudioInputDeviceOption[]>([
    { deviceId: "default", label: "System Default Microphone / Guitar Input" },
  ]);
  const [isScanningDevices, setIsScanningDevices] = useState(false);
  const [isTestingSource, setIsTestingSource] = useState(false);

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
  const auxStreamsRef = useRef<MediaStream[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countInTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef<number>(0);
  const peakRef = useRef<number>(0);
  const takeCounterRef = useRef<number>(0);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement | null>>({});

  // Enumerate connected audio input devices
  const refreshAudioInputDevices = useCallback(
    async (requestPermissionPrompt = false) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
        return;
      }
      setIsScanningDevices(true);
      try {
        if (requestPermissionPrompt && navigator.mediaDevices.getUserMedia) {
          try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            tempStream.getTracks().forEach((t) => t.stop());
            setMicError(null);
          } catch (permErr) {
            const msg =
              permErr instanceof Error ? permErr.message : "Microphone permission denied.";
            setMicError(`Could not unlock audio device names (${msg}).`);
          }
        }

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter((d) => d.kind === "audioinput");

        const options: AudioInputDeviceOption[] = [];
        const seenIds = new Set<string>();

        audioInputs.forEach((dev, idx) => {
          const id = dev.deviceId || `input-${idx}`;
          if (seenIds.has(id)) return;
          seenIds.add(id);
          const cleanLabel =
            dev.label && dev.label.trim().length > 0
              ? dev.label.trim()
              : id === "default"
              ? "System Default Microphone / Guitar Input"
              : `Audio Input Device #${idx + 1} (Click 'Detect Inputs' to show hardware name)`;
          options.push({
            deviceId: id,
            label: cleanLabel,
            groupId: dev.groupId,
          });
        });

        if (options.length === 0) {
          options.push({
            deviceId: "default",
            label: "System Default Microphone / Guitar Input",
          });
        } else if (!options.some((o) => o.deviceId === "default")) {
          options.unshift({
            deviceId: "default",
            label: "System Default Audio Input",
          });
        }

        setAudioInputDevices(options);
      } catch {
        // ignore enumeration errors
      } finally {
        setIsScanningDevices(false);
      }
    },
    []
  );

  useEffect(() => {
    refreshAudioInputDevices(false);
    const mediaDevices = navigator?.mediaDevices;
    if (mediaDevices && typeof mediaDevices.addEventListener === "function") {
      const handleDeviceChange = () => refreshAudioInputDevices(false);
      mediaDevices.addEventListener("devicechange", handleDeviceChange);
      return () => {
        mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      };
    }
  }, [refreshAudioInputDevices]);

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
    gainNodeRef.current = null;
    setAudioLevel(0);
    setFrequencyBars(new Array(24).fill(4));
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (auxStreamsRef.current.length > 0) {
      auxStreamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
      auxStreamsRef.current = [];
    }
    setIsTestingSource(false);
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

  /**
   * Acquires and routes the audio stream based on the chosen soundSourceMode and selectedDeviceId.
   */
  const acquireConfiguredAudioStream = useCallback(async (): Promise<{
    recordingStream: MediaStream;
    sourceLabel: string;
  }> => {
    const isRawGuitar = soundSourceMode === "guitar-interface";
    const deviceConstraint =
      selectedDeviceId && selectedDeviceId !== "default"
        ? { exact: selectedDeviceId }
        : undefined;

    const micAudioConstraints: MediaTrackConstraints = {
      ...(deviceConstraint ? { deviceId: deviceConstraint } : {}),
      echoCancellation: !isRawGuitar,
      noiseSuppression: !isRawGuitar,
      autoGainControl: !isRawGuitar,
    };

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioCtx();
    audioContextRef.current = audioCtx;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    analyserRef.current = analyser;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = inputGainPct / 100;
    gainNodeRef.current = gainNode;

    const destination = audioCtx.createMediaStreamDestination();
    auxStreamsRef.current = [];

    const selectedDeviceObj = audioInputDevices.find((d) => d.deviceId === selectedDeviceId);
    const hwLabel = selectedDeviceObj
      ? selectedDeviceObj.label.replace(/\s*\(Click 'Detect Inputs'.*\)$/i, "")
      : "Default Audio Input";

    if (soundSourceMode === "system-audio") {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("System/Tab audio capture is not supported in this browser.");
      }
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      auxStreamsRef.current.push(displayStream);

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        displayStream.getTracks().forEach((t) => t.stop());
        throw new Error(
          "No system audio track was shared. Please check 'Share tab/system audio' in the prompt, or switch Sound Source to Guitar Interface / Microphone."
        );
      }
      // Stop video tracks immediately since we only need audio
      displayStream.getVideoTracks().forEach((vt) => vt.stop());

      const audioOnlyStream = new MediaStream(audioTracks);
      const sysSource = audioCtx.createMediaStreamSource(audioOnlyStream);
      sysSource.connect(gainNode);
      gainNode.connect(analyser);
      gainNode.connect(destination);

      return {
        recordingStream: destination.stream,
        sourceLabel: "System / Tab Audio",
      };
    }

    if (soundSourceMode === "mixed-input") {
      let micStream: MediaStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: micAudioConstraints,
        });
      } catch {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      auxStreamsRef.current.push(micStream);
      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(gainNode);

      let hasSystem = false;
      if (navigator.mediaDevices?.getDisplayMedia) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          auxStreamsRef.current.push(displayStream);
          displayStream.getVideoTracks().forEach((vt) => vt.stop());
          if (displayStream.getAudioTracks().length > 0) {
            const sysSource = audioCtx.createMediaStreamSource(
              new MediaStream(displayStream.getAudioTracks())
            );
            sysSource.connect(gainNode);
            hasSystem = true;
          }
        } catch {
          // User skipped system audio share; continue with mic/guitar input
        }
      }

      gainNode.connect(analyser);
      gainNode.connect(destination);

      await refreshAudioInputDevices(false);
      return {
        recordingStream: destination.stream,
        sourceLabel: hasSystem ? `${hwLabel} + System Audio Mix` : `${hwLabel} (Raw/Mic)`,
      };
    }

    // Standard hardware input ("guitar-interface" or "microphone-acoustic")
    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: micAudioConstraints,
      });
    } catch {
      // Fallback if exact deviceId was disconnected
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: !isRawGuitar,
          noiseSuppression: !isRawGuitar,
          autoGainControl: !isRawGuitar,
        },
      });
    }
    auxStreamsRef.current.push(micStream);

    const source = audioCtx.createMediaStreamSource(micStream);
    source.connect(gainNode);
    gainNode.connect(analyser);
    gainNode.connect(destination);

    // Refresh device labels now that permission is granted
    await refreshAudioInputDevices(false);

    const modeBadge = isRawGuitar ? "Guitar/Line-In Raw" : "Mic Filtered";
    return {
      recordingStream: destination.stream,
      sourceLabel: `${hwLabel} (${modeBadge})`,
    };
  }, [
    audioInputDevices,
    inputGainPct,
    refreshAudioInputDevices,
    selectedDeviceId,
    soundSourceMode,
  ]);

  const handleToggleTestSoundSource = async () => {
    if (isRecording) return;
    if (isTestingSource) {
      stopAudioAnalysis();
      stopStream();
      return;
    }
    setMicError(null);
    try {
      peakRef.current = 0;
      setPeakLevel(0);
      const { recordingStream } = await acquireConfiguredAudioStream();
      streamRef.current = recordingStream;
      setIsTestingSource(true);
      rafRef.current = requestAnimationFrame(updateVisualizer);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to access the selected sound source.";
      setMicError(message);
      stopAudioAnalysis();
      stopStream();
    }
  };

  const beginMediaRecording = useCallback(async () => {
    setMicError(null);
    if (isTestingSource) {
      stopAudioAnalysis();
      stopStream();
    }
    try {
      const { recordingStream, sourceLabel } = await acquireConfiguredAudioStream();
      streamRef.current = recordingStream;

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
        ? new MediaRecorder(recordingStream, { mimeType: selectedMimeType })
        : new MediaRecorder(recordingStream);

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
          soundSourceLabel: sourceLabel,
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
        `Unable to access selected sound source (${message}). Check browser audio permissions or choose another input device.`
      );
      setIsRecording(false);
      setCountdown(null);
      stopAudioAnalysis();
      stopStream();
    }
  }, [
    acquireConfiguredAudioStream,
    autoSyncDuration,
    isTestingSource,
    onApplyDuration,
    songTitle,
    stopAudioAnalysis,
    stopStream,
    updateVisualizer,
  ]);

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
    const sourceInfo = take.soundSourceLabel ? ` [${take.soundSourceLabel}]` : "";
    const snippet = `[Recorded Take #${take.takeNumber} (${timeStr}): "${take.songTitle}" — Duration ${formatDurationColon(
      take.durationSeconds
    )} @ ${speed || "100"}% speed, Diff ${difficulty}${sourceInfo}]`;
    onAppendNote(snippet);
  };

  const activeModeMeta =
    SOUND_SOURCE_MODE_OPTIONS.find((m) => m.id === soundSourceMode) ||
    SOUND_SOURCE_MODE_OPTIONS[0];

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
            <Radio
              className={cn("w-4 h-4", isRecording && !isPaused && "animate-pulse text-rose-400")}
            />
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
                Choose your recording sound source (guitar interface, microphone, or system audio), record takes, and sync duration
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

      {/* Sound Source Selection Panel */}
      <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/80 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
              Recording Sound Source & Input Device
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isRecording || isScanningDevices}
              onClick={() => refreshAudioInputDevices(true)}
              className="h-7 px-2.5 text-[11px] border-indigo-700 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 gap-1 cursor-pointer"
              title="Scan connected microphones, USB guitar interfaces, and audio inputs"
            >
              <RefreshCw className={cn("w-3 h-3 text-cyan-400", isScanningDevices && "animate-spin")} />
              <span>{isScanningDevices ? "Scanning..." : "Detect Audio Inputs"}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isRecording || countdown !== null}
              onClick={handleToggleTestSoundSource}
              className={cn(
                "h-7 px-2.5 text-[11px] gap-1 cursor-pointer",
                isTestingSource
                  ? "border-emerald-400 bg-emerald-950/90 text-emerald-200"
                  : "border-indigo-700 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200"
              )}
              title="Test the selected sound source and monitor input levels before recording"
            >
              <Headphones className="w-3 h-3 text-emerald-400" />
              <span>{isTestingSource ? "Stop Input Test" : "Test Sound Source"}</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* 1. Sound Source Mode Selector */}
          <div className="md:col-span-5 flex flex-col justify-end space-y-1">
            <div className="min-h-[20px] flex items-center">
              <label className="text-[11px] font-semibold text-indigo-200 flex items-center gap-1 truncate">
                <Guitar className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Sound Source Type:</span>
              </label>
            </div>
            <Select
              value={soundSourceMode}
              disabled={isRecording || countdown !== null}
              onChange={(e) => handleSourceModeChange(e.target.value as RecordingSoundSourceMode)}
              className="w-full h-9 text-xs font-medium"
            >
              {SOUND_SOURCE_MODE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Hardware Audio Input Device Selector */}
          <div className="md:col-span-5 flex flex-col justify-end space-y-1">
            <div className="min-h-[20px] flex items-center">
              <label className="text-[11px] font-semibold text-indigo-200 flex items-center gap-1 truncate">
                <Mic className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">Audio Input Device (Mic / USB Interface):</span>
              </label>
            </div>
            <Select
              value={selectedDeviceId}
              disabled={
                isRecording ||
                countdown !== null ||
                soundSourceMode === "system-audio"
              }
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full h-9 text-xs font-medium"
            >
              {audioInputDevices.map((dev) => (
                <option key={dev.deviceId} value={dev.deviceId}>
                  {dev.label}
                </option>
              ))}
            </Select>
          </div>

          {/* 3. Input Gain / Boost Selector */}
          <div className="md:col-span-2 flex flex-col justify-end space-y-1">
            <div className="min-h-[20px] flex items-center justify-between gap-1">
              <label className="text-[11px] font-semibold text-indigo-200 truncate">
                Input Gain:
              </label>
              <span className="text-[11px] font-mono text-cyan-300 tabular-nums shrink-0">
                {inputGainPct}%
              </span>
            </div>
            <Select
              value={String(inputGainPct)}
              onChange={(e) => handleGainChange(Number(e.target.value) || 100)}
              className="w-full h-9 text-xs font-mono font-bold"
            >
              <option value="75">75% (-Pad)</option>
              <option value="100">100% (Unity)</option>
              <option value="125">125% (+Boost)</option>
              <option value="150">150% (+High)</option>
              <option value="200">200% (+Max)</option>
            </Select>
          </div>
        </div>

        <div className="text-[11px] text-indigo-300/85 flex items-center justify-between flex-wrap gap-2 pt-0.5">
          <span>{activeModeMeta.description}</span>
          {isTestingSource && (
            <span className="text-emerald-300 font-mono font-semibold animate-pulse">
              ● Live Sound Source Monitor Active — Play a chord to check input level
            </span>
          )}
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
                  (!isRecording || isPaused) && !isTestingSource
                    ? "bg-indigo-900/50"
                    : heightPct > 80
                    ? "bg-rose-400"
                    : heightPct > 50
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                )}
                style={{
                  height: `${
                    (isRecording && !isPaused) || isTestingSource ? Math.max(12, heightPct) : 14
                  }%`,
                }}
              />
            ))}
          </div>

          <div className="w-20 text-right font-mono tabular-nums shrink-0">
            <div className="text-[10px] text-indigo-300 uppercase">Input Lvl</div>
            <div className="text-xs font-bold text-emerald-300 tabular-nums">
              {isRecording || isTestingSource ? `${audioLevel}%` : `Peak ${peakLevel}%`}
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
                        {take.soundSourceLabel && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 truncate max-w-[190px]">
                            {take.soundSourceLabel}
                          </span>
                        )}
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

