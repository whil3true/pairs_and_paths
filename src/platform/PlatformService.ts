export type PlatformId = "web" | "yandex";

export interface PlatformService {
  readonly id: PlatformId;
  readonly displayName: string;
  readonly locale: string;
  readonly isPaused: boolean;
  /** Send Yandex Game Ready only after a fully interactive first render. */
  ready(): void;
  /** SDK events can arrive before Phaser/audio construction. */
  onPause(handler: () => void): () => void;
  onResume(handler: () => void): () => void;
}
