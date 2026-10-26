/**
 * Master Audio Controller (Windows-style Volume & Mute Manager)
 * Centralizes volume (0..100) and mute state across all Web Audio API contexts,
 * HTML5 <audio>/<video> elements, Live Voice Coach streams, On-Demand Song Recorder
 * playback, and UI sound feedback throughout the Guitar Practice Tracker application.
 */

export interface MasterAudioState {
  volume: number; // 0 to 100
  isMuted: boolean;
  effectiveVolume: number; // 0.0 to 1.0 (0 if muted)
}

type MasterAudioListener = (state: MasterAudioState) => void;

const STORAGE_VOLUME_KEY = "guitar_tracker_master_volume";
const STORAGE_MUTED_KEY = "guitar_tracker_master_muted";
export const MASTER_AUDIO_EVENT = "guitar-tracker-master-audio-change";

class MasterAudioController {
  private volume: number = 80;
  private isMuted: boolean = false;
  private listeners: Set<MasterAudioListener> = new Set();
  private registeredGains: Set<{ ctx: BaseAudioContext; gainNode: GainNode }> = new Set();
  private registeredMedia: Set<HTMLMediaElement> = new Set();
  private lastFeedbackTime: number = 0;
  private feedbackCtx: AudioContext | null = null;
  private isBroadcasting: boolean = false;

