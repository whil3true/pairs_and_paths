import { getChapterPresentation } from "./ChapterPresentation.js";
import { getChapterBannerAsset } from "./ChapterBannerAssets.js";
import { BORDERS, COMPONENT_RADII, VISUAL_COLORS } from "./VisualTokens.js";

export interface ChapterBannerBounds { readonly x: number; readonly y: number; readonly width: number; readonly height: number; }
export const CHAPTER_BANNER_ASPECT_RATIO = 432 / 164;

/** Returns the largest centered chapter-banner rectangle contained by the destination. */
export const computeContainedChapterBannerPlacement = (destination: ChapterBannerBounds): ChapterBannerBounds => {
  if ([destination.x, destination.y, destination.width, destination.height]
    .some((value) => !Number.isFinite(value))) {
    throw new RangeError("Chapter banner destination values must be finite numbers");
  }
  if (destination.width <= 0 || destination.height <= 0) {
    throw new RangeError("Chapter banner destination dimensions must be positive finite numbers");
  }
  const width = Math.min(destination.width, destination.height * CHAPTER_BANNER_ASPECT_RATIO);
  const height = width / CHAPTER_BANNER_ASPECT_RATIO;
  return {
    x: destination.x + (destination.width - width) / 2,
    y: destination.y + (destination.height - height) / 2,
    width,
    height,
  };
};

export type ChapterBannerElement =
  | Readonly<{ kind: "innerTint"; inset: number; radius: number; colorRole: "primary"; alpha: number }>
  | Readonly<{ kind: "leftRail"; inset: number; width: number; radius: number; colorRole: "primary"; alpha: number }>
  | Readonly<{ kind: "bottomRail"; inset: number; height: number; radius: number; colorRole: "accent"; alpha: number }>
  | Readonly<{ kind: "cornerChip"; top: number; right: number; width: number; height: number; radius: number; colorRole: "secondary"; alpha: number }>;

/** Deterministic procedural geometry used only when a production banner texture is unavailable. */
export const getChapterBannerFallbackManifest = (chapterNumber: number): readonly ChapterBannerElement[] => {
  getChapterPresentation(chapterNumber);
  return Object.freeze([
    { kind: "innerTint", inset: 16, radius: 16, colorRole: "primary", alpha: 0.10 },
    { kind: "leftRail", inset: 16, width: 10, radius: 5, colorRole: "primary", alpha: 0.84 },
    { kind: "bottomRail", inset: 16, height: 10, radius: 5, colorRole: "accent", alpha: 0.84 },
    { kind: "cornerChip", top: 16, right: 16, width: 72, height: 26, radius: 10, colorRole: "secondary", alpha: 0.78 },
  ]);
};

export const createChapterBanner = (
  scene: Phaser.Scene, chapterNumber: number, bounds: ChapterBannerBounds,
): Phaser.GameObjects.Container | Phaser.GameObjects.Graphics => {
  const asset = getChapterBannerAsset(chapterNumber);
  if (scene.textures.exists(asset.assetKey)) {
    const placement = computeContainedChapterBannerPlacement(bounds);
    const shell = scene.add.graphics().fillStyle(VISUAL_COLORS.surface.card.phaser)
      .fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, COMPONENT_RADII.chapterBanner);
    const image = scene.add.image(placement.x, placement.y, asset.assetKey).setOrigin(0)
      .setDisplaySize(placement.width, placement.height);
    const border = scene.add.graphics().lineStyle(BORDERS.structural, VISUAL_COLORS.border.soft.phaser)
      .strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, COMPONENT_RADII.chapterBanner);
    return scene.add.container(0, 0, [shell, image, border]);
  }
  const presentation = getChapterPresentation(chapterNumber);
  const colors = presentation;
  const graphics = scene.add.graphics()
    .fillStyle(VISUAL_COLORS.surface.card.phaser)
    .fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, COMPONENT_RADII.chapterBanner);
  for (const element of getChapterBannerFallbackManifest(chapterNumber)) {
    graphics.fillStyle(colors[`${element.colorRole}Color`], element.alpha);
    if (element.kind === "innerTint") graphics.fillRoundedRect(
      bounds.x + element.inset, bounds.y + element.inset,
      bounds.width - element.inset * 2, bounds.height - element.inset * 2, element.radius,
    );
    else if (element.kind === "leftRail") graphics.fillRoundedRect(
      bounds.x + element.inset, bounds.y + element.inset,
      element.width, bounds.height - element.inset * 2, element.radius,
    );
    else if (element.kind === "bottomRail") graphics.fillRoundedRect(
      bounds.x + element.inset, bounds.y + bounds.height - element.inset - element.height,
      bounds.width - element.inset * 2, element.height, element.radius,
    );
    else graphics.fillRoundedRect(
      bounds.x + bounds.width - element.right - element.width, bounds.y + element.top,
      element.width, element.height, element.radius,
    );
  }
  graphics.lineStyle(BORDERS.structural, VISUAL_COLORS.border.soft.phaser)
    .strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, COMPONENT_RADII.chapterBanner);
  return graphics;
};
