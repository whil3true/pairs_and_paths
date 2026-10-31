export type PlatformId = "web" | "yandex";

export interface PlatformService {
  readonly id: PlatformId;
  readonly displayName: string;
  readonly locale: string;
  readonly isPaused: boolean;
  /** Signals that a playable scene has finished its first render. */
  ready(): void;
  setGameplayActive(active: boolean): void;
  onPause(handler: () => void): () => void;
  onResume(handler: () => void): () => void;
}
