import { BORDERS, COMPONENT_RADII, MOTION, VISUAL_COLORS } from "./VisualTokens.js";

export const TILE_SYMBOL_TARGET_SIZE = 38;
export const TILE_SYMBOL_MAX_SIZE = 42;

export const TILE_VISUAL_STYLE = Object.freeze({
  size: 56,
  radius: COMPONENT_RADII.tile,
  fill: VISUAL_COLORS.surface.card.phaser,
  pressedFill: VISUAL_COLORS.state.pressedFill.phaser,
  border: VISUAL_COLORS.border.strong.phaser,
  selectedBorder: VISUAL_COLORS.primary.teal.phaser,
  hintBorder: VISUAL_COLORS.state.hint.phaser,
  blockedBorder: VISUAL_COLORS.state.danger.phaser,
  borderWidth: BORDERS.structural,
  emphasizedBorderWidth: BORDERS.emphasized,
  pressedScale: 0.96,
  pressedDuration: MOTION.tilePress,
});

export type TileVisualState = "default" | "selected" | "hint" | "blocked";

/** A tile's visual content; interaction remains owned by the stable board cell Zone. */
export class TileVisual {
  readonly root: Phaser.GameObjects.Container;
  private readonly card: Phaser.GameObjects.Graphics;
  private readonly marker: Phaser.GameObjects.Graphics;
  private state: TileVisualState = "default";
  private pressed = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly symbol: Phaser.GameObjects.Image,
  ) {
    this.card = scene.add.graphics();
    this.marker = scene.add.graphics();
    this.symbol.setPosition(0, 0);
    const source = this.symbol.texture.getSourceImage() as { width: number; height: number };
    const scale = Math.min(TILE_SYMBOL_TARGET_SIZE / source.width, TILE_SYMBOL_TARGET_SIZE / source.height);
    this.symbol.setDisplaySize(source.width * scale, source.height * scale);
    this.root = scene.add.container(x, y, [this.card, this.symbol, this.marker]).setDepth(5).setName("board-cell");
    this.draw();
  }

  setState(state: TileVisualState): void {
    this.state = state;
    this.draw();
  }

  press(tweens: Phaser.Tweens.TweenManager): void {
    tweens.killTweensOf(this.root);
    this.pressed = true;
    this.root.setScale(TILE_VISUAL_STYLE.pressedScale);
    this.draw();
    tweens.add({
      targets: this.root,
      scaleX: 1,
      scaleY: 1,
      duration: TILE_VISUAL_STYLE.pressedDuration,
      ease: "Quad.Out",
      onComplete: () => {
        this.pressed = false;
        this.draw();
      },
    });
  }

  destroy(): void {
    this.root.destroy(true);
  }

  private draw(): void {
    const half = TILE_VISUAL_STYLE.size / 2;
    const fill = this.pressed ? TILE_VISUAL_STYLE.pressedFill : TILE_VISUAL_STYLE.fill;
    const border = this.state === "selected" ? TILE_VISUAL_STYLE.selectedBorder
      : this.state === "hint" ? TILE_VISUAL_STYLE.hintBorder
        : this.state === "blocked" ? TILE_VISUAL_STYLE.blockedBorder : TILE_VISUAL_STYLE.border;
    const borderWidth = this.state === "default"
      ? TILE_VISUAL_STYLE.borderWidth : TILE_VISUAL_STYLE.emphasizedBorderWidth;
    this.card.clear().fillStyle(fill, 1).lineStyle(borderWidth, border, 1)
      .fillRoundedRect(-half, -half, TILE_VISUAL_STYLE.size, TILE_VISUAL_STYLE.size, TILE_VISUAL_STYLE.radius)
      .strokeRoundedRect(-half, -half, TILE_VISUAL_STYLE.size, TILE_VISUAL_STYLE.size, TILE_VISUAL_STYLE.radius);
    this.marker.clear();
    if (this.state === "selected") {
      const inset = 2;
      const start = -half + inset + borderWidth / 2;
      this.marker.lineStyle(2, TILE_VISUAL_STYLE.selectedBorder, 1).beginPath()
        .moveTo(start, start + 9).lineTo(start, start).lineTo(start + 9, start).strokePath();
    } else if (this.state === "hint") {
      this.marker.lineStyle(1, TILE_VISUAL_STYLE.hintBorder, 1)
        .strokeRoundedRect(-half + 5, -half + 5, TILE_VISUAL_STYLE.size - 10, TILE_VISUAL_STYLE.size - 10,
          TILE_VISUAL_STYLE.radius - 3);
    }
  }
}
