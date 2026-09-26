import { preloadTileSymbols, TILE_SYMBOLS } from "./TileSymbols.js";

/** Developer-only contact sheet using the same textures and card treatment as gameplay. */
export class SymbolGalleryScene extends Phaser.Scene {
  constructor() {
    super({ key: "SymbolGalleryScene" });
  }

  preload(): void {
    preloadTileSymbols(this);
  }

  create(): void {
    this.add.text(240, 28, "Tile symbol gallery", {
      color: "#f7fbff", fontFamily: "Arial, sans-serif", fontSize: "26px", fontStyle: "bold",
    }).setOrigin(0.5);

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
      this.add.text(x, y + 45, `${index + 1}. ${definition.name}`, {
        color: "#bcd1ec", fontFamily: "Arial, sans-serif", fontSize: "11px",
      }).setOrigin(0.5);
    });
  }
}
