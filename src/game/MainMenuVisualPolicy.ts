import type { PrimaryMenuAction } from "./CampaignNavigation.js";
import type { UiStrings } from "./Localization.js";
import type { SupportedLocale } from "./Localization.js";
import type { TypographyRole } from "./VisualTokens.js";

export const MAIN_MENU_LAYOUT = Object.freeze({
  logo: Object.freeze({ x: 24, y: 12, width: 432, height: 152 }),
  preview: Object.freeze({ x: 24, y: 194, width: 432, height: 232 }),
  primary: Object.freeze({ x: 24, y: 450, width: 432, height: 64 }),
  secondaryLeft: Object.freeze({ x: 24, y: 530, width: 208, height: 56 }),
  secondaryRight: Object.freeze({ x: 248, y: 530, width: 208, height: 56 }),
  progress: Object.freeze({ x: 24, y: 610, width: 432, height: 104 }),
});

export interface MainMenuBrandLayout {
  readonly titleTop: number;
  readonly titleRole: TypographyRole;
  readonly titleLineHeight: number;
  readonly titleTracking: number;
}

/** Localized text fallback for the production RU/EN PNG logos. */
export const getMainMenuBrandLayout = (_locale: SupportedLocale): MainMenuBrandLayout => Object.freeze({
  titleTop: 75,
  titleRole: "displayBrand",
  titleLineHeight: 44,
  titleTracking: -0.4,
});

export const progressRatio = (completed: number, total: number): number =>
  total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;

export const formatPrimaryMenuAction = (action: PrimaryMenuAction, strings: UiStrings): string => {
  if (action.label === "Play") return strings.play;
  if (action.label === "Continue") return strings.continueLevel(action.levelNumber);
  return strings.playAgainLevel(action.levelNumber);
};
