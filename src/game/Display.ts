export const LOGICAL_GAME_WIDTH = 480;
export const LOGICAL_GAME_HEIGHT = 800;

/**
 * Maximum logical height exposed by the adaptive portrait canvas. This is a
 * guard rail for pathological aspect ratios and GPU fill-rate, not layout
 * space: authored gameplay/UI remains inside the centered 480x800 composition.
 */
export const MAX_LOGICAL_VIEWPORT_HEIGHT = LOGICAL_GAME_HEIGHT * 2;

export interface PortraitFrame {
  readonly scale: number;
  readonly displayWidth: number;
  readonly displayHeight: number;
  readonly sideGutter: number;
  readonly topBottomGutter: number;
  readonly logicalViewportWidth: number;
  readonly logicalViewportHeight: number;
}

/**
 * Describes the production Phaser.Scale.EXPAND contract with canvas width
 * capped at the canonical portrait width. Wide viewports therefore retain
 * desktop side gutters, while normal tall-mobile viewports extend the Phaser
 * canvas vertically instead of exposing CSS gutters above and below it.
 */
export const computePortraitFrame = (
  viewportWidth: number,
  viewportHeight: number,
  logicalWidth = LOGICAL_GAME_WIDTH,
  logicalHeight = LOGICAL_GAME_HEIGHT,
): PortraitFrame => {
  const widthScale = viewportWidth / logicalWidth;
  const heightScale = viewportHeight / logicalHeight;

  if (widthScale <= heightScale) {
    const logicalViewportHeight = Math.min(
      viewportHeight / widthScale,
      logicalHeight * 2,
    );
    const displayHeight = logicalViewportHeight * widthScale;
    return {
      scale: widthScale,
      displayWidth: viewportWidth,
      displayHeight,
      sideGutter: 0,
      topBottomGutter: (viewportHeight - displayHeight) / 2,
      logicalViewportWidth: logicalWidth,
      logicalViewportHeight,
    };
  }

  const displayWidth = logicalWidth * heightScale;
  return {
    scale: heightScale,
    displayWidth,
    displayHeight: viewportHeight,
    sideGutter: (viewportWidth - displayWidth) / 2,
    topBottomGutter: 0,
    logicalViewportWidth: logicalWidth,
    logicalViewportHeight: logicalHeight,
  };
};

export const isLegacyRenderScaleDebugRequested = (search: string): boolean => {
  const params = new URLSearchParams(search);
  return params.get("debug") === "1" && params.get("renderScale") === "1";
};

export const computeRenderScale = (devicePixelRatio: number): number =>
  Number.isFinite(devicePixelRatio) ? Math.min(2, Math.max(1, devicePixelRatio)) : 1;

const logicalCameraResizeHandlers = new WeakMap<Phaser.Scene, () => void>();

/**
 * Keeps the immutable 480x800 production composition centered inside the
 * adaptive Phaser viewport. EXPAND may reveal background-only world space
 * above/below on tall phones, while renderScale still supplies HiDPI backing
 * pixels.
 */
export const configureLogicalCamera = (scene: Phaser.Scene, renderScale: number): void => {
  const existing = logicalCameraResizeHandlers.get(scene);
  if (existing !== undefined) scene.scale.off(Phaser.Scale.Events.RESIZE, existing);

  const syncCamera = (): void => {
    scene.cameras.main
      .setZoom(renderScale)
      .centerOn(LOGICAL_GAME_WIDTH / 2, LOGICAL_GAME_HEIGHT / 2);
  };

  logicalCameraResizeHandlers.set(scene, syncCamera);
  scene.scale.on(Phaser.Scale.Events.RESIZE, syncCamera);
  syncCamera();

  if (existing === undefined) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      const current = logicalCameraResizeHandlers.get(scene);
      if (current !== undefined) scene.scale.off(Phaser.Scale.Events.RESIZE, current);
      logicalCameraResizeHandlers.delete(scene);
    });
  }
};

export const setHiDpiTextResolution = <T extends Phaser.GameObjects.Text>(
  text: T,
  renderScale: number,
): T => renderScale === 1 ? text : text.setResolution(renderScale);
