import type { PlatformService } from "./PlatformService.js";

export function normalizeLocale(language: string | undefined): string {
  const locale = language?.trim().replace("_", "-");
  return locale || "en";
}

export class WebPlatform implements PlatformService {
  readonly id = "web" as const;
  readonly displayName = "Web";
  readonly locale: string;
  readonly isPaused = false;

  ready(): void { /* Standalone web build: no platform SDK. */ }
  onPause(_handler: () => void): () => void { return () => {}; }
  onResume(_handler: () => void): () => void { return () => {}; }

  constructor(language = globalThis.navigator?.language) {
    this.locale = normalizeLocale(language);
  }
}
