import { TOTAL_LEVELS } from "../game/LevelSequence.js";

export interface CampaignProgressV1 {
  readonly version: 1;
  readonly completedThroughLevel: number;
}

export type CampaignProgress = CampaignProgressV1;

export const initialCampaignProgress = (): CampaignProgress => ({
  version: 1,
  completedThroughLevel: 0,
});

export const parseCampaignProgress = (serialized: string): CampaignProgress => {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    return initialCampaignProgress();
  }
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    return initialCampaignProgress();
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1
    || !Number.isSafeInteger(candidate.completedThroughLevel)
    || (candidate.completedThroughLevel as number) < 0
    || (candidate.completedThroughLevel as number) > TOTAL_LEVELS) {
    return initialCampaignProgress();
  }
  return { version: 1, completedThroughLevel: candidate.completedThroughLevel as number };
};

export const serializeCampaignProgress = (progress: CampaignProgress): string => JSON.stringify(progress);

export const recordLevelCompletion = (
  progress: CampaignProgress,
  levelNumber: number,
): CampaignProgress => ({
  version: 1,
  completedThroughLevel: Math.max(progress.completedThroughLevel, levelNumber),
});

export const getHighestUnlockedLevel = (progress: CampaignProgress): number =>
  Math.min(TOTAL_LEVELS, progress.completedThroughLevel + 1);

export const isCampaignCompleted = (progress: CampaignProgress): boolean =>
  progress.completedThroughLevel === TOTAL_LEVELS;

export const getResumeLevel = (progress: CampaignProgress): number =>
  isCampaignCompleted(progress) ? 1 : progress.completedThroughLevel + 1;

export interface StageCompletionResult {
  readonly progress: CampaignProgress;
  readonly shouldSave: boolean;
}

/** Keeps the final-stage persistence boundary testable without constructing a Phaser scene. */
export const recordStageCompletion = (
  progress: CampaignProgress,
  levelNumber: number,
  stageIndex: number,
  stageCount: number,
): StageCompletionResult => stageIndex === stageCount - 1
  ? { progress: recordLevelCompletion(progress, levelNumber), shouldSave: true }
  : { progress, shouldSave: false };
