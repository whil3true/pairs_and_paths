export interface GameplayState {
  readonly sceneActive: boolean;
  readonly uiReady: boolean;
  readonly presentation: "gameplay" | "loading" | "reward" | "complete";
  readonly sdkPaused: boolean;
  readonly browserPaused: boolean;
  readonly manualPauseOpen: boolean;
}
export const isGameplayActive = (s: GameplayState): boolean =>
  s.sceneActive && s.uiReady && s.presentation === "gameplay"
  && !s.sdkPaused && !s.browserPaused && !s.manualPauseOpen;
