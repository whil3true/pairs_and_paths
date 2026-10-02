import type { PrimaryMenuAction } from "./CampaignNavigation.js";
import type { UiStrings } from "./Localization.js";
import type { SupportedLocale } from "./Localization.js";
import type { TypographyRole } from "./VisualTokens.js";

export const MAIN_MENU_LAYOUT = Object.freeze({
  preview: Object.freeze({ x: 24, y: 124, width: 432, height: 232 }),
  primary: Object.freeze({ x: 24, y: 380, width: 432, height: 64 }),
  secondaryLeft: Object.freeze({ x: 24, y: 460, width: 208, height: 56 }),
  secondaryRight: Object.freeze({ x: 248, y: 460, width: 208, height: 56 }),
  progress: Object.freeze({ x: 24, y: 540, width: 432, height: 104 }),
});

export interface MainMenuBrandLayout {
  readonly titleTops: readonly number[];
  readonly titleRole: TypographyRole;
  readonly titleLineHeight: number;
  readonly taglineTop: number | null;
  readonly taglineLineHeight: number;
}

/** Explicit bilingual composition; Russian omits the optional tagline rather than overlapping it. */
export const getMainMenuBrandLayout = (locale: SupportedLocale): MainMenuBrandLayout => locale === "ru"
  ? Object.freeze({ titleTops: [28, 62], titleRole: "screenTitle", titleLineHeight: 36, taglineTop: null, taglineLineHeight: 20 })
  : Object.freeze({ titleTops: [28], titleRole: "displayBrand", titleLineHeight: 42, taglineTop: 82, taglineLineHeight: 20 });

export const progressRatio = (completed: number, total: number): number =>
  total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;

export const formatPrimaryMenuAction = (action: PrimaryMenuAction, strings: UiStrings): string => {
  if (action.label === "Play") return strings.play;
  if (action.label === "Continue") return strings.continueLevel(action.levelNumber);
  return strings.playAgainLevel(action.levelNumber);
};
