import { generateLevel, type GeneratedLevel, type GenerationConfig } from "../domain/index.js";

export const DEV_DEMO_SEED = 0x0000_0000;

export const DEV_DEMO_CONFIG: GenerationConfig = {
  width: 6,
  height: 8,
  pairCount: 20,
  seed: DEV_DEMO_SEED,
  avoidAdjacentMatchingPairs: true,
};

export const createDemoLevel = (): GeneratedLevel => generateLevel(DEV_DEMO_CONFIG);
