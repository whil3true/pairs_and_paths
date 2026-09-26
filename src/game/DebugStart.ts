import { getStageCount, TOTAL_LEVELS } from "./LevelSequence.js";

export interface DebugStartPosition {
  readonly levelNumber: number;
  readonly stageIndex: number;
}

const parseInteger = (value: string | null): number | null => {
  if (value === null || !/^-?\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

/** Parses the developer-only campaign start position from a URL query string. */
export const parseDebugStart = (search: string): DebugStartPosition | null => {
  const params = new URLSearchParams(search);
  if (params.get("debug") !== "1") return null;

  const levelNumber = parseInteger(params.get("level"));
  if (levelNumber === null || levelNumber < 1 || levelNumber > TOTAL_LEVELS) return null;

  const requestedStage = parseInteger(params.get("stage"));
  const stageIndex = requestedStage !== null
    && requestedStage >= 1
    && requestedStage <= getStageCount(levelNumber)
    ? requestedStage - 1
    : 0;
  return { levelNumber, stageIndex };
};
