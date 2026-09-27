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

export interface CoverCrop {
  readonly destinationX: number;
  readonly destinationY: number;
  readonly destinationWidth: number;
  readonly destinationHeight: number;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly scale: number;
}

/** Returns the centered source crop that covers exactly the requested destination rectangle. */
export const computeCoverCrop = (
  sourceWidth: number,
  sourceHeight: number,
  destinationX: number,
  destinationY: number,
  destinationWidth: number,
  destinationHeight: number,
): CoverCrop => {
  if ([sourceWidth, sourceHeight, destinationX, destinationY, destinationWidth, destinationHeight]
    .some((value) => !Number.isFinite(value))) {
    throw new RangeError("Artwork and destination values must be finite numbers");
  }
  if ([sourceWidth, sourceHeight, destinationWidth, destinationHeight]
    .some((value) => value <= 0)) {
    throw new RangeError("Artwork and destination dimensions must be positive finite numbers");
  }
  const scale = Math.max(destinationWidth / sourceWidth, destinationHeight / sourceHeight);
  const croppedSourceWidth = destinationWidth / scale;
  const croppedSourceHeight = destinationHeight / scale;
  return {
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight,
    sourceX: (sourceWidth - croppedSourceWidth) / 2,
    sourceY: (sourceHeight - croppedSourceHeight) / 2,
    sourceWidth: croppedSourceWidth,
    sourceHeight: croppedSourceHeight,
    scale,
  };
};
