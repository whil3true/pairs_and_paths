import { DEFAULT_LOCALE, type SupportedLocale } from "../game/Localization.js";

export const UI_LOCALE_STORAGE_KEY = "pairs-and-paths:ui-locale";
type LocaleStorage = Pick<Storage, "getItem" | "setItem">;

export class WebLocaleStore {
  constructor(
    private readonly getStorage: () => LocaleStorage | null =
      () => typeof localStorage !== "undefined" ? localStorage : null,
  ) {}

  load(): SupportedLocale | null {
    try {
      const saved = this.getStorage()?.getItem(UI_LOCALE_STORAGE_KEY);
      return saved === "ru" || saved === "en" ? saved : null;
    } catch {
      return null;
    }
  }

  /** Returns false if storage is unavailable; never claim a persisted change then. */
  save(locale: SupportedLocale): boolean {
    try {
      const storage = this.getStorage();
      if (!storage) return false;
      storage.setItem(UI_LOCALE_STORAGE_KEY, locale);
      return true;
    } catch {
      return false;
    }
  }
}

/** Explicit developer locale overrides saved preferences, not vice versa. */
export const resolveStartupLocale = (
  search: string, storedLocale: SupportedLocale | null, platformLanguage?: string,
): SupportedLocale => {
  const params = new URLSearchParams(search);
  const debugOverride = params.get("debug") === "1" ? params.get("locale") : null;
  if (debugOverride === "ru" || debugOverride === "en") return debugOverride;
  // Respect a manually saved language. On Yandex, an unsupported portal
  // language uses English as the available international fallback.
  const sdkLanguage = platformLanguage?.trim().toLowerCase().split(/[-_]/, 1)[0];
  const sdkLocale = sdkLanguage === "ru" ? "ru" : sdkLanguage ? "en" : null;
  return storedLocale ?? sdkLocale ?? DEFAULT_LOCALE;
};
