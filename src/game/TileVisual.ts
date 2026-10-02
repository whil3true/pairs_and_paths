import {
  computeBoardRuntimeAtlasLayout, getBoardSymbolFrameName, TILE_VISUAL_STYLE, type TileCardFrame,
} from "./BoardRuntimeAtlas.js";
import type { TileSymbolDefinition } from "./TileSymbols.js";

export { TILE_VISUAL_STYLE } from "./BoardRuntimeAtlas.js";

export type TileVisualState = "default" | "selected" | "hint" | "blocked";

/** Resolves semantic tile state before transient tactile press feedback. */
export const resolveTileCardFrame = (state: TileVisualState, pressed: boolean): TileCardFrame =>
  state === "default" && pressed ? "pressed" : state;

/** A tile's visual content; interaction remains owned by the stable board cell Zone. */
export class TileVisual {
  readonly root: Phaser.GameObjects.Container;
  readonly symbol: Phaser.GameObjects.Image;
  private readonly card: Phaser.GameObjects.Image;
  private cardFrame: TileCardFrame = "default";
  private state: TileVisualState = "default";
  private pressed = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    definition: TileSymbolDefinition,
    renderScale: number,
  ) {
    const atlas = computeBoardRuntimeAtlasLayout(renderScale);
    if (!scene.textures.exists(atlas.textureKey)) throw new Error(`Board runtime atlas is not ready: ${atlas.textureKey}`);
    const symbolFrame = getBoardSymbolFrameName(definition.assetKey);
    const texture = scene.textures.get(atlas.textureKey);
    if (!texture.has("tile/default") || !texture.has(symbolFrame)) {
      throw new Error(`Board runtime atlas lacks frames for tile symbol: ${definition.assetKey}`);
    }
    this.card = scene.add.image(0, 0, atlas.textureKey, "tile/default")
      .setDisplaySize(atlas.logicalSlotSize, atlas.logicalSlotSize);
    this.symbol = scene.add.image(0, 0, atlas.textureKey, symbolFrame)
      .setDisplaySize(atlas.logicalSlotSize, atlas.logicalSlotSize);
    this.root = scene.add.container(x, y, [this.card, this.symbol]).setDepth(5).setName("board-cell");
  }

  setState(state: TileVisualState): void {
    this.state = state;
    this.syncFrame();
  }

  press(tweens: Phaser.Tweens.TweenManager): void {
    tweens.killTweensOf(this.root);
    this.pressed = true;
    this.root.setScale(TILE_VISUAL_STYLE.pressedScale);
    this.syncFrame();
    tweens.add({
      targets: this.root,
      scaleX: 1,
      scaleY: 1,
      duration: TILE_VISUAL_STYLE.pressedDuration,
      ease: "Quad.Out",
      onComplete: () => {
        this.pressed = false;
        this.syncFrame();
      },
    });
  }

  destroy(): void {
    this.root.destroy(true);
  }

  private syncFrame(): void {
    const next = resolveTileCardFrame(this.state, this.pressed);
    if (next === this.cardFrame) return;
    this.cardFrame = next;
    this.card.setFrame(`tile/${next}`);
  }
}
