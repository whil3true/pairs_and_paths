import type { AudioOutput } from "./AudioManager.js";

/**
 * Browser implementation of the small audio output seam.
 * Each SFX has a capped pool of players for non-cutoff rapid touches.
 * Music creates only one audio element at a time, loading the next track on demand.
 */
export class HtmlAudioOutput implements AudioOutput {
  private music: HTMLAudioElement | null = null;
  private readonly effectPools = new Map<string, HTMLAudioElement[]>();

  playEffect(path: string, volume: number): void {
    try {
      let pool = this.effectPools.get(path);
      if (pool === undefined) {
        pool = [];
        this.effectPools.set(path, pool);
      }
      let player = pool.find((item) => item.paused || item.ended);
      if (player === undefined) {
        if (pool.length >= 3) return;
        player = new Audio(path);
        player.preload = "auto";
        pool.push(player);
      }
      player.volume = Math.max(0, Math.min(1, volume));
      player.currentTime = 0;
      this.playSafely(player);
    } catch {
      // Missing or unsupported sound must never break a puzzle interaction.
    }
  }

  startMusic(path: string, volume: number, onEnded: () => void): void {
    this.stopMusic();
    try {
      const player = new Audio(path);
      player.preload = "auto";
      player.loop = false;
      player.volume = Math.max(0, Math.min(1, volume));
      player.addEventListener("ended", () => {
        if (this.music === player) onEnded();
      });
      this.music = player;
      this.playSafely(player);
    } catch {
      // Browser audio may be blocked by permissions or codecs.
    }
  }

  setMusicVolume(volume: number): void {
    if (this.music) this.music.volume = Math.max(0, Math.min(1, volume));
  }

  pauseMusic(): void { this.music?.pause(); }
  resumeMusic(): void { if (this.music) this.playSafely(this.music); }

  stopMusic(): void {
    this.music?.pause();
    if (this.music) this.music.removeAttribute("src");
    this.music = null;
  }

  private playSafely(player: HTMLAudioElement): void {
    try {
      void player.play().catch(() => { /* gesture, codec, or network failure */ });
    } catch {
      // play() may throw synchronously in restricted web views.
    }
  }
}
