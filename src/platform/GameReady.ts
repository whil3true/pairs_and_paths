import type { PlatformService } from "./PlatformService.js";

/** Debug entry points may render PlayScene or SymbolGalleryScene first. */
export const READY_SCENE_KEYS = Object.freeze([
  "MainMenuScene", "PlayScene", "SymbolGalleryScene",
]);

export const hasInteractiveScene = (activeKeys: readonly string[]): boolean =>
  activeKeys.some((key) => READY_SCENE_KEYS.includes(key));

/** Signal platform readiness after the first rendered interactive screen. */
export const attachGameReady = (game: Phaser.Game, platform: PlatformService): (() => void) => {
  let sent = false;
  const onPostRender = (): void => {
    if (sent) return;
    const activeKeys = game.scene.getScenes(true).map((scene) => scene.scene.key);
    if (!hasInteractiveScene(activeKeys)) return;
    sent = true;
    game.events.off(Phaser.Core.Events.POST_RENDER, onPostRender);
    platform.ready();
  };
  game.events.on(Phaser.Core.Events.POST_RENDER, onPostRender);
  const detach = (): void => { game.events.off(Phaser.Core.Events.POST_RENDER, onPostRender); };
  game.events.once(Phaser.Core.Events.DESTROY, detach);
  return detach;
};
