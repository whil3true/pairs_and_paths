import { generateLevel, type GeneratedLevel, type GenerationConfig } from "../domain/index.js";

const SEED_STEP = 0x9e37_79b9;

const assertLevelNumber = (levelNumber: number): void => {
  if (!Number.isSafeInteger(levelNumber) || levelNumber < 1 || levelNumber > 0x1_0000_0000) {
    throw new RangeError("levelNumber must be an integer from 1 through 2^32");
  }
};

/**
 * Maps the one-based level number to a stable uint32 seed. Multiplication by
 * an odd constant is a permutation modulo 2^32; this is content sequencing,
 * not a cryptographic uniqueness guarantee.
 */
export const levelSeed = (levelNumber: number): number => {
  assertLevelNumber(levelNumber);
  return Math.imul((levelNumber - 1) >>> 0, SEED_STEP) >>> 0;
};

/** The provisional product profile is intentionally constant across levels. */
export const getLevelConfig = (levelNumber: number): GenerationConfig => ({
  width: 6,
  height: 8,
  pairCount: 20,
  seed: levelSeed(levelNumber),
  avoidAdjacentMatchingPairs: true,
});

export const createLevel = (levelNumber: number): GeneratedLevel =>
  generateLevel(getLevelConfig(levelNumber));
