import {
  getHighestUnlockedLevel, getResumeLevel, isCampaignCompleted, type CampaignProgress,
} from "../progress/CampaignProgress.js";
import {
  CHAPTER_COUNT, getChapterNumber, LEVELS_PER_CHAPTER, TOTAL_LEVELS,
} from "./LevelSequence.js";

export type LevelState = "completed" | "available" | "locked";

export interface PrimaryMenuAction {
  readonly label: "Play" | "Continue" | "Play again";
  readonly levelNumber: number;
}

export const getPrimaryMenuAction = (progress: CampaignProgress): PrimaryMenuAction => {
  if (isCampaignCompleted(progress)) return { label: "Play again", levelNumber: 1 };
  return {
    label: progress.completedThroughLevel === 0 ? "Play" : "Continue",
    levelNumber: getResumeLevel(progress),
  };
};

export const getLevelState = (progress: CampaignProgress, levelNumber: number): LevelState => {
  if (!Number.isSafeInteger(levelNumber) || levelNumber < 1 || levelNumber > TOTAL_LEVELS) {
    throw new RangeError(`levelNumber must be an integer from 1 through ${TOTAL_LEVELS}`);
  }
  if (levelNumber <= progress.completedThroughLevel) return "completed";
  return levelNumber === progress.completedThroughLevel + 1 ? "available" : "locked";
};

export const isLevelSelectable = (progress: CampaignProgress, levelNumber: number): boolean =>
  getLevelState(progress, levelNumber) !== "locked";

export const getDefaultChapter = (progress: CampaignProgress): number =>
  getChapterNumber(getHighestUnlockedLevel(progress));

export const getChapterLevelRange = (chapterNumber: number): readonly [number, number] => {
  if (!Number.isSafeInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > CHAPTER_COUNT) {
    throw new RangeError(`chapterNumber must be an integer from 1 through ${CHAPTER_COUNT}`);
  }
  const first = (chapterNumber - 1) * LEVELS_PER_CHAPTER + 1;
  return [first, first + LEVELS_PER_CHAPTER - 1];
};
