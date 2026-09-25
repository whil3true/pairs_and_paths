import { generateLevel, type GeneratedLevel, type GenerationConfig } from "../domain/index.js";

export const TOTAL_LEVELS = 100;
export const CHAPTER_COUNT = 10;
export const LEVELS_PER_CHAPTER = 10;

const SEED_STEP = 0x9e37_79b9;

export interface ChapterProfile {
  readonly width: number;
  readonly height: number;
  readonly pairCount: number;
}

export const CHAPTER_PROFILES: readonly ChapterProfile[] = [
  { width: 4, height: 4, pairCount: 4 },
  { width: 4, height: 5, pairCount: 5 },
  { width: 5, height: 5, pairCount: 7 },
  { width: 5, height: 6, pairCount: 9 },
  { width: 5, height: 6, pairCount: 11 },
  { width: 5, height: 7, pairCount: 12 },
  { width: 6, height: 6, pairCount: 13 },
  { width: 6, height: 7, pairCount: 15 },
  { width: 6, height: 8, pairCount: 18 },
  { width: 6, height: 8, pairCount: 22 },
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
  const profile = CHAPTER_PROFILES[getChapterNumber(levelNumber) - 1]!;
  return { ...profile, seed: levelSeed(levelNumber), avoidAdjacentMatchingPairs: true };
};

export const createLevel = (levelNumber: number): GeneratedLevel => generateLevel(getLevelConfig(levelNumber));

export const hasNextLevel = (levelNumber: number): boolean => {
  assertLevelNumber(levelNumber);
  return levelNumber < TOTAL_LEVELS;
};
