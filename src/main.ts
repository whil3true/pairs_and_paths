import { PlayScene } from "./game/PlayScene.js";
import { isSymbolGalleryRequested, parseDebugStart } from "./game/DebugStart.js";
import { SymbolGalleryScene } from "./game/SymbolGalleryScene.js";
import {
  computeRenderScale, isHiDpiDebugRequested, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH,
} from "./game/Display.js";
import { WebPlatform } from "./platform/WebPlatform.js";

const platform = new WebPlatform();
const debugStart = parseDebugStart(window.location.search);
const hiDpiEnabled = isHiDpiDebugRequested(window.location.search);
const renderScale = hiDpiEnabled ? computeRenderScale(window.devicePixelRatio || 1) : 1;
const scene = isSymbolGalleryRequested(window.location.search)
  ? new SymbolGalleryScene(renderScale, hiDpiEnabled)
  : new PlayScene(platform, debugStart, renderScale);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#10182b",
  scene: [scene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Phaser 4.2.1 exposes no global render-resolution config. In the gated
    // experiment the backing canvas grows while the camera retains this world view.
    width: LOGICAL_GAME_WIDTH * renderScale,
    height: LOGICAL_GAME_HEIGHT * renderScale,
  },
});
