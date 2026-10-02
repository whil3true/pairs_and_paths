import type { PrimaryMenuAction } from "./CampaignNavigation.js";
import type { UiStrings } from "./Localization.js";

export const MAIN_MENU_LAYOUT = Object.freeze({
  preview: Object.freeze({ x: 24, y: 124, width: 432, height: 232 }),
  primary: Object.freeze({ x: 24, y: 380, width: 432, height: 64 }),
  secondaryLeft: Object.freeze({ x: 24, y: 460, width: 208, height: 56 }),
  secondaryRight: Object.freeze({ x: 248, y: 460, width: 208, height: 56 }),
  progress: Object.freeze({ x: 24, y: 540, width: 432, height: 104 }),
});

export const progressRatio = (completed: number, total: number): number =>
  total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;

export const formatPrimaryMenuAction = (action: PrimaryMenuAction, strings: UiStrings): string => {
  if (action.label === "Play") return strings.play;
  if (action.label === "Continue") return strings.continueLevel(action.levelNumber);
  return strings.playAgainLevel(action.levelNumber);
};
