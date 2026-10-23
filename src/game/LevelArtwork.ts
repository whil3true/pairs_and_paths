import type { CampaignProgress } from "../progress/CampaignProgress.js";
import { getStageCount } from "./LevelSequence.js";

export interface LevelArtworkDefinition {
  readonly levelNumber: number;
  readonly fullAssetKey: string;
  readonly fullPath: string;
  readonly thumbnailAssetKey: string;
  readonly thumbnailPath: string;
}

export const LEVEL_ARTWORK: readonly LevelArtworkDefinition[] = Object.freeze(
  Array.from({ length: 100 }, (_, index): LevelArtworkDefinition => {
    const levelNumber = index + 1;
    const levelId = String(levelNumber).padStart(3, "0");
    return Object.freeze({
      levelNumber,
      fullAssetKey: `level-artwork-${levelId}-full`,
      fullPath: `assets/artwork/pipeline/full/level-${levelId}.webp`,
      thumbnailAssetKey: `level-artwork-${levelId}-thumb`,
      thumbnailPath: `assets/artwork/pipeline/thumbs/level-${levelId}.webp`,
    });
  }),
);

export const getLevelArtwork = (levelNumber: number): LevelArtworkDefinition | undefined =>
  LEVEL_ARTWORK.find((artwork) => artwork.levelNumber === levelNumber);

/** Stage indices are zero-based, matching PlayScene and LevelSequence. */
export const isArtworkRevealStage = (levelNumber: number, stageIndex: number): boolean =>
  getLevelArtwork(levelNumber) !== undefined && stageIndex === getStageCount(levelNumber) - 1;

/** Gallery state is derived; artwork never adds fields to CampaignProgress. */
export const isArtworkUnlocked = (progress: CampaignProgress, levelNumber: number): boolean =>
  progress.completedThroughLevel >= levelNumber;

export interface ContainedSquarePlacement {
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

/** Returns the largest centered square contained by the requested destination rectangle. */
export const computeContainedSquarePlacement = (
  destinationX: number,
  destinationY: number,
  destinationWidth: number,
  destinationHeight: number,
): ContainedSquarePlacement => {
  if ([destinationX, destinationY, destinationWidth, destinationHeight]
    .some((value) => !Number.isFinite(value))) {
    throw new RangeError("Artwork destination values must be finite numbers");
  }
  if (destinationWidth <= 0 || destinationHeight <= 0) {
    throw new RangeError("Artwork destination dimensions must be positive finite numbers");
  }
  const size = Math.min(destinationWidth, destinationHeight);
  return {
    x: destinationX + (destinationWidth - size) / 2,
    y: destinationY + (destinationHeight - size) / 2,
    size,
  };
};
