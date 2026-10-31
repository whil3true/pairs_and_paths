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
      let callbacksDone = false;
      let wasShown = false;
      let watchdog: ReturnType<typeof setTimeout> | null = null;
      let waitWarning: ReturnType<typeof setTimeout> | null = null;
      let unsubscribeResume: (() => void) | null = null;

      const clearWatchdog = (): void => {
        if (watchdog !== null) clearTimeout(watchdog);
        watchdog = null;
      };
      const settle = (): void => {
        if (settled || !callbacksDone || this.paused) return;
        settled = true;
        clearWatchdog();
        if (waitWarning !== null) clearTimeout(waitWarning);
        unsubscribeResume?.();
        console.info("[Cozy SDK] interstitial_navigation_unblocked");
        resolve(wasShown);
      };
      // onClose may arrive *before* game_api_resume. Releasing navigation
      // immediately would start a new PlayScene stage while SDK input and
      // Phaser timers are still frozen. Hold until both conditions are true.
      const finishCallbacks = (shown: boolean): void => {
        if (callbacksDone) return;
        callbacksDone = true;
        wasShown = shown;
        clearWatchdog();
        if (this.paused) {
          console.info("[Cozy SDK] interstitial_closed_waiting_sdk_resume");
          waitWarning = setTimeout(() => {
            if (!settled) console.warn("[Cozy SDK] interstitial_resume_still_pending");
          }, 10000);
        }
        settle();
      };

      unsubscribeResume = this.onResume(() => settle());
      watchdog = setTimeout(() => {
        console.warn("[Cozy SDK] interstitial_no_callback");
        finishCallbacks(false);
      }, 15000);
      try {
        this.sdk.adv!.showFullscreenAdv({
          onOpen: () => {
            if (callbacksDone) return;
            console.info("[Cozy SDK] interstitial_open");
            clearWatchdog();
            watchdog = setTimeout(() => {
              console.warn("[Cozy SDK] interstitial_close_timeout");
              finishCallbacks(false);
            }, 120000);
          },
          onClose: (shown) => {
            console.info("[Cozy SDK] interstitial_close", shown);
            finishCallbacks(shown === true);
          },
          onError: (error) => {
            console.warn("[Cozy SDK] interstitial_error", error);
            finishCallbacks(false);
          },
        });
      } catch (error) {
        console.warn("[Cozy SDK] interstitial_throw", error);
        finishCallbacks(false);
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
