/**
 * Global Master Audio Controller
 * Coordinates application-wide master audio volume output to Windows audio devices
 * for Live Voice Coach, metronome, synthesized chimes, and media elements.
 */

const STORAGE_KEY = "guitar_windows_volume";
const MUTE_STORAGE_KEY = "guitar_windows_volume_muted";
export const MASTER_AUDIO_EVENT = "guitar_windows_volume_change";

interface AudioNodeRegistration {
  ctx: AudioContext;
  gainNode: GainNode;
}

class MasterAudioController {
  private volume: number = 75; // 0 - 100
  private muted: boolean = false;
  private registeredNodes: Set<AudioNodeRegistration> = new Set();
  private registeredMedia: Set<HTMLMediaElement> = new Set();
  private listeners: Set<(state: { volume: number; isMuted: boolean }) => void> = new Set();
  private lastChimeTime: number = 0;

  constructor() {
    this.loadPersistedState();
    this.setupWindowListeners();
    this.setupMediaSession();
  }

  private loadPersistedState() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const savedVol = localStorage.getItem(STORAGE_KEY);
        if (savedVol !== null) {
          const parsed = parseInt(savedVol, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            this.volume = parsed;
          }
        }
        const savedMute = localStorage.getItem(MUTE_STORAGE_KEY);
        if (savedMute !== null) {
          this.muted = savedMute === "true";
        }
      }
    } catch (e) {
      console.warn("Could not load persisted audio state:", e);
    }
  }

  private persistState() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, String(this.volume));
        localStorage.setItem(MUTE_STORAGE_KEY, String(this.muted));
      }
    } catch {}
  }

  private setupWindowListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener(MASTER_AUDIO_EVENT as any, (e: CustomEvent) => {
      if (e.detail && typeof e.detail.volume === "number") {
        this.volume = Math.max(0, Math.min(100, Math.round(e.detail.volume)));
        this.muted = Boolean(e.detail.isMuted);
        this.applyToAllTargets();
        this.notifyListeners();
      }
    });

    // Also sync if another tab changes localStorage
    window.addEventListener("storage", (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === MUTE_STORAGE_KEY) {
        this.loadPersistedState();
        this.applyToAllTargets();
        this.notifyListeners();
      }
    });
  }

  private setupMediaSession() {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        // Provide standard Windows media controls integration
        (navigator as any).mediaSession.playbackState = "none";
      } catch {}
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public getEffectiveVolume(): number {
    if (this.muted) return 0;
    return Math.max(0, Math.min(1, this.volume / 100));
  }

  public setVolume(newVolume: number, triggerFeedback: boolean = false) {
    const clamped = Math.max(0, Math.min(100, Math.round(newVolume)));
    this.volume = clamped;
    if (this.muted && clamped > 0) {
      this.muted = false;
    }
    this.persistState();
    this.applyToAllTargets();
    this.broadcastEvent();
    this.notifyListeners();

    if (triggerFeedback) {
      this.playWindowsFeedbackChime();
    }
  }

  public setMuted(isMuted: boolean) {
    this.muted = isMuted;
    this.persistState();
    this.applyToAllTargets();
    this.broadcastEvent();
    this.notifyListeners();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private broadcastEvent() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(MASTER_AUDIO_EVENT, {
          detail: { volume: this.volume, isMuted: this.muted },
        })
      );
    }
  }

  private notifyListeners() {
    const state = { volume: this.volume, isMuted: this.muted };
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error("MasterAudio listener error:", err);
      }
    });
  }

  public subscribe(callback: (state: { volume: number; isMuted: boolean }) => void): () => void {
    this.listeners.add(callback);
    callback({ volume: this.volume, isMuted: this.muted });
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Creates a GainNode tied to the Master Audio volume for the given AudioContext.
   * As the master slider changes, this gain node will smoothly scale the audio volume.
   */
  public createMasterGain(ctx: AudioContext): GainNode {
    const gainNode = ctx.createGain();
    const effectiveVol = this.getEffectiveVolume();

    try {
      gainNode.gain.setValueAtTime(effectiveVol, ctx.currentTime);
    } catch {
      gainNode.gain.value = effectiveVol;
    }

    const reg: AudioNodeRegistration = { ctx, gainNode };
    this.registeredNodes.add(reg);

    // Clean up if context closes
    const cleanup = () => {
      this.registeredNodes.delete(reg);
    };

    if (ctx.state === "closed") {
      cleanup();
    } else {
      ctx.addEventListener?.("statechange", () => {
        if (ctx.state === "closed") {
          cleanup();
        }
      });
    }

    return gainNode;
  }

  /**
   * Registers an HTML <audio> or <video> element to obey master volume and mute.
   */
  public registerMediaElement(el: HTMLMediaElement): () => void {
    this.registeredMedia.add(el);
    el.volume = this.getEffectiveVolume();
    el.muted = this.muted;

    return () => {
      this.registeredMedia.delete(el);
    };
  }

  private applyToAllTargets() {
    const effectiveVol = this.getEffectiveVolume();

    // 1. Update all registered AudioContext GainNodes
    this.registeredNodes.forEach((reg) => {
      try {
        if (reg.ctx.state !== "closed") {
          reg.gainNode.gain.setValueAtTime(effectiveVol, reg.ctx.currentTime);
        }
      } catch {
        try {
          reg.gainNode.gain.value = effectiveVol;
        } catch {}
      }
    });

    // 2. Update HTMLMediaElements
    this.registeredMedia.forEach((el) => {
      try {
        el.volume = effectiveVol;
        el.muted = this.muted;
      } catch {}
    });
  }

  /**
   * Plays an audible Windows-style confirmation chime scaled precisely by the current master volume.
   * Throttled to avoid buzzing when dragging the slider continuously.
   */
  public playWindowsFeedbackChime(forced = false) {
    if (this.muted || this.volume <= 0) return;

    const now = Date.now();
    if (!forced && now - this.lastChimeTime < 140) {
      return;
    }
    this.lastChimeTime = now;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Windows 11 high harmonic ding / guitar natural harmonic chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const effectiveGain = (this.volume / 100) * 0.18;

      gain.gain.setValueAtTime(effectiveGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Concert A5 note chime
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);

      osc.onended = () => {
        try {
          ctx.close();
        } catch {}
      };
    } catch (err) {
      console.warn("Audio chime failed:", err);
    }
  }
}

export const masterAudio = new MasterAudioController();
