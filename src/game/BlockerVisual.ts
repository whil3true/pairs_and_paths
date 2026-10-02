import { BLOCKER_VISUAL_STYLE } from "./GameplayFeedbackPolicy.js";
import { VISUAL_COLORS } from "./VisualTokens.js";

/** Deterministic, presentation-only stone terrain for one blocked cell. */
export const createBlockerVisual = (scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container => {
  const style = BLOCKER_VISUAL_STYLE;
  const half = style.size / 2;
  const graphics = scene.add.graphics();
  graphics.fillStyle(VISUAL_COLORS.text.primary.phaser, 0.23)
    .fillRoundedRect(-half, -half + 3, style.size, style.size - 3, 8);
  graphics.fillStyle(style.fill, 1).lineStyle(style.edgeWidth, style.edge, 1)
    .beginPath().moveTo(-half + 8, -half).lineTo(half - 11, -half).lineTo(half, -half + 11)
    .lineTo(half, half - 8).arc(half - 8, half - 8, 8, 0, Math.PI / 2)
    .lineTo(-half + 8, half).arc(-half + 8, half - 8, 8, Math.PI / 2, Math.PI)
    .lineTo(-half, -half + 8).arc(-half + 8, -half + 8, 8, Math.PI, Math.PI * 1.5)
    .closePath().fillPath().strokePath();
  graphics.fillStyle(0xffffff, 0.07)
    .fillTriangle(-half + 5, -half + 5, half - 13, -half + 5, -half + 5, 2)
    .fillStyle(style.edge, 0.18)
    .fillTriangle(-half + 4, half - 5, half - 5, half - 5, half - 5, 4);
  graphics.lineStyle(2, style.edge, 0.7).beginPath().moveTo(-18, -5).lineTo(-11, 1).lineTo(-15, 8).strokePath();
  graphics.lineStyle(2, style.edge, 0.6).beginPath().moveTo(17, 5).lineTo(11, 10).strokePath();

  // Closed-lock relief: dark offset under a cream shackle and masonry body.
  graphics.lineStyle(4, style.edge, 0.55).beginPath().arc(1, -5, 8, Math.PI, 0).strokePath();
  graphics.fillStyle(style.edge, 0.55).fillRoundedRect(-11, -3, 24, 17, 4);
  graphics.lineStyle(3, style.relief, 1).beginPath().arc(0, -6, 8, Math.PI, 0).strokePath();
  graphics.fillStyle(style.relief, 1).fillRoundedRect(-12, -4, 24, 17, 4);
  graphics.fillStyle(style.edge, 0.75).fillCircle(0, 3, 2.5).fillRect(-1.5, 3, 3, 5);
  return scene.add.container(x, y, [graphics]).setDepth(4).setName("board-blocker");
};
