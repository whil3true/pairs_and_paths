import { getChapterPresentation } from "./ChapterPresentation.js";
import { BORDERS, COMPONENT_RADII, VISUAL_COLORS } from "./VisualTokens.js";

export interface ChapterBannerBounds { readonly x: number; readonly y: number; readonly width: number; readonly height: number; }
export interface BannerMass { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly radius: number; readonly colorRole: "primary" | "secondary" | "accent"; readonly alpha: number; }

/** Normalized, deterministic geometry consumed by the Phaser renderer and pure tests. */
export const getChapterBannerManifest = (chapterNumber: number): readonly BannerMass[] => {
  getChapterPresentation(chapterNumber);
  const shift = ((chapterNumber - 1) % 3) * 0.025;
  return Object.freeze([
    { x: 0.04, y: 0.09, width: 0.56, height: 0.72, radius: 18, colorRole: "primary", alpha: 0.82 },
    { x: 0.48 - shift, y: 0.18, width: 0.48, height: 0.58, radius: 24, colorRole: "secondary", alpha: 0.74 },
    { x: 0.10 + shift, y: 0.70, width: 0.76, height: 0.18, radius: 12, colorRole: "accent", alpha: 0.88 },
    { x: 0.71, y: 0.08 + shift, width: 0.17, height: 0.24, radius: 14, colorRole: "accent", alpha: 0.68 },
  ]);
};

export const createChapterBanner = (
  scene: Phaser.Scene, chapterNumber: number, bounds: ChapterBannerBounds,
): Phaser.GameObjects.Graphics => {
  const presentation = getChapterPresentation(chapterNumber);
  const colors = presentation;
  const graphics = scene.add.graphics()
    .fillStyle(VISUAL_COLORS.surface.card.phaser)
    .fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, COMPONENT_RADII.chapterBanner);
  for (const mass of getChapterBannerManifest(chapterNumber)) {
    graphics.fillStyle(colors[`${mass.colorRole}Color`], mass.alpha).fillRoundedRect(
      bounds.x + mass.x * bounds.width,
      bounds.y + mass.y * bounds.height,
      mass.width * bounds.width,
      mass.height * bounds.height,
      mass.radius,
    );
  }
  graphics.lineStyle(BORDERS.structural, VISUAL_COLORS.border.soft.phaser)
    .strokeRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, COMPONENT_RADII.chapterBanner);
  return graphics;
};
