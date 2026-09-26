import { PlayScene } from "./game/PlayScene.js";
import { isSymbolGalleryRequested, parseDebugStart } from "./game/DebugStart.js";
import { SymbolGalleryScene } from "./game/SymbolGalleryScene.js";
import {
  computeRenderScale, isLegacyRenderScaleDebugRequested, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH,
} from "./game/Display.js";
import { WebPlatform } from "./platform/WebPlatform.js";

const platform = new WebPlatform();
const debugStart = parseDebugStart(window.location.search);
const automaticRenderScale = computeRenderScale(window.devicePixelRatio || 1);
const renderScale = isLegacyRenderScaleDebugRequested(window.location.search)
  ? 1
  : automaticRenderScale;
const scene = isSymbolGalleryRequested(window.location.search)
  ? new SymbolGalleryScene(renderScale)
  : new PlayScene(platform, debugStart, renderScale);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#10182b",
  scene: [scene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // The backing canvas follows the capped DPR while the camera retains this world view.
    width: LOGICAL_GAME_WIDTH * renderScale,
    height: LOGICAL_GAME_HEIGHT * renderScale,
  },
});
