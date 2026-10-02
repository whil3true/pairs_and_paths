import { BoardLayout, type WorldPoint } from "./BoardLayout.js";
import { BORDERS, MOTION, VISUAL_COLORS } from "./VisualTokens.js";

export const GAMEPLAY_FEEDBACK = Object.freeze({
  route: Object.freeze({ haloWidth: 11, coreWidth: 5, entryDuration: 120, holdDuration: 40, fadeDuration: 60 }),
  blockedDuration: 160,
  removal: Object.freeze({ duration: 180, scale: 0.88 }),
  hint: Object.freeze({ duration: MOTION.hint, pulseHalfDuration: 180, pulseRepeats: 1, scalePeak: 1.035,
    movingDuration: 720 }),
});

export const BLOCKER_VISUAL_STYLE = Object.freeze({
  size: BoardLayout.TILE_SIZE,
  edgeWidth: BORDERS.emphasized,
  fill: VISUAL_COLORS.blocker.fill.phaser,
  edge: VISUAL_COLORS.blocker.dark.phaser,
  relief: VISUAL_COLORS.blocker.relief.phaser,
});

/** Returns the physical-length prefix of an arbitrary polyline at progress 0..1. */
export const partialPolyline = (points: readonly WorldPoint[], progress: number): readonly WorldPoint[] => {
  if (points.length === 0) return [];
  if (points.length === 1 || progress <= 0) return [points[0]!];
  if (progress >= 1) return points.map(({ x, y }) => ({ x, y }));
  const lengths = points.slice(1).map((point, index) =>
    Math.hypot(point.x - points[index]!.x, point.y - points[index]!.y));
  const target = lengths.reduce((sum, length) => sum + length, 0) * progress;
  const result: WorldPoint[] = [{ ...points[0]! }];
  let covered = 0;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index]!;
    const start = points[index]!;
    const end = points[index + 1]!;
    if (covered + length >= target) {
      const ratio = length === 0 ? 1 : (target - covered) / length;
      const interpolated = { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
      if (interpolated.x !== result.at(-1)!.x || interpolated.y !== result.at(-1)!.y) result.push(interpolated);
      return result;
    }
    result.push({ x: end.x, y: end.y });
    covered += length;
  }
  return result;
};
