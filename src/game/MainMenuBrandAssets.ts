import type { SupportedLocale } from "./Localization.js";

export interface MainMenuBrandAsset {
  readonly assetKey: string;
  readonly path: string;
}

export const MAIN_MENU_BRAND_ASSETS: Readonly<Record<SupportedLocale, MainMenuBrandAsset>> = Object.freeze({
  ru: Object.freeze({ assetKey: "brand-logo-ru", path: "assets/brand/brand-logo-ru.png" }),
  en: Object.freeze({ assetKey: "brand-logo-en", path: "assets/brand/brand-logo-en.png" }),
});

export const getMainMenuBrandAsset = (locale: SupportedLocale): MainMenuBrandAsset =>
  MAIN_MENU_BRAND_ASSETS[locale];

export interface BrandBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Contain without upscaling beyond the intended authored box; retain image proportions. */
export const computeMainMenuBrandPlacement = (
  sourceWidth: number, sourceHeight: number, bounds: BrandBounds,
): BrandBounds => {
  const values = [sourceWidth, sourceHeight, bounds.x, bounds.y, bounds.width, bounds.height];
  if (!values.every(Number.isFinite) || sourceWidth <= 0 || sourceHeight <= 0 ||
      bounds.width <= 0 || bounds.height <= 0) {
    throw new RangeError("Brand texture and layout dimensions must be finite and positive");
  }
  const scale = Math.min(bounds.width / sourceWidth, bounds.height / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return Object.freeze({
    x: bounds.x + (bounds.width - width) / 2,
    y: bounds.y + (bounds.height - height) / 2,
    width,
    height,
  });
};
