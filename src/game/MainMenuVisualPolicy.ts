import type { PrimaryMenuAction } from "./CampaignNavigation.js";
import type { UiStrings } from "./Localization.js";
import type { SupportedLocale } from "./Localization.js";
import type { TypographyRole } from "./VisualTokens.js";

/** Small static paired-tile ornaments alongside the mechanic descriptor, not part of hit geometry. */
export const MAIN_MENU_BRAND_MOTIF = Object.freeze({ leftX: 143, rightX: 337, y: 92 });

export const MAIN_MENU_LAYOUT = Object.freeze({
  preview: Object.freeze({ x: 24, y: 124, width: 432, height: 232 }),
  primary: Object.freeze({ x: 24, y: 380, width: 432, height: 64 }),
  secondaryLeft: Object.freeze({ x: 24, y: 460, width: 208, height: 56 }),
  secondaryRight: Object.freeze({ x: 248, y: 460, width: 208, height: 56 }),
  progress: Object.freeze({ x: 24, y: 540, width: 432, height: 104 }),
});

export interface MainMenuBrandLayout {
  readonly titleTop: number;
  readonly titleRole: TypographyRole;
  readonly titleLineHeight: number;
  readonly titleTracking: number;
  readonly descriptorTop: number;
  readonly descriptorRole: TypographyRole;
  readonly descriptorLineHeight: number;
}

/** Locked naming system: short visual brand plus mechanic descriptor in both locales. */
export const getMainMenuBrandLayout = (_locale: SupportedLocale): MainMenuBrandLayout => Object.freeze({
  titleTop: 28,
  titleRole: "displayBrand",
  titleLineHeight: 44,
  titleTracking: -0.4,
  descriptorTop: 82,
  descriptorRole: "brandDescriptor",
  descriptorLineHeight: 20,
});

export const progressRatio = (completed: number, total: number): number =>
  total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;

export const formatPrimaryMenuAction = (action: PrimaryMenuAction, strings: UiStrings): string => {
  if (action.label === "Play") return strings.play;
  if (action.label === "Continue") return strings.continueLevel(action.levelNumber);
  return strings.playAgainLevel(action.levelNumber);
};
