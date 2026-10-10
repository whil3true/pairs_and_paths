import type { ProgressStore } from "../progress/ProgressStore.js";
import { getPrimaryMenuAction } from "./CampaignNavigation.js";
import { createChapterBanner } from "./ChapterBannerVisual.js";
import { getChapterBannerAsset } from "./ChapterBannerAssets.js";
import { getChapterNumber, TOTAL_LEVELS } from "./LevelSequence.js";
import { configureLogicalCamera } from "./Display.js";
import { DEFAULT_LOCALE, getChapterTitle, getUiStrings, type SupportedLocale } from "./Localization.js";
import { formatMainMenuBrandTitle, formatPrimaryMenuAction, getMainMenuBrandLayout, MAIN_MENU_BRAND_MOTIF, MAIN_MENU_LAYOUT, progressRatio } from "./MainMenuVisualPolicy.js";
import { playStartData } from "./SceneStart.js";
import { createCard, createPrimaryButton, createSecondaryButton, createUiText } from "./UiPrimitives.js";
import { BORDERS, COMPONENT_RADII, VISUAL_COLORS } from "./VisualTokens.js";

export class MainMenuScene extends Phaser.Scene {
  constructor(
    private readonly progressStore: ProgressStore,
    private readonly renderScale = 1,
    private readonly locale: SupportedLocale = DEFAULT_LOCALE,
  ) {
    super({ key: "MainMenuScene" });
  }

  preload(): void {
    const primary = getPrimaryMenuAction(this.progressStore.load());
    const asset = getChapterBannerAsset(getChapterNumber(primary.levelNumber));
    if (!this.textures.exists(asset.assetKey)) this.load.image(asset.assetKey, asset.path);
  }

  create(): void {
    configureLogicalCamera(this, this.renderScale);
    this.cameras.main.setBackgroundColor(VISUAL_COLORS.bg.app.phaser);
    const progress = this.progressStore.load();
    const primary = getPrimaryMenuAction(progress);
    const strings = getUiStrings(this.locale);
    const previewChapter = getChapterNumber(primary.levelNumber);

    const brandLayout = getMainMenuBrandLayout(this.locale);
    createUiText(this, this.renderScale, 240, brandLayout.titleTop, formatMainMenuBrandTitle(strings.brandTitle, this.locale),
      brandLayout.titleRole, { align: "center" }).setLetterSpacing(brandLayout.titleTracking).setOrigin(0.5, 0);
    createUiText(this, this.renderScale, 240, brandLayout.descriptorTop, strings.brandDescriptor,
      brandLayout.descriptorRole, { color: VISUAL_COLORS.text.secondary.hex, align: "center" }).setOrigin(0.5, 0);

    // A quiet reference to the pair-connection mechanic, with no text/image assets or per-frame work.
    for (const x of [MAIN_MENU_BRAND_MOTIF.leftX, MAIN_MENU_BRAND_MOTIF.rightX]) {
      const y = MAIN_MENU_BRAND_MOTIF.y;
      const motif = this.add.graphics();
      motif.lineStyle(2, VISUAL_COLORS.accent.gold.phaser, 0.9)
        .beginPath().moveTo(x - 15, y - 4).lineTo(x, y - 4)
        .lineTo(x, y + 4).lineTo(x + 15, y + 4).strokePath();
      motif.fillStyle(VISUAL_COLORS.surface.card.phaser)
        .fillRoundedRect(x - 20, y - 9, 10, 10, 3)
        .fillRoundedRect(x + 10, y - 1, 10, 10, 3);
      motif.lineStyle(1.5, VISUAL_COLORS.accent.gold.phaser)
        .strokeRoundedRect(x - 20, y - 9, 10, 10, 3)
        .strokeRoundedRect(x + 10, y - 1, 10, 10, 3);
    }

    const preview = MAIN_MENU_LAYOUT.preview;
    createChapterBanner(this, previewChapter, preview, false);
    this.add.graphics().fillStyle(VISUAL_COLORS.surface.elevated.phaser, 0.94)
      .fillRoundedRect(preview.x + 16, preview.y + 16, 112, 38, 12)
      .fillRoundedRect(preview.x + 16, preview.y + preview.height - 64, 250, 48, 12);
    createUiText(this, this.renderScale, preview.x + 32, preview.y + 35,
      strings.chapterLabel(previewChapter), "smallMetadata", { color: VISUAL_COLORS.text.secondary.hex }).setOrigin(0, 0.5);
    createUiText(this, this.renderScale, preview.x + 32, preview.y + preview.height - 40,
      getChapterTitle(this.locale, previewChapter), "levelTitle").setOrigin(0, 0.5);

    const button = MAIN_MENU_LAYOUT.primary;
    createPrimaryButton(this, this.renderScale, {
      x: button.x + button.width / 2, y: button.y + button.height / 2, width: button.width, height: button.height,
      label: formatPrimaryMenuAction(primary, strings),
      onActivate: () => this.scene.start("PlayScene", playStartData(primary.levelNumber)),
    });
    for (const [bounds, label, target] of [
      [MAIN_MENU_LAYOUT.secondaryLeft, strings.levels, "LevelSelectScene"],
      [MAIN_MENU_LAYOUT.secondaryRight, strings.gallery, "ArtworkGalleryScene"],
    ] as const) createSecondaryButton(this, this.renderScale, {
      x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2,
      width: bounds.width, height: bounds.height, label, borderless: true,
      onActivate: () => this.scene.start(target),
    });

    const card = MAIN_MENU_LAYOUT.progress;
    createCard(this, { x: card.x + card.width / 2, y: card.y + card.height / 2, width: card.width, height: card.height, borderRole: "none" });
    const completed = progress.completedThroughLevel;
    createUiText(this, this.renderScale, card.x + 20, card.y + 22,
      completed === TOTAL_LEVELS
        ? strings.collectionComplete(completed, TOTAL_LEVELS)
        : strings.openedProgress(completed, TOTAL_LEVELS), "body");
    const track = { x: card.x + 20, y: card.y + 68, width: card.width - 40, height: 8 };
    const graphics = this.add.graphics().fillStyle(VISUAL_COLORS.divider.phaser)
      .fillRoundedRect(track.x, track.y, track.width, track.height, COMPONENT_RADII.tile);
    const fillWidth = track.width * progressRatio(completed, TOTAL_LEVELS);
    if (fillWidth > 0) graphics.fillStyle(VISUAL_COLORS.accent.gold.phaser)
      .fillRoundedRect(track.x, track.y, fillWidth, track.height, Math.min(4, fillWidth / 2));
    if (completed === TOTAL_LEVELS) {
      graphics.lineStyle(BORDERS.structural, VISUAL_COLORS.state.success.phaser)
        .strokeCircle(card.x + card.width - 28, card.y + 31, 10)
        .beginPath().moveTo(card.x + card.width - 33, card.y + 31)
        .lineTo(card.x + card.width - 29, card.y + 35).lineTo(card.x + card.width - 22, card.y + 27).strokePath();
    }
  }
}
