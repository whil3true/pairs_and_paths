import { PlayScene } from "./game/PlayScene.js";
import { isSymbolGalleryRequested, parseDebugStart } from "./game/DebugStart.js";
import { SymbolGalleryScene } from "./game/SymbolGalleryScene.js";
import { WebPlatform } from "./platform/WebPlatform.js";

const platform = new WebPlatform();
const debugStart = parseDebugStart(window.location.search);
const scene = isSymbolGalleryRequested(window.location.search)
  ? new SymbolGalleryScene()
  : new PlayScene(platform, debugStart);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#10182b",
  scene: [scene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 800,
  },
});
