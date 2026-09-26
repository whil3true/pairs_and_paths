import { generateLevel, type GeneratedLevel, type GenerationConfig } from "../domain/index.js";

export const TOTAL_LEVELS = 100;
export const CHAPTER_COUNT = 10;
export const LEVELS_PER_CHAPTER = 10;

const SEED_STEP = 0x9e37_79b9;

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

export const getChapterNumber = (levelNumber: number): number => {
  assertLevelNumber(levelNumber);
  return Math.floor((levelNumber - 1) / LEVELS_PER_CHAPTER) + 1;
};

export const getLevelConfig = (levelNumber: number): GenerationConfig => {
  assertLevelNumber(levelNumber);
  const band = PROGRESSION_BANDS.find(({ startLevel, endLevel }) =>
    levelNumber >= startLevel && levelNumber <= endLevel)!;
  const { width, height, pairCount } = band;
  return { width, height, pairCount, seed: levelSeed(levelNumber), avoidAdjacentMatchingPairs: true };
};

export const createLevel = (levelNumber: number): GeneratedLevel => generateLevel(getLevelConfig(levelNumber));

export const hasNextLevel = (levelNumber: number): boolean => {
  assertLevelNumber(levelNumber);
  return levelNumber < TOTAL_LEVELS;
};
