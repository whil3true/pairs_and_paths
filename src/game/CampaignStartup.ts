import type { DebugStartPosition } from "./DebugStart.js";

export type StartupRoute =
  | { readonly kind: "menu" }
  | { readonly kind: "gallery" }
  | { readonly kind: "play"; readonly position: DebugStartPosition; readonly persistenceEnabled: false };

/** Pure startup route selection. Progress mutations are applied before this decision. */
export const resolveStartupRoute = (
  debugStart: DebugStartPosition | null,
  symbolGalleryRequested: boolean,
): StartupRoute => symbolGalleryRequested
  ? { kind: "gallery" }
  : debugStart === null
    ? { kind: "menu" }
    : { kind: "play", position: debugStart, persistenceEnabled: false };
