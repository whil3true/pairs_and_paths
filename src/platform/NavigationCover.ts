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
    document.body.appendChild(cover);
  }
  cover.hidden = false;
  if (fallback !== null) clearTimeout(fallback);
  fallback = setTimeout(() => {
    console.warn("[Cozy SDK] navigation_cover_timeout");
    hideNavigationCover();
  }, MAX_COVER_MS);
};

/** After scene.start, wait for a renderer frame: never expose the old scene. */
export const releaseNavigationCoverAfterRender = (game: Phaser.Game): void => {
  game.events.once(Phaser.Core.Events.POST_RENDER, hideNavigationCover);
};
