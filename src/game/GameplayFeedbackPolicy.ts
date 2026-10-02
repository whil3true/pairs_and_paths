import { BoardLayout, type WorldPoint } from "./BoardLayout.js";
import { BORDERS, MOTION, VISUAL_COLORS } from "./VisualTokens.js";

export const GAMEPLAY_FEEDBACK = Object.freeze({
  route: Object.freeze({ haloWidth: 11, coreWidth: 5, entryDuration: 180, holdDuration: 40, fadeDuration: 60 }),
  initialStageSettleDuration: 80,
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

export interface PolylineMetrics {
  readonly points: readonly WorldPoint[];
  /** Physical distance from the first point to each corresponding point. */
  readonly cumulativeLengths: readonly number[];
  readonly totalLength: number;
}

/** Precomputes the immutable geometry shared by every frame of a route draw. */
export const createPolylineMetrics = (points: readonly WorldPoint[]): PolylineMetrics => {
  const cumulativeLengths: number[] = [];
  let totalLength = 0;
  for (let index = 0; index < points.length; index += 1) {
    if (index > 0) {
      const start = points[index - 1]!;
      const end = points[index]!;
      totalLength += Math.hypot(end.x - start.x, end.y - start.y);
    }
    cumulativeLengths.push(totalLength);
  }
  return { points, cumulativeLengths, totalLength };
};

/** Returns the physical-length prefix without recomputing invariant segment geometry. */
export const partialPolylineFromMetrics = (
  metrics: PolylineMetrics,
  progress: number,
): readonly WorldPoint[] => {
  const { points, cumulativeLengths, totalLength } = metrics;
  if (points.length === 0) return [];
  if (points.length === 1 || progress <= 0) return [points[0]!];
  if (progress >= 1) return points;
  const target = totalLength * progress;
  const result: WorldPoint[] = [points[0]!];
  for (let index = 0; index < points.length - 1; index += 1) {
    const covered = cumulativeLengths[index]!;
    const segmentEnd = cumulativeLengths[index + 1]!;
    const length = segmentEnd - covered;
    const start = points[index]!;
    const end = points[index + 1]!;
    if (segmentEnd >= target) {
      const ratio = length === 0 ? 1 : (target - covered) / length;
      const interpolated = { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
      if (interpolated.x !== result.at(-1)!.x || interpolated.y !== result.at(-1)!.y) result.push(interpolated);
      return result;
    }
    if (end.x !== result.at(-1)!.x || end.y !== result.at(-1)!.y) result.push(end);
  }
  return result;
};

/** Convenience wrapper for callers that do not animate repeated samples. */
export const partialPolyline = (points: readonly WorldPoint[], progress: number): readonly WorldPoint[] =>
  partialPolylineFromMetrics(createPolylineMetrics(points), progress);
