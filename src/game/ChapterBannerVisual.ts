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

const PLACEMENT_EPSILON = 0.001;

/** Whether a production image reaches every edge of its rounded destination shell. */
export const shouldOccludeChapterBannerCorners = (
  destination: ChapterBannerBounds, placement: ChapterBannerBounds,
): boolean => Math.abs(placement.x - destination.x) <= PLACEMENT_EPSILON
  && Math.abs(placement.y - destination.y) <= PLACEMENT_EPSILON
  && Math.abs(placement.x + placement.width - destination.x - destination.width) <= PLACEMENT_EPSILON
  && Math.abs(placement.y + placement.height - destination.y - destination.height) <= PLACEMENT_EPSILON;

const drawChapterBannerCornerOcclusion = (
  graphics: Phaser.GameObjects.Graphics, bounds: ChapterBannerBounds, radius: number,
): void => {
  const left = bounds.x;
  const top = bounds.y;
  const right = left + bounds.width;
  const bottom = top + bounds.height;

  graphics.beginPath().moveTo(left, top).lineTo(left + radius, top)
    .arc(left + radius, top + radius, radius, -Math.PI / 2, -Math.PI, true).closePath().fillPath();
  graphics.beginPath().moveTo(right, top).lineTo(right - radius, top)
    .arc(right - radius, top + radius, radius, -Math.PI / 2, 0).closePath().fillPath();
  graphics.beginPath().moveTo(right, bottom).lineTo(right, bottom - radius)
    .arc(right - radius, bottom - radius, radius, 0, Math.PI / 2).closePath().fillPath();
  graphics.beginPath().moveTo(left, bottom).lineTo(left + radius, bottom)
    .arc(left + radius, bottom - radius, radius, Math.PI / 2, Math.PI).closePath().fillPath();
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
  scene: Phaser.Scene, chapterNumber: number, bounds: ChapterBannerBounds, showBorder = true,
): Phaser.GameObjects.Container | Phaser.GameObjects.Graphics => {
  const asset = getChapterBannerAsset(chapterNumber);
  if (scene.textures.exists(asset.assetKey)) {
    const placement = computeContainedChapterBannerPlacement(bounds);
    const shell = scene.add.graphics().fillStyle(VISUAL_COLORS.surface.card.phaser)
      .fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, COMPONENT_RADII.chapterBanner);
    const image = scene.add.image(placement.x, placement.y, asset.assetKey).setOrigin(0)
      .setDisplaySize(placement.width, placement.height);
    const cornerOcclusion = shouldOccludeChapterBannerCorners(bounds, placement)
      ? scene.add.graphics().fillStyle(VISUAL_COLORS.bg.app.phaser)
      : null;
    if (cornerOcclusion) drawChapterBannerCornerOcclusion(
      cornerOcclusion, bounds, COMPONENT_RADII.chapterBanner,
    );
    const border = showBorder
      ? scene.add.graphics().lineStyle(BORDERS.structural, VISUAL_COLORS.border.soft.phaser)
        .strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, COMPONENT_RADII.chapterBanner)
      : null;
    return scene.add.container(0, 0, [
      shell, image, ...(cornerOcclusion ? [cornerOcclusion] : []), ...(border ? [border] : []),
    ]);
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
  if (showBorder) graphics.lineStyle(BORDERS.structural, VISUAL_COLORS.border.soft.phaser)
    .strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, COMPONENT_RADII.chapterBanner);
  return graphics;
};
