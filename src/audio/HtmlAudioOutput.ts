import { AUDIO_EFFECTS, AUDIO_MUSIC } from "./AudioAssetManifest.js";
import type { AudioOutput } from "./AudioManager.js";

/**
 * Decoded Web Audio buffers for low-latency SFX, one streaming HTMLAudioElement
 * for music. No effect is queued for late playback after a scene transition.
 */
export class HtmlAudioOutput implements AudioOutput {
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly fallbackPools = new Map<string, HTMLAudioElement[]>();
  private effectsContext: AudioContext | null = null;
  private effectsActive = false;
  private music: HTMLAudioElement | null = null;
  private preparedFirstTrack: HTMLAudioElement | null = null;
  private musicPlayPending = false;
  private musicNeedsRetry = false;
  private musicPlayToken = 0;

  constructor() {
    this.prepareMusic();
    this.prepareEffects();
  }

  /** Warm the first track BEFORE the initial user tap, but never autoplay it. */
  private prepareMusic(): void {
    try {
      const music = new Audio(AUDIO_MUSIC[0]!.path);
      music.preload = "auto";
      music.load();
      this.preparedFirstTrack = music;
    } catch {
      // Unsupported media must not prevent the game from booting.
    }
  }

  /** Fetch/decode each small sound once; never create new media on a normal tap. */
  private prepareEffects(): void {
    try {
      const browser = window as Window & { webkitAudioContext?: typeof AudioContext };
      const Constructor = window.AudioContext ?? browser.webkitAudioContext;
      if (Constructor) this.effectsContext = new Constructor();
    } catch {
      // Rare browsers lacking Web Audio use the small preloaded media fallback.
    }

    for (const path of Object.values(AUDIO_EFFECTS)) {
      const context = this.effectsContext;
      if (context) {
        void fetch(path)
          .then((response) => {
            if (!response.ok) throw new Error(`Cannot load SFX: ${path}`);
            return response.arrayBuffer();
          })
          .then((bytes) => context.decodeAudioData(bytes))
          .then((buffer) => { this.buffers.set(path, buffer); })
          .catch(() => { this.prepareFallback(path); });
      } else {
        this.prepareFallback(path);
      }
    }
  }

  private prepareFallback(path: string): void {
    try {
      const player = new Audio(path);
      player.preload = "auto";
      player.load();
      this.fallbackPools.set(path, [player]);
    } catch {
      // Silent fallback, never a gameplay failure.
    }
  }

  onUserGesture(): void {
    const context = this.effectsContext;
    if (this.effectsActive && context && context.state !== "running") {
      try { void context.resume().catch(() => {}); } catch { /* browser denied resume */ }
    }
  }

  setEffectsActive(active: boolean): void {
    this.effectsActive = active;
    const context = this.effectsContext;
    if (!active) {
      // Stop already-playing SFX, not only future effects.
      for (const pool of this.fallbackPools.values()) for (const player of pool) player.pause();
      if (context && context.state !== "suspended") {
        try { void context.suspend().catch(() => {}); } catch { /* closed context */ }
      }
    }
    // Resume is deliberately handled by a trusted gesture, not by background events.
  }

  playEffect(path: string, volume: number): void {
    if (!this.effectsActive || volume <= 0) return;
    const context = this.effectsContext;
    const buffer = this.buffers.get(path);
    if (context && buffer) {
      try {
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        gain.gain.value = Math.max(0, Math.min(1, volume));
        source.connect(gain);
        gain.connect(context.destination);
        source.start(0);
      } catch {
        // Do not enqueue a sound to fire late after navigation.
      }
      return;
    }
    // While Web Audio is still decoding, skip a first effect instead of playing
    // it noticeably late on the next screen. A fallback is only for decode failures.
    if (this.fallbackPools.has(path)) this.playFallback(path, volume);
  }

  private playFallback(path: string, volume: number): void {
    try {
      const pool = this.fallbackPools.get(path);
      if (!pool) return;
      let player = pool.find((item) => item.paused || item.ended);
      if (!player) {
        if (pool.length >= 3) return;
        player = new Audio(path);
        player.preload = "auto";
        pool.push(player);
      }
      player.volume = Math.max(0, Math.min(1, volume));
      try { player.currentTime = 0; } catch { /* not seekable yet */ }
      try { void player.play().catch(() => {}); } catch { /* denied */ }
    } catch { /* silence on unsupported browsers */ }
  }

  startMusic(path: string, volume: number, onEnded: () => void): void {
    this.stopMusic();
    try {
      const prepared = this.preparedFirstTrack;
      const player = prepared && path === AUDIO_MUSIC[0]!.path ? prepared : new Audio(path);
      this.preparedFirstTrack = null;
      player.preload = "auto";
      player.loop = false;
      player.volume = Math.max(0, Math.min(1, volume));
      player.addEventListener("ended", () => {
        if (this.music === player) onEnded();
      });
      this.music = player;
      this.tryPlayMusic(player);
    } catch {
      // Playback may be blocked by browser, codec or network.
    }
  }

  setMusicVolume(volume: number): void {
    if (this.music) this.music.volume = Math.max(0, Math.min(1, volume));
  }

  pauseMusic(): void {
    ++this.musicPlayToken;
    this.musicPlayPending = false;
    this.musicNeedsRetry = false;
    this.music?.pause();
  }

  resumeMusic(): void {
    if (!this.music) return;
    // A pending play() does NOT mean audio is actually playing. On Android it
    // can still be waiting for media data or user activation. A second play()
    // on pointerup of the SAME tap is allowed while the element stays paused.
    if (!this.music.paused && !this.musicNeedsRetry) return;
    this.tryPlayMusic(this.music);
  }

  stopMusic(): void {
    ++this.musicPlayToken;
    this.musicPlayPending = false;
    this.musicNeedsRetry = false;
    if (this.music) {
      this.music.pause();
      this.music.removeAttribute("src");
      this.music.load();
    }
    this.music = null;
  }

  private tryPlayMusic(player: HTMLAudioElement): void {
    if (this.music !== player) return;
    const token = ++this.musicPlayToken;
    this.musicNeedsRetry = false;
    this.musicPlayPending = true;
    try {
      const promise = player.play();
      void promise.then(() => {
        if (this.music === player && this.musicPlayToken === token) {
          this.musicPlayPending = false;
        }
      }).catch(() => {
        if (this.music === player && this.musicPlayToken === token) {
          this.musicPlayPending = false;
          this.musicNeedsRetry = true;
        }
      });
    } catch {
      if (this.music === player && this.musicPlayToken === token) {
        this.musicPlayPending = false;
        this.musicNeedsRetry = true;
      }
    }
  }
}
