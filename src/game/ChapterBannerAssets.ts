import { CHAPTER_COUNT } from "./LevelSequence.js";

export interface ChapterBannerAssetDefinition {
  readonly chapterNumber: number;
  readonly assetKey: string;
  readonly path: string;
}

export const CHAPTER_BANNER_ASSETS: readonly ChapterBannerAssetDefinition[] = Object.freeze([
  { chapterNumber: 1, assetKey: "chapter-banner-01", path: "assets/chapter-banners/chapter-banner-01-morning-home.webp" },
  { chapterNumber: 2, assetKey: "chapter-banner-02", path: "assets/chapter-banners/chapter-banner-02-tea-baking.webp" },
  { chapterNumber: 3, assetKey: "chapter-banner-03", path: "assets/chapter-banners/chapter-banner-03-flower-shops.webp" },
  { chapterNumber: 4, assetKey: "chapter-banner-04", path: "assets/chapter-banners/chapter-banner-04-books-letters.webp" },
  { chapterNumber: 5, assetKey: "chapter-banner-05", path: "assets/chapter-banners/chapter-banner-05-gardens-courtyards.webp" },
  { chapterNumber: 6, assetKey: "chapter-banner-06", path: "assets/chapter-banners/chapter-banner-06-by-the-sea.webp" },
  { chapterNumber: 7, assetKey: "chapter-banner-07", path: "assets/chapter-banners/chapter-banner-07-roads-stations.webp" },
  { chapterNumber: 8, assetKey: "chapter-banner-08", path: "assets/chapter-banners/chapter-banner-08-autumn-lights.webp" },
  { chapterNumber: 9, assetKey: "chapter-banner-09", path: "assets/chapter-banners/chapter-banner-09-winter-windows.webp" },
  { chapterNumber: 10, assetKey: "chapter-banner-10", path: "assets/chapter-banners/chapter-banner-10-quiet-magic.webp" },
]);

export const getChapterBannerAsset = (chapterNumber: number): ChapterBannerAssetDefinition => {
  if (!Number.isSafeInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > CHAPTER_COUNT) {
    throw new RangeError(`chapterNumber must be an integer from 1 through ${CHAPTER_COUNT}`);
  }
  return CHAPTER_BANNER_ASSETS[chapterNumber - 1]!;
};
