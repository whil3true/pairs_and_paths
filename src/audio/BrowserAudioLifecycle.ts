import type { AudioManager } from "./AudioManager.js";

/**
 * Browser focus / gesture binding. Call once at game bootstrap and dispose at shutdown.
 * Platform ad events should call manager.setAdActive() from the future SDK adapter.
 */
export const attachBrowserAudioLifecycle = (
  manager: AudioManager,
  win: Window = window,
  doc: Document = document,
): (() => void) => {
  let focused = true;
  const sync = (): void => manager.setPageVisible(!doc.hidden && focused);
  const unlock = (): void => manager.unlock();
  const blur = (): void => { focused = false; sync(); };
  const focus = (): void => { focused = true; sync(); };
  const visibility = (): void => { if (doc.hidden) focused = false; else focused = true; sync(); };
  win.addEventListener("pointerdown", unlock, { passive: true });
  win.addEventListener("keydown", unlock);
  win.addEventListener("blur", blur);
  win.addEventListener("focus", focus);
  doc.addEventListener("visibilitychange", visibility);
  sync();
  return () => {
    win.removeEventListener("pointerdown", unlock);
    win.removeEventListener("keydown", unlock);
    win.removeEventListener("blur", blur);
    win.removeEventListener("focus", focus);
    doc.removeEventListener("visibilitychange", visibility);
  };
};
