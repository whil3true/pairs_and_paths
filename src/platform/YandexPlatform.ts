import type { PlatformService } from "./PlatformService.js";
import type { YandexSdk, YandexLifecycleEvent } from "./YandexSdkTypes.js";

/** SDK events are registered immediately, before Phaser and audio initialization. */
export class YandexPlatform implements PlatformService {
  readonly id = "yandex" as const;
  readonly displayName = "Yandex Games";
  readonly locale: string;
  private readySent = false;
  private paused = false;
  private readonly pauseListeners = new Set<() => void>();
  private readonly resumeListeners = new Set<() => void>();

  constructor(private readonly sdk: YandexSdk) {
    this.locale = sdk.environment?.i18n?.lang ?? "ru";
    sdk.on("game_api_pause", this.handlePause);
    sdk.on("game_api_resume", this.handleResume);
  }

  get isPaused(): boolean { return this.paused; }

  ready(): void {
    if (this.readySent) return;
    this.readySent = true;
    this.sdk.features?.LoadingAPI?.ready();
  }

  onPause(listener: () => void): () => void {
    this.pauseListeners.add(listener);
    if (this.paused) listener();
    return () => { this.pauseListeners.delete(listener); };
  }

  onResume(listener: () => void): () => void {
    this.resumeListeners.add(listener);
    return () => { this.resumeListeners.delete(listener); };
  }

  destroy(): void {
    this.sdk.off("game_api_pause", this.handlePause);
    this.sdk.off("game_api_resume", this.handleResume);
    this.pauseListeners.clear();
    this.resumeListeners.clear();
  }

  private readonly handlePause = (): void => {
    if (this.paused) return;
    this.paused = true;
    for (const listener of this.pauseListeners) listener();
  };

  private readonly handleResume = (): void => {
    if (!this.paused) return;
    this.paused = false;
    for (const listener of this.resumeListeners) listener();
  };
}
