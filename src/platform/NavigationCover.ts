/** A fixed cover prevents the previous screen flashing between ad close and the next render.
 * Unlike a Phaser object, this remains visible while the SDK pauses rendering. */
const COVER_ID = "navigation-cover";
const MAX_COVER_MS = 10000;
let fallback: ReturnType<typeof setTimeout> | null = null;

export const hideNavigationCover = (): void => {
  if (fallback !== null) clearTimeout(fallback);
  fallback = null;
  if (typeof document !== "undefined") {
    const cover = document.getElementById(COVER_ID);
    if (cover) cover.hidden = true;
  }
};

export const showNavigationCover = (): void => {
  if (typeof document === "undefined") return;
  let cover = document.getElementById(COVER_ID);
  if (!cover) {
    cover = document.createElement("div");
    cover.id = COVER_ID;
    cover.setAttribute("aria-hidden", "true");
    const gameRoot = document.getElementById("game");
    if (!gameRoot) return;
    gameRoot.appendChild(cover);
  }
  cover.hidden = false;
};

/** Start a failsafe only after the selected navigation has been committed. */
export const armNavigationCoverFallback = (): void => {
  if (typeof document === "undefined" || document.getElementById(COVER_ID)?.hidden !== false) return;
  if (fallback !== null) clearTimeout(fallback);
  fallback = setTimeout(() => {
    console.warn("[Cozy SDK] navigation_cover_render_timeout");
    hideNavigationCover();
  }, MAX_COVER_MS);
};

/** Called by the destination only after its UI or board is constructed. */
export const releaseNavigationCoverAfterRender = (game: Phaser.Game): void => {
  if (typeof document === "undefined" || document.getElementById(COVER_ID)?.hidden !== false) return;
  game.events.once(Phaser.Core.Events.POST_RENDER, hideNavigationCover);
};
