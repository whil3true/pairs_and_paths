import { generateLevel, type GeneratedLevel, type GenerationConfig, type GridPoint } from "../domain/index.js";

export const TOTAL_LEVELS = 100;
export const CHAPTER_COUNT = 10;
export const LEVELS_PER_CHAPTER = 10;

const SEED_STEP = 0x9e37_79b9;
const PRE_STAGE_SEED_MIX = 0x85eb_ca6b;
const PRE_STAGE_INDEX_MIX = 0xc2b2_ae35;
const PRE_STAGE_NAMESPACE = 0x27d4_eb2d;

export interface ProgressionBand {
  readonly startLevel: number;
  readonly endLevel: number;
  readonly width: number;
  readonly height: number;
  readonly pairCount: number;
}

export const PROGRESSION_BANDS: readonly ProgressionBand[] = [
  { startLevel: 1, endLevel: 1, width: 4, height: 4, pairCount: 4 },
  { startLevel: 2, endLevel: 2, width: 4, height: 4, pairCount: 5 },
  { startLevel: 3, endLevel: 3, width: 4, height: 4, pairCount: 6 },
  { startLevel: 4, endLevel: 5, width: 4, height: 5, pairCount: 5 },
  { startLevel: 6, endLevel: 7, width: 4, height: 5, pairCount: 6 },
  { startLevel: 8, endLevel: 10, width: 5, height: 5, pairCount: 7 },
  { startLevel: 11, endLevel: 13, width: 5, height: 5, pairCount: 8 },
  { startLevel: 14, endLevel: 16, width: 5, height: 6, pairCount: 9 },
  { startLevel: 17, endLevel: 20, width: 5, height: 6, pairCount: 11 },
  { startLevel: 21, endLevel: 23, width: 5, height: 7, pairCount: 12 },
  { startLevel: 24, endLevel: 26, width: 6, height: 6, pairCount: 13 },
  { startLevel: 27, endLevel: 30, width: 6, height: 7, pairCount: 15 },
  { startLevel: 31, endLevel: 35, width: 6, height: 7, pairCount: 16 },
  { startLevel: 36, endLevel: 40, width: 6, height: 7, pairCount: 17 },
  { startLevel: 41, endLevel: 50, width: 6, height: 8, pairCount: 18 },
  { startLevel: 51, endLevel: 60, width: 6, height: 8, pairCount: 19 },
  { startLevel: 61, endLevel: 70, width: 6, height: 8, pairCount: 20 },
  { startLevel: 71, endLevel: 85, width: 6, height: 8, pairCount: 21 },
  { startLevel: 86, endLevel: 100, width: 6, height: 8, pairCount: 22 },
];

export interface BlockerPattern {
  readonly levelNumber: number;
  readonly family: "single" | "separated" | "short-wall" | "elbow" | "offset-wall" | "staggered" | "channel" | "asymmetric-walls";
  readonly blockedCells: readonly GridPoint[];
}

export interface StagePrelude {
  readonly width: number;
  readonly height: number;
  readonly pairCount: number;
}

export interface MultiStageLevelPlan {
  readonly levelNumber: number;
  readonly preStages: readonly StagePrelude[];
}

/** Pilot-only preludes. The existing campaign config is always appended as the final stage. */
export const MULTI_STAGE_LEVELS: readonly MultiStageLevelPlan[] = [
  { levelNumber: 21, preStages: [{ width: 5, height: 5, pairCount: 8 }] },
  { levelNumber: 24, preStages: [{ width: 5, height: 6, pairCount: 10 }] },
  { levelNumber: 30, preStages: [
    { width: 4, height: 5, pairCount: 6 },
    { width: 5, height: 6, pairCount: 9 },
  ] },
];

