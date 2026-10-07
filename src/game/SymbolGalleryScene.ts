import { preloadTileSymbols, TILE_SYMBOLS } from "./TileSymbols.js";
import { TileVisual } from "./TileVisual.js";
import { FONT_UI_FAMILY, VISUAL_COLORS } from "./VisualTokens.js";
import {
  configureLogicalCamera, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH, setHiDpiTextResolution,
} from "./Display.js";
import { ensureBoardRuntimeAtlas } from "./BoardRuntimeAtlas.js";

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
    ensureBoardRuntimeAtlas(this, this.renderScale);
    this.cameras.main.setBackgroundColor(VISUAL_COLORS.bg.app.phaser);
    setHiDpiTextResolution(this.add.text(240, 28, "Tile symbol gallery", {
      color: VISUAL_COLORS.text.primary.hex, fontFamily: FONT_UI_FAMILY, fontSize: "26px", fontStyle: "600",
    }).setOrigin(0.5), this.renderScale);

    const columns = 5;
    const startX = 48;
    const startY = 98;
    const columnPitch = 96;
    const rowPitch = 116;
    TILE_SYMBOLS.forEach((definition, index) => {
      const x = startX + (index % columns) * columnPitch;
      const y = startY + Math.floor(index / columns) * rowPitch;
      new TileVisual(this, x, y, definition, this.renderScale);
      setHiDpiTextResolution(this.add.text(x, y + 45, `${index + 1}. ${definition.name}`, {
        color: VISUAL_COLORS.text.secondary.hex, fontFamily: FONT_UI_FAMILY, fontSize: "11px",
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
