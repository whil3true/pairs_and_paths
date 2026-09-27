import type { CampaignProgress } from "../progress/CampaignProgress.js";
import { getStageCount } from "./LevelSequence.js";

export interface LevelArtworkDefinition {
  readonly levelNumber: number;
  readonly assetKey: string;
  readonly path: string;
}

export const LEVEL_ARTWORK: readonly LevelArtworkDefinition[] = Object.freeze([
  Object.freeze({ levelNumber: 1, assetKey: "level-artwork-001", path: "assets/artwork/pilot/level-001.svg" }),
  Object.freeze({ levelNumber: 30, assetKey: "level-artwork-030", path: "assets/artwork/pilot/level-030.svg" }),
  Object.freeze({ levelNumber: 80, assetKey: "level-artwork-080", path: "assets/artwork/pilot/level-080.svg" }),
]);

export const getLevelArtwork = (levelNumber: number): LevelArtworkDefinition | undefined =>
  LEVEL_ARTWORK.find((artwork) => artwork.levelNumber === levelNumber);

/** Stage indices are zero-based, matching PlayScene and LevelSequence. */
export const isArtworkRevealStage = (levelNumber: number, stageIndex: number): boolean =>
  getLevelArtwork(levelNumber) !== undefined && stageIndex === getStageCount(levelNumber) - 1;

/** Gallery state is derived; artwork never adds fields to CampaignProgress. */
export const isArtworkUnlocked = (progress: CampaignProgress, levelNumber: number): boolean =>
  progress.completedThroughLevel >= levelNumber;

export interface CoverPlacement {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly scale: number;
}

/** Centers an undistorted source while covering the complete destination rectangle. */
export const computeCoverPlacement = (
  sourceWidth: number,
  sourceHeight: number,
  destinationX: number,
  destinationY: number,
  destinationWidth: number,
  destinationHeight: number,
): CoverPlacement => {
  if ([sourceWidth, sourceHeight, destinationWidth, destinationHeight]
    .some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new RangeError("Artwork and destination dimensions must be positive finite numbers");
  }
  const scale = Math.max(destinationWidth / sourceWidth, destinationHeight / sourceHeight);
  return {
    x: destinationX + destinationWidth / 2,
    y: destinationY + destinationHeight / 2,
    width: sourceWidth * scale,
    height: sourceHeight * scale,
    scale,
  };
};
