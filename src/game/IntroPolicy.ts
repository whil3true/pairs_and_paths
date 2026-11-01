/** Pure timing policy for the noninteractive startup intro. */
export const STARTUP_INTRO_DURATION_MS = 1200;
export const shouldFinishStartupIntro = (elapsedMs: number, sdkPaused: boolean): boolean =>
  elapsedMs >= STARTUP_INTRO_DURATION_MS && !sdkPaused;
