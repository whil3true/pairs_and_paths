import type { PlatformService } from "./PlatformService.js";

export const INTERSTITIAL_COOLDOWN_MS = 90_000;
export const INTERSTITIAL_RETRY_MS = 15_000;

/** Keeps adverts tied to an intentional level boundary, never to a timer. */
export class InterstitialController {
  private readonly sessionStart: number;
  private lastShownAt: number;
  private lastAttemptAt: number | null = null;
  private pending = false;

  constructor(
    private readonly platform: Pick<PlatformService, "id" | "showInterstitial">,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.sessionStart = this.now();
    // The portal may have shown a non-queryable automatic startup advert.
    this.lastShownAt = this.sessionStart;
  }

  async tryShow(): Promise<boolean> {
    const time = this.now();
    if (this.pending || this.platform.id !== "yandex") return false;
    if (time - this.lastShownAt < INTERSTITIAL_COOLDOWN_MS) return false;
    if (this.lastAttemptAt !== null && time - this.lastAttemptAt < INTERSTITIAL_RETRY_MS) return false;
    this.lastAttemptAt = time;
    this.pending = true;
    try {
      const shown = await this.platform.showInterstitial();
      if (shown) this.lastShownAt = this.now();
      return shown;
    } catch (error) {
      console.warn("[Cozy SDK] interstitial_request_failed", error);
      return false;
    } finally {
      this.pending = false;
    }
  }
}
