import type { SupportedLocale } from "./Localization.js";

/** Shared current language for Phaser scenes constructed once at game bootstrap. */
let activeLocale: SupportedLocale | null = null;
export const configureUiLocale = (value: SupportedLocale): void => { activeLocale = value; };
export const getActiveUiLocale = (fallback: SupportedLocale): SupportedLocale => activeLocale ?? fallback;