/** Explicit campaign terrain. Coordinates are content data, not runtime placement. */
export const CAMPAIGN_BLOCKERS: readonly BlockerPattern[] = [
  { levelNumber: 11, family: "single", blockedCells: [{ col: 2, row: 2 }] },
  { levelNumber: 12, family: "separated", blockedCells: [{ col: 2, row: 1 }, { col: 2, row: 3 }] },
  { levelNumber: 13, family: "elbow", blockedCells: [{ col: 1, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 2 }] },
  { levelNumber: 16, family: "short-wall", blockedCells: [{ col: 2, row: 2 }, { col: 2, row: 3 }] },
  { levelNumber: 19, family: "elbow", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 2, row: 3 }] },
  { levelNumber: 22, family: "separated", blockedCells: [{ col: 1, row: 2 }, { col: 3, row: 4 }] },
  { levelNumber: 25, family: "short-wall", blockedCells: [{ col: 2, row: 2 }, { col: 3, row: 2 }, { col: 4, row: 2 }] },
  { levelNumber: 28, family: "offset-wall", blockedCells: [{ col: 2, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 4 }] },
  { levelNumber: 30, family: "staggered", blockedCells: [{ col: 1, row: 2 }, { col: 3, row: 3 }, { col: 4, row: 5 }] },
  { levelNumber: 32, family: "short-wall", blockedCells: [{ col: 2, row: 2 }, { col: 2, row: 3 }, { col: 2, row: 4 }] },
  { levelNumber: 34, family: "offset-wall", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 4, row: 4 }] },
  { levelNumber: 36, family: "elbow", blockedCells: [{ col: 2, row: 2 }, { col: 3, row: 2 }, { col: 3, row: 3 }, { col: 3, row: 4 }] },
  { levelNumber: 38, family: "staggered", blockedCells: [{ col: 1, row: 1 }, { col: 2, row: 3 }, { col: 4, row: 5 }] },
  { levelNumber: 40, family: "channel", blockedCells: [{ col: 2, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 4 }, { col: 3, row: 5 }] },
  { levelNumber: 42, family: "short-wall", blockedCells: [{ col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }, { col: 4, row: 3 }] },
  { levelNumber: 44, family: "offset-wall", blockedCells: [{ col: 2, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 5 }] },
  { levelNumber: 46, family: "staggered", blockedCells: [{ col: 1, row: 2 }, { col: 3, row: 3 }, { col: 4, row: 5 }] },
  { levelNumber: 48, family: "elbow", blockedCells: [{ col: 2, row: 2 }, { col: 3, row: 2 }, { col: 3, row: 3 }, { col: 3, row: 4 }] },
  { levelNumber: 50, family: "channel", blockedCells: [{ col: 1, row: 2 }, { col: 1, row: 3 }, { col: 4, row: 4 }, { col: 4, row: 5 }] },
  { levelNumber: 52, family: "offset-wall", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 4, row: 5 }] },
  { levelNumber: 54, family: "staggered", blockedCells: [{ col: 1, row: 1 }, { col: 2, row: 3 }, { col: 4, row: 6 }] },
  { levelNumber: 56, family: "short-wall", blockedCells: [{ col: 2, row: 2 }, { col: 2, row: 3 }, { col: 2, row: 4 }, { col: 2, row: 5 }] },
  { levelNumber: 58, family: "asymmetric-walls", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 4, row: 4 }, { col: 4, row: 5 }] },
  { levelNumber: 60, family: "channel", blockedCells: [{ col: 1, row: 2 }, { col: 1, row: 3 }, { col: 4, row: 4 }, { col: 4, row: 5 }] },
  { levelNumber: 62, family: "offset-wall", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 4, row: 5 }] },
  { levelNumber: 64, family: "staggered", blockedCells: [{ col: 1, row: 1 }, { col: 2, row: 3 }, { col: 4, row: 6 }] },
  { levelNumber: 66, family: "channel", blockedCells: [{ col: 1, row: 2 }, { col: 1, row: 3 }, { col: 4, row: 4 }, { col: 4, row: 5 }] },
  { levelNumber: 68, family: "asymmetric-walls", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 2, row: 3 }, { col: 4, row: 5 }] },
  { levelNumber: 70, family: "channel", blockedCells: [{ col: 1, row: 1 }, { col: 1, row: 2 }, { col: 4, row: 5 }, { col: 4, row: 6 }] },
  { levelNumber: 72, family: "staggered", blockedCells: [{ col: 1, row: 2 }, { col: 3, row: 3 }, { col: 4, row: 5 }] },
  { levelNumber: 74, family: "asymmetric-walls", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 4, row: 4 }, { col: 4, row: 5 }] },
  { levelNumber: 76, family: "channel", blockedCells: [{ col: 1, row: 1 }, { col: 1, row: 2 }, { col: 4, row: 5 }, { col: 4, row: 6 }] },
  { levelNumber: 78, family: "offset-wall", blockedCells: [{ col: 1, row: 3 }, { col: 2, row: 3 }, { col: 4, row: 5 }] },
  { levelNumber: 80, family: "asymmetric-walls", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 5 }, { col: 4, row: 5 }] },
  { levelNumber: 82, family: "staggered", blockedCells: [{ col: 1, row: 1 }, { col: 2, row: 3 }, { col: 4, row: 6 }] },
  { levelNumber: 84, family: "channel", blockedCells: [{ col: 1, row: 2 }, { col: 1, row: 3 }, { col: 4, row: 4 }, { col: 4, row: 5 }] },
  { levelNumber: 86, family: "offset-wall", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 4, row: 5 }] },
  { levelNumber: 88, family: "offset-wall", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 4, row: 5 }] },
  { levelNumber: 90, family: "staggered", blockedCells: [{ col: 1, row: 1 }, { col: 2, row: 3 }, { col: 4, row: 6 }] },
  { levelNumber: 92, family: "offset-wall", blockedCells: [{ col: 1, row: 2 }, { col: 1, row: 3 }, { col: 4, row: 5 }] },
  { levelNumber: 94, family: "offset-wall", blockedCells: [{ col: 1, row: 3 }, { col: 2, row: 3 }, { col: 4, row: 5 }] },
  { levelNumber: 96, family: "offset-wall", blockedCells: [{ col: 1, row: 2 }, { col: 2, row: 2 }, { col: 4, row: 5 }] },
  { levelNumber: 98, family: "staggered", blockedCells: [{ col: 1, row: 1 }, { col: 2, row: 3 }, { col: 4, row: 6 }] },
  { levelNumber: 100, family: "offset-wall", blockedCells: [{ col: 1, row: 2 }, { col: 1, row: 3 }, { col: 4, row: 5 }] },
];