  constructor() {
    this.loadFromStorage();
    this.setupWindowListeners();
    this.setupGlobalMediaInterceptors();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const savedVol = localStorage.getItem(STORAGE_VOLUME_KEY);
      if (savedVol !== null) {
        const parsed = Number(savedVol);
        if (!Number.isNaN(parsed)) {
          this.volume = Math.max(0, Math.min(100, Math.round(parsed)));
        }
      }
      const savedMuted = localStorage.getItem(STORAGE_MUTED_KEY);
      if (savedMuted !== null) {
        this.isMuted = savedMuted === "true";
      }
    } catch {
      // Ignore storage access errors
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_VOLUME_KEY, String(this.volume));
      localStorage.setItem(STORAGE_MUTED_KEY, String(this.isMuted));
    } catch {
      // Ignore storage errors
    }
  }

  private setupWindowListeners() {
    if (typeof window === "undefined") return;

    // Sync across tabs if changed in another tab
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_VOLUME_KEY || e.key === STORAGE_MUTED_KEY) {
        this.loadFromStorage();
        this.applyToAllTargets();
        this.notifyListeners();
      }
    });

    // Listen for custom global audio events from external dispatches (avoid self-reentrant loop)
    window.addEventListener(MASTER_AUDIO_EVENT, (e: Event) => {
      if (this.isBroadcasting) return;
      const customEvent = e as CustomEvent<Partial<MasterAudioState>>;
      if (customEvent.detail) {
        let changed = false;
        if (
          typeof customEvent.detail.volume === "number" &&
          customEvent.detail.volume !== this.volume
        ) {
          this.volume = Math.max(0, Math.min(100, Math.round(customEvent.detail.volume)));
          changed = true;
        }
        if (
          typeof customEvent.detail.isMuted === "boolean" &&
          customEvent.detail.isMuted !== this.isMuted
        ) {
          this.isMuted = customEvent.detail.isMuted;
          changed = true;
        }
        if (changed) {
          this.saveToStorage();
          this.applyToAllTargets();
          this.notifyListeners();
        }
      }
    });
  }

  /**
   * Automatically intercepts any <audio> or <video> element in the document
   * so all media playback respects the master volume slider even if not manually registered.
   */
  private setupGlobalMediaInterceptors() {
    if (typeof document === "undefined") return;

    const syncMediaTarget = (e: Event) => {
      const target = e.target;
      if (target instanceof HTMLMediaElement) {
        this.registeredMedia.add(target);
        this.applyToMediaElement(target);
      }
    };

    document.addEventListener("play", syncMediaTarget, true);
    document.addEventListener("playing", syncMediaTarget, true);
    document.addEventListener("loadedmetadata", syncMediaTarget, true);
  }

  private applyToMediaElement(media: HTMLMediaElement) {
    const effective = this.getEffectiveVolume();
    try {
      if (Math.abs(media.volume - effective) > 0.001) {
        media.volume = effective;
      }
      if (media.muted !== this.isMuted) {
        media.muted = this.isMuted;
      }
    } catch {
      // Ignore read-only media errors
    }
  }

  public getState(): MasterAudioState {
    return {
      volume: this.volume,
      isMuted: this.isMuted,
      effectiveVolume: this.getEffectiveVolume(),
    };
  }

  public getEffectiveVolume(): number {
    if (this.isMuted || this.volume <= 0) return 0;
    return Math.max(0, Math.min(1, this.volume / 100));
  }

  public setVolume(newVolume: number, playFeedback: boolean = false) {
    const clamped = Math.max(0, Math.min(100, Math.round(newVolume)));
    const wasMuted = this.isMuted;

    // Unmute automatically if user actively raises volume above 0 while muted
    if (clamped > 0 && this.isMuted) {
      this.isMuted = false;
    }

    const changed = clamped !== this.volume || wasMuted !== this.isMuted;
    this.volume = clamped;

    if (changed) {
      this.saveToStorage();
      this.applyToAllTargets();
      this.notifyListeners();
      this.broadcastEvent();
    }

    if (playFeedback && !this.isMuted && this.volume > 0) {
      this.playWindowsFeedbackChime();
    }
  }

  public setMuted(muted: boolean, playFeedback: boolean = false) {
    if (this.isMuted === muted) return;
    this.isMuted = muted;
    this.saveToStorage();
    this.applyToAllTargets();
    this.notifyListeners();
    this.broadcastEvent();

    if (playFeedback && !this.isMuted && this.volume > 0) {
      this.playWindowsFeedbackChime(true);
    }
  }

  public toggleMute(playFeedback: boolean = true): boolean {
    const nextMuted = !this.isMuted;
    // If unmuting when volume was 0, restore volume to a sensible audible level (50%)
    if (!nextMuted && this.volume === 0) {
      this.volume = 50;
    }
    this.setMuted(nextMuted, playFeedback);
    return this.isMuted;
  }

  public subscribe(listener: MasterAudioListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Creates and registers a master GainNode for a given Web Audio API AudioContext.
   * Automatically updates its gain whenever the Windows volume slider changes.
   */
  public createMasterGain(ctx: BaseAudioContext): GainNode {
    const gainNode = ctx.createGain();
    const effective = this.getEffectiveVolume();
    gainNode.gain.value = effective;
    try {
      gainNode.gain.setValueAtTime(effective, ctx.currentTime);
    } catch {
      // Ignore if context is not ready
    }

    const entry = { ctx, gainNode };
    this.registeredGains.add(entry);

    return gainNode;
  }

  /**
   * Registers an HTMLAudioElement or HTMLVideoElement so its volume & muted properties
   * stay synchronized with the Windows Volume Slider.
   */
  public registerMediaElement(media: HTMLMediaElement | null): () => void {
    if (!media) return () => {};
    this.registeredMedia.add(media);
    this.applyToMediaElement(media);
    return () => {
      this.registeredMedia.delete(media);
    };
  }

  private applyToAllTargets() {
    const effective = this.getEffectiveVolume();

    // Update all active Web Audio GainNodes
    const staleGains: { ctx: BaseAudioContext; gainNode: GainNode }[] = [];
    this.registeredGains.forEach((entry) => {
      try {
        if (entry.ctx.state === "closed") {
          staleGains.push(entry);
          return;
        }
        const now = entry.ctx.currentTime || 0;
        entry.gainNode.gain.cancelScheduledValues(now);
        entry.gainNode.gain.value = effective;
        entry.gainNode.gain.setValueAtTime(effective, now);
      } catch {
        staleGains.push(entry);
      }
    });
    staleGains.forEach((s) => this.registeredGains.delete(s));

    // Also scan the DOM for any <audio> or <video> elements not yet in registeredMedia
    if (typeof document !== "undefined") {
      try {
        const domMedia = document.querySelectorAll("audio, video");
        domMedia.forEach((el) => {
          if (el instanceof HTMLMediaElement) {
            this.registeredMedia.add(el);
          }
        });
      } catch {
        // Ignore DOM query issues
      }
    }

    // Update all registered HTMLMediaElements
    this.registeredMedia.forEach((media) => {
      this.applyToMediaElement(media);
    });
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error("MasterAudioListener error:", err);
      }
    });
  }

  private broadcastEvent() {
    if (typeof window === "undefined") return;
    this.isBroadcasting = true;
    try {
      window.dispatchEvent(
        new CustomEvent(MASTER_AUDIO_EVENT, {
          detail: this.getState(),
        })
      );
    } finally {
      this.isBroadcasting = false;
    }
  }

  private getOrCreateFeedbackContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (this.feedbackCtx && this.feedbackCtx.state !== "closed") {
        if (this.feedbackCtx.state === "suspended") {
          this.feedbackCtx.resume().catch(() => {});
        }
        return this.feedbackCtx;
      }
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.feedbackCtx = new AudioCtx();
      if (this.feedbackCtx.state === "suspended") {
        this.feedbackCtx.resume().catch(() => {});
      }
      return this.feedbackCtx;
    } catch {
      return null;
    }
  }

  /**
   * Plays a crisp harmonic Windows volume feedback chime scaled to the current volume.
   * Uses a single shared AudioContext to prevent browser AudioContext exhaustion.
   */
  public playWindowsFeedbackChime(forceImmediate: boolean = false) {
    const nowMs = Date.now();
    if (!forceImmediate && nowMs - this.lastFeedbackTime < 90) return;
    this.lastFeedbackTime = nowMs;

    const effective = this.getEffectiveVolume();
    if (effective <= 0) return;

    try {
      const ctx = this.getOrCreateFeedbackContext();
      if (!ctx) return;

      const start = ctx.currentTime;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pleasant two-note harmonic bell chime (pitch scales gently with volume 0..100)
      const baseFreq = 440 + (this.volume / 100) * 320;
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, start);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, start + 0.09);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(baseFreq * 1.5, start);

      const peakGain = Math.max(0.015, effective * 0.25);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc2.start(start);
      osc.stop(start + 0.15);
      osc2.stop(start + 0.15);

      osc.onended = () => {
        try {
          osc.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      };
    } catch {
      // Ignore if autoplay policy blocks audio before user gesture
    }
  }

  /**
   * Plays a short metronome/count-in click scaled by the master volume slider.
   */
  public playCountInClick(isDownbeat: boolean = false) {
    const effective = this.getEffectiveVolume();
    if (effective <= 0) return;

    try {
      const ctx = this.getOrCreateFeedbackContext();
      if (!ctx) return;

      const start = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(isDownbeat ? 1046.5 : 783.99, start);

      const peakGain = Math.max(0.02, effective * 0.3);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.09);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch {
      // Ignore audio errors
    }
  }
}

export const masterAudio = new MasterAudioController();
