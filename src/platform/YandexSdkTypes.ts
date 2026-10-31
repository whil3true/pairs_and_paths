/** Small browser SDK surface needed for initial platform integration. */
export type YandexLifecycleEvent = "game_api_pause" | "game_api_resume";

export interface YandexSdk {
  readonly features?: {
    readonly LoadingAPI?: { ready(): void };
    readonly GameplayAPI?: { start(): void; stop(): void };
  };
  readonly adv?: {
    showFullscreenAdv(callbacks?: {
      onOpen?: () => void;
      onClose?: (wasShown: boolean) => void;
      onError?: (error: object) => void;
    }): void;
  };
  readonly environment?: { readonly i18n?: { readonly lang?: string } };
  on(event: YandexLifecycleEvent, handler: () => void): void;
  off(event: YandexLifecycleEvent, handler: () => void): void;
}

export interface YandexGamesGlobal {
  init(): Promise<YandexSdk>;
}
