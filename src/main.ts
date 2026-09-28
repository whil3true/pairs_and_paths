import { BootScene } from "./game/BootScene.js";
import { resolveStartupRoute } from "./game/CampaignStartup.js";
import { isProgressResetRequested, isSymbolGalleryRequested, parseDebugSetProgress, parseDebugStart } from "./game/DebugStart.js";
import { MainMenuScene } from "./game/MainMenuScene.js";
import { LevelSelectScene } from "./game/LevelSelectScene.js";
import { PlayScene } from "./game/PlayScene.js";
import { SymbolGalleryScene } from "./game/SymbolGalleryScene.js";
import { ArtworkGalleryScene } from "./game/ArtworkGalleryScene.js";
import { ArtworkFullViewScene } from "./game/ArtworkFullViewScene.js";
import {
  computeRenderScale, isLegacyRenderScaleDebugRequested, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH,
} from "./game/Display.js";
import { WebPlatform } from "./platform/WebPlatform.js";
import { WebProgressStore } from "./platform/WebProgressStore.js";

const platform = new WebPlatform();
const progressStore = new WebProgressStore();
const search = window.location.search;
const resetProgress = isProgressResetRequested(search);
if (resetProgress) progressStore.clear();
else {
  const setProgress = parseDebugSetProgress(search);
  if (setProgress !== null) progressStore.save({ version: 1, completedThroughLevel: setProgress });
}
const route = resolveStartupRoute(parseDebugStart(search), isSymbolGalleryRequested(search));
const automaticRenderScale = computeRenderScale(window.devicePixelRatio || 1);
const renderScale = isLegacyRenderScaleDebugRequested(search) ? 1 : automaticRenderScale;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#10182b",
  scene: [
    new BootScene(route),
    new MainMenuScene(progressStore, renderScale),
    new LevelSelectScene(progressStore, renderScale),
    new ArtworkGalleryScene(progressStore, renderScale),
    new ArtworkFullViewScene(progressStore, renderScale),
    new PlayScene(platform, progressStore, renderScale),
    new SymbolGalleryScene(renderScale),
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: LOGICAL_GAME_WIDTH * renderScale,
    height: LOGICAL_GAME_HEIGHT * renderScale,
  },
});