const assertLevelNumber = (levelNumber: number): void => {
  if (!Number.isSafeInteger(levelNumber) || levelNumber < 1 || levelNumber > TOTAL_LEVELS) {
    throw new RangeError(`levelNumber must be an integer from 1 through ${TOTAL_LEVELS}`);
  }
};

/** Maps a one-based campaign level to a stable uint32 seed. */
export const levelSeed = (levelNumber: number): number => {
  assertLevelNumber(levelNumber);
  return Math.imul((levelNumber - 1) >>> 0, SEED_STEP) >>> 0;
};

/** Stable stage-specific uint32 seed namespace, separate from final campaign board seeds. */
export const preStageSeed = (levelNumber: number, preStageIndex: number): number => {
  assertLevelNumber(levelNumber);
  if (!Number.isSafeInteger(preStageIndex) || preStageIndex < 0) {
    throw new RangeError("preStageIndex must be a non-negative integer");
  }
  return (Math.imul(levelNumber, PRE_STAGE_SEED_MIX)
    ^ Math.imul(preStageIndex + 1, PRE_STAGE_INDEX_MIX) ^ PRE_STAGE_NAMESPACE) >>> 0;
};

export const getChapterNumber = (levelNumber: number): number => {
  assertLevelNumber(levelNumber);
  return Math.floor((levelNumber - 1) / LEVELS_PER_CHAPTER) + 1;
};

export const getLevelConfig = (levelNumber: number): GenerationConfig => {
  assertLevelNumber(levelNumber);
  const band = PROGRESSION_BANDS.find(({ startLevel, endLevel }) =>
    levelNumber >= startLevel && levelNumber <= endLevel)!;
  const { width, height, pairCount } = band;
  const blockedCells = CAMPAIGN_BLOCKERS.find((pattern) => pattern.levelNumber === levelNumber)?.blockedCells;
  return { width, height, pairCount, seed: levelSeed(levelNumber), avoidAdjacentMatchingPairs: true, ...(blockedCells === undefined ? {} : { blockedCells }) };
};

export const createLevel = (levelNumber: number): GeneratedLevel => generateLevel(getLevelConfig(levelNumber));

export const getLevelStageConfigs = (levelNumber: number): readonly GenerationConfig[] => {
  assertLevelNumber(levelNumber);
  const preludes = MULTI_STAGE_LEVELS.find((plan) => plan.levelNumber === levelNumber)?.preStages ?? [];
  return [
    ...preludes.map(({ width, height, pairCount }, index) => ({
      width, height, pairCount, seed: preStageSeed(levelNumber, index), avoidAdjacentMatchingPairs: true,
    })),
    getLevelConfig(levelNumber),
  ];
};

export const getStageCount = (levelNumber: number): number => getLevelStageConfigs(levelNumber).length;

export const createLevelStage = (levelNumber: number, stageIndex: number): GeneratedLevel => {
  const configs = getLevelStageConfigs(levelNumber);
  if (!Number.isSafeInteger(stageIndex) || stageIndex < 0 || stageIndex >= configs.length) {
    throw new RangeError(`stageIndex must be an integer from 0 through ${configs.length - 1}`);
  }
  return generateLevel(configs[stageIndex]!);
};

export type StageClearOutcome =
  | { readonly kind: "next-stage"; readonly stageIndex: number }
  | { readonly kind: "level-complete" };

/** Pure campaign-layer decision used after the current one-board stage is cleared. */
export const getStageClearOutcome = (levelNumber: number, stageIndex: number): StageClearOutcome => {
  const count = getStageCount(levelNumber);
  if (!Number.isSafeInteger(stageIndex) || stageIndex < 0 || stageIndex >= count) {
    throw new RangeError(`stageIndex must be an integer from 0 through ${count - 1}`);
  }
  return stageIndex + 1 < count
    ? { kind: "next-stage", stageIndex: stageIndex + 1 }
    : { kind: "level-complete" };
};

export const hasNextLevel = (levelNumber: number): boolean => {
  assertLevelNumber(levelNumber);
  return levelNumber < TOTAL_LEVELS;
};
