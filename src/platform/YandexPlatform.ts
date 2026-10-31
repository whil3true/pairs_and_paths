import type { PlatformService } from "./PlatformService.js";
import type { YandexSdk } from "./YandexSdkTypes.js";

/** SDK lifecycle listeners are attached before Phaser and audio are constructed. */
export class YandexPlatform implements PlatformService {
  readonly id = "yandex" as const;
  readonly displayName = "Yandex Games";
  readonly locale: string;
  private readySent = false;
  private gameplayActive = false;
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

  setGameplayActive(active: boolean): void {
    if (this.gameplayActive === active) return;
    this.gameplayActive = active;
    if (active) this.sdk.features?.GameplayAPI?.start();
    else this.sdk.features?.GameplayAPI?.stop();
  }

  showInterstitial(): Promise<boolean> {
    if (!this.sdk.adv?.showFullscreenAdv) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const complete = (shown: boolean): void => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        resolve(shown);
      };
      // Fail open if the SDK never opens an ad or calls back. A real opened
      // advert receives a longer timeout; SDK pause remains authoritative.
      let watchdog = setTimeout(() => {
        console.warn("[Cozy SDK] interstitial_no_callback");
        complete(false);
      }, 15000);
      try {
        // Official Yandex signature takes callbacks DIRECTLY, not { callbacks }.
        this.sdk.adv!.showFullscreenAdv({
          onOpen: () => {
            console.info("[Cozy SDK] interstitial_open");
            clearTimeout(watchdog);
            watchdog = setTimeout(() => {
              console.warn("[Cozy SDK] interstitial_close_timeout");
              complete(false);
            }, 120000);
          },
          onClose: (shown) => {
            console.info("[Cozy SDK] interstitial_close", shown);
            complete(shown === true);
          },
          onError: (error) => {
            console.warn("[Cozy SDK] interstitial_error", error);
            complete(false);
          },
        });
      } catch (error) {
        console.warn("[Cozy SDK] interstitial_throw", error);
        complete(false);
      }
    });
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
    this.setGameplayActive(false);
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
