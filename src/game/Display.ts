export const LOGICAL_GAME_WIDTH = 480;
export const LOGICAL_GAME_HEIGHT = 800;

export interface PortraitFrame {
  readonly scale: number;
  readonly displayWidth: number;
  readonly displayHeight: number;
  readonly sideGutter: number;
  readonly topBottomGutter: number;
}

/** Describes the same uniform contain operation used by Phaser Scale.FIT. */
export const computePortraitFrame = (
  viewportWidth: number,
  viewportHeight: number,
  logicalWidth = LOGICAL_GAME_WIDTH,
  logicalHeight = LOGICAL_GAME_HEIGHT,
): PortraitFrame => {
  const scale = Math.min(viewportWidth / logicalWidth, viewportHeight / logicalHeight);
  const displayWidth = logicalWidth * scale;
  const displayHeight = logicalHeight * scale;
  return {
    scale,
    displayWidth,
    displayHeight,
    sideGutter: (viewportWidth - displayWidth) / 2,
    topBottomGutter: (viewportHeight - displayHeight) / 2,
  };
};

export const isHiDpiDebugRequested = (search: string): boolean => {
  const params = new URLSearchParams(search);
  return params.get("debug") === "1" && params.get("hidpi") === "1";
};

export const computeRenderScale = (devicePixelRatio: number): number =>
  Number.isFinite(devicePixelRatio) ? Math.min(2, Math.max(1, devicePixelRatio)) : 1;

/**
 * Phaser 4.2.1 has no GameConfig resolution property. A larger game canvas plus
 * camera zoom raises render density while retaining a centered 480x800 view.
 */
export const configureLogicalCamera = (scene: Phaser.Scene, renderScale: number): void => {
  if (renderScale === 1) return;
  // Zoom is centered in the larger camera viewport. Negative scroll cancels its
  // backing-pixel margin so the visible world remains exactly (0,0)..(480,800).
  scene.cameras.main
    .setZoom(renderScale)
    .setScroll(
      -LOGICAL_GAME_WIDTH * (renderScale - 1) / 2,
      -LOGICAL_GAME_HEIGHT * (renderScale - 1) / 2,
    );
};

export const setHiDpiTextResolution = <T extends Phaser.GameObjects.Text>(
  text: T,
  renderScale: number,
): T => renderScale === 1 ? text : text.setResolution(renderScale);
