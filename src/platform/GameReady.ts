import type { PlatformService } from "./PlatformService.js";

/** In normal launch, the interactive first screen is MainMenuScene.
 * Debug launch routes can start directly in PlayScene / SymbolGalleryScene.
 * A POST_RENDER is required so the canvas has actually displayed that scene.
 */
export const READY_SCENE_KEYS = Object.freeze([
  "MainMenuScene", "PlayScene", "SymbolGalleryScene",
]);

export const hasInteractiveScene = (
  activeKeys: readonly string[],
): boolean => activeKeys.some((key) => READY_SCENE_KEYS.includes(key));

/** Register immediately after Phaser construction; never signal ready for BootScene/loader. */
export const attachGameReady = (game: Phaser.Game, platform: PlatformService): (() => void) => {
  let sent = false;
  const onPostRender = (): void => {
    if (sent) return;
    const keys = game.scene.getScenes(true).map((scene) => scene.scene.key);
    if (!hasInteractiveScene(keys)) return;
    sent = true;
    game.events.off(Phaser.Core.Events.POST_RENDER, onPostRender);
    platform.ready();
  };
  game.events.on(Phaser.Core.Events.POST_RENDER, onPostRender);
  const detach = (): void => game.events.off(Phaser.Core.Events.POST_RENDER, onPostRender);
  game.events.once(Phaser.Core.Events.DESTROY, detach);
  return detach;
};
