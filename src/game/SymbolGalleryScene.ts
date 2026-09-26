import { preloadTileSymbols, TILE_SYMBOLS } from "./TileSymbols.js";
import {
  configureLogicalCamera, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH, setHiDpiTextResolution,
} from "./Display.js";

/** Developer-only contact sheet using the same textures and card treatment as gameplay. */
export class SymbolGalleryScene extends Phaser.Scene {
  constructor(private readonly renderScale = 1) {
    super({ key: "SymbolGalleryScene" });
  }

  preload(): void {
    preloadTileSymbols(this);
  }

  create(): void {
    configureLogicalCamera(this, this.renderScale);
    setHiDpiTextResolution(this.add.text(240, 28, "Tile symbol gallery", {
      color: "#f7fbff", fontFamily: "Arial, sans-serif", fontSize: "26px", fontStyle: "bold",
    }).setOrigin(0.5), this.renderScale);

    const columns = 5;
    const startX = 48;
    const startY = 98;
    const columnPitch = 96;
    const rowPitch = 116;
    const cardSize = 72;
    const symbolSize = Math.round(cardSize * 0.66);

    TILE_SYMBOLS.forEach((definition, index) => {
      const x = startX + (index % columns) * columnPitch;
      const y = startY + Math.floor(index / columns) * rowPitch;
      this.add.rectangle(x, y, cardSize, cardSize, 0x253b57)
        .setStrokeStyle(3, 0xb9cce2);
      this.add.image(x, y, definition.assetKey).setDisplaySize(symbolSize, symbolSize);
      setHiDpiTextResolution(this.add.text(x, y + 45, `${index + 1}. ${definition.name}`, {
        color: "#bcd1ec", fontFamily: "Arial, sans-serif", fontSize: "11px",
      }).setOrigin(0.5), this.renderScale);
    });

    this.addDiagnostics();
  }

  private addDiagnostics(): void {
    const canvas = this.game.canvas;
    const renderer = this.game.renderer.type === Phaser.WEBGL ? "WebGL" : "Canvas";
    const diagnostic = setHiDpiTextResolution(this.add.text(5, 5, "", {
      backgroundColor: "#10182bcc", color: "#dceaff", fontFamily: "monospace", fontSize: "8px",
      padding: { x: 3, y: 2 },
    }).setDepth(100), this.renderScale);
    const update = (): void => {
      diagnostic.setText([
        `viewport CSS ${window.innerWidth}x${window.innerHeight}`,
        `DPR ${window.devicePixelRatio || 1} · renderScale ${this.renderScale}`,
        `logical ${LOGICAL_GAME_WIDTH}x${LOGICAL_GAME_HEIGHT}`,
        `backing ${canvas.width}x${canvas.height}`,
        `client ${canvas.clientWidth}x${canvas.clientHeight}`,
        `renderer ${renderer}`,
      ]);
    };
    update();
    this.scale.on(Phaser.Scale.Events.RESIZE, update);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, update));
  }
}
