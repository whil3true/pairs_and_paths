import { BootstrapScene } from "./game/BootstrapScene.js";
import { WebPlatform } from "./platform/WebPlatform.js";

const platform = new WebPlatform();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#10182b",
  scene: [new BootstrapScene(platform)],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 800,
  },
});
