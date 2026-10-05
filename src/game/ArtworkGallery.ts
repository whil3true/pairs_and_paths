import type { CampaignProgress } from "../progress/CampaignProgress.js";
import { getChapterNumber } from "./LevelSequence.js";
import { getChapterLevelRange } from "./CampaignNavigation.js";
import { getLevelArtwork, isArtworkUnlocked, LEVEL_ARTWORK } from "./LevelArtwork.js";

export type ArtworkGallerySlotState = "unavailable" | "locked" | "unlocked";

export const getArtworkGallerySlotState = (
  progress: CampaignProgress,
  levelNumber: number,
): ArtworkGallerySlotState => {
  if (getLevelArtwork(levelNumber) === undefined) return "unavailable";
  return isArtworkUnlocked(progress, levelNumber) ? "unlocked" : "locked";
};

export const getUnlockedArtworkCount = (progress: CampaignProgress): number =>
  LEVEL_ARTWORK.filter(({ levelNumber }) => isArtworkUnlocked(progress, levelNumber)).length;

export const getUnlockedArtworkCountInChapter = (progress: CampaignProgress, chapter: number): number => {
  const [first, last] = getChapterLevelRange(chapter);
  return LEVEL_ARTWORK.filter(({ levelNumber }) => levelNumber >= first && levelNumber <= last
    && isArtworkUnlocked(progress, levelNumber)).length;
};

export const getDefaultArtworkGalleryChapter = (progress: CampaignProgress): number => {
  const unlocked = LEVEL_ARTWORK.filter(({ levelNumber }) => isArtworkUnlocked(progress, levelNumber));
  if (unlocked.length === 0) return 1;
  return getChapterNumber(Math.max(...unlocked.map(({ levelNumber }) => levelNumber)));
};
