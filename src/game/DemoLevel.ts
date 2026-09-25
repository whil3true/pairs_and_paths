import { generateLevel, type GeneratedLevel, type GenerationConfig } from "../domain/index.js";

/** ASCII "PAIR"; owned by the prototype rather than the generator API. */
export const DEV_DEMO_SEED = 0x5041_4952;

export const DEV_DEMO_CONFIG: GenerationConfig = {
  width: 6,
  height: 8,
  pairCount: 24,
  seed: DEV_DEMO_SEED,
};

export const createDemoLevel = (): GeneratedLevel => generateLevel(DEV_DEMO_CONFIG);
