import { PlayScene } from "./game/PlayScene.js";
import { parseDebugStart } from "./game/DebugStart.js";
import { WebPlatform } from "./platform/WebPlatform.js";

const platform = new WebPlatform();
const debugStart = parseDebugStart(window.location.search);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#10182b",
  scene: [new PlayScene(platform, debugStart)],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 800,
  },
});
