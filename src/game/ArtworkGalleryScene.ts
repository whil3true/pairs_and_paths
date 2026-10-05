import type { CampaignProgress } from "../progress/CampaignProgress.js";
import type { ProgressStore } from "../progress/ProgressStore.js";
import {
  getArtworkGallerySlotState, getDefaultArtworkGalleryChapter, getUnlockedArtworkCount,
  getUnlockedArtworkCountInChapter,
} from "./ArtworkGallery.js";
import {
  ARTWORK_GALLERY_LAYOUT, ARTWORK_GALLERY_THUMBNAIL, getArtworkGallerySlotBounds, type VisualBounds,
} from "./ArtworkGalleryVisualPolicy.js";
import { getChapterLevelRange } from "./CampaignNavigation.js";
import { configureLogicalCamera } from "./Display.js";
import { CHAPTER_COUNT, LEVELS_PER_CHAPTER, TOTAL_LEVELS } from "./LevelSequence.js";
import { getLevelArtwork, LEVEL_ARTWORK, type LevelArtworkDefinition } from "./LevelArtwork.js";
import { DEFAULT_LOCALE, getChapterTitle, getUiStrings, type SupportedLocale } from "./Localization.js";
import { createCard, createIconButton, createSecondaryButton, createUiText } from "./UiPrimitives.js";
import { BORDERS, COMPONENT_RADII, VISUAL_COLORS } from "./VisualTokens.js";

export interface ArtworkGalleryStartData { readonly chapter?: number; }

const drawThumbnailCornerOcclusion = (
  graphics: Phaser.GameObjects.Graphics, bounds: VisualBounds, radius: number,
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

export class ArtworkGalleryScene extends Phaser.Scene {
  private progress!: CampaignProgress;
  private chapter = 1;
  private content: Phaser.GameObjects.Container | null = null;
  private readonly pendingThumbnails = new Set<string>();
  private readonly failedThumbnails = new Set<string>();

  constructor(
    private readonly progressStore: ProgressStore,
    private readonly renderScale = 1,
    private readonly locale: SupportedLocale = DEFAULT_LOCALE,
  ) { super({ key: "ArtworkGalleryScene" }); }

  create(data: ArtworkGalleryStartData = {}): void {
    configureLogicalCamera(this, this.renderScale);
    this.cameras.main.setBackgroundColor(VISUAL_COLORS.bg.app.phaser);
    this.pendingThumbnails.clear();
    this.failedThumbnails.clear();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyChapterContent());
    this.progress = this.progressStore.load();
    this.chapter = Number.isSafeInteger(data.chapter) && data.chapter! >= 1 && data.chapter! <= CHAPTER_COUNT
      ? data.chapter! : getDefaultArtworkGalleryChapter(this.progress);
    const strings = getUiStrings(this.locale);
    const header = ARTWORK_GALLERY_LAYOUT.header;
    createUiText(this, this.renderScale, header.titleX, header.top, strings.gallery, "screenTitle").setOrigin(0, 0);
    createUiText(this, this.renderScale, header.countX, header.top + 5,
      `${getUnlockedArtworkCount(this.progress)} / ${TOTAL_LEVELS}`, "hudSecondary", {
        color: VISUAL_COLORS.text.secondary.hex, align: "right",
      }).setOrigin(1, 0);
    const back = ARTWORK_GALLERY_LAYOUT.back;
    createSecondaryButton(this, this.renderScale, {
      x: back.x + back.width / 2, y: back.y + back.height / 2, width: back.width, height: back.height,
      label: strings.backToMenu, onActivate: () => this.scene.start("MainMenuScene"),
    });
    this.renderChapter();
  }

  private renderChapter(): void {
    this.destroyChapterContent();
    const strings = getUiStrings(this.locale);
    const objects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(item: T): T => { objects.push(item); return item; };
    this.createArrow(false, this.chapter > 1, objects);
    this.createArrow(true, this.chapter < CHAPTER_COUNT, objects);
    add(createUiText(this, this.renderScale, 240, 94, strings.chapterLabel(this.chapter), "caption", {
      color: VISUAL_COLORS.text.secondary.hex, align: "center",
    }).setOrigin(0.5, 0));
    add(createUiText(this, this.renderScale, 240, 116, getChapterTitle(this.locale, this.chapter), "levelTitle", {
      align: "center",
    }).setOrigin(0.5, 0));

    const [first, last] = getChapterLevelRange(this.chapter);
    for (let level = first; level <= last; level += 1) this.createSlot(level, level - first, objects);

    const progress = ARTWORK_GALLERY_LAYOUT.progress;
    add(createCard(this, { x: progress.x + progress.width / 2, y: progress.y + progress.height / 2,
      width: progress.width, height: progress.height }));
    const opened = getUnlockedArtworkCountInChapter(this.progress, this.chapter);
    add(createUiText(this, this.renderScale, progress.x + 20, progress.y + 20,
      strings.galleryChapterProgress(opened, LEVELS_PER_CHAPTER), "body").setOrigin(0, 0));
    const trackX = progress.x + 20; const trackY = progress.y + 70; const trackWidth = progress.width - 40;
    const track = add(this.add.graphics().fillStyle(VISUAL_COLORS.divider.phaser)
      .fillRoundedRect(trackX, trackY, trackWidth, 8, 4));
    if (opened > 0) track.fillStyle(VISUAL_COLORS.accent.gold.phaser)
      .fillRoundedRect(trackX, trackY, trackWidth * opened / LEVELS_PER_CHAPTER, 8, 4);
    this.content = this.add.container(0, 0, objects);
    this.loadUnlockedChapterThumbnails();
  }

  private createSlot(level: number, index: number, objects: Phaser.GameObjects.GameObject[]): void {
    const strings = getUiStrings(this.locale);
    const bounds = getArtworkGallerySlotBounds(index);
    const x = bounds.x + bounds.width / 2; const y = bounds.y + bounds.height / 2;
    const state = getArtworkGallerySlotState(this.progress, level);
    const artwork = state === "unlocked" ? getLevelArtwork(level) : undefined;
    const loaded = artwork !== undefined && this.textures.exists(artwork.thumbnailAssetKey);
    const failed = artwork !== undefined && this.failedThumbnails.has(artwork.thumbnailAssetKey);
    if (state === "locked" || !loaded) {
      const graphics = this.add.graphics(); objects.push(graphics);
      if (state === "locked") {
        graphics.fillStyle(VISUAL_COLORS.state.lockedFill.phaser).fillRoundedRect(bounds.x, bounds.y, 72, 72, COMPONENT_RADII.levelCard)
          .lineStyle(BORDERS.structural, VISUAL_COLORS.state.locked.phaser).strokeRoundedRect(bounds.x, bounds.y, 72, 72, COMPONENT_RADII.levelCard);
        this.drawLock(graphics, x, y);
      } else {
        graphics.fillStyle(VISUAL_COLORS.surface.card.phaser).fillRoundedRect(bounds.x, bounds.y, 72, 72, COMPONENT_RADII.levelCard);
        if (state === "unavailable") this.drawDashedBorder(graphics, bounds.x, bounds.y, 72, 72);
        else graphics.lineStyle(BORDERS.structural, VISUAL_COLORS.border.soft.phaser)
          .strokeRoundedRect(bounds.x, bounds.y, 72, 72, COMPONENT_RADII.levelCard);
        if (state === "unavailable") this.drawImageGlyph(graphics, x, y - 8, false);
        else if (failed) this.drawImageGlyph(graphics, x, y - 8, true);
        else graphics.lineStyle(3, VISUAL_COLORS.accent.gold.phaser).beginPath().arc(x, y - 7, 8, -1.2, 1.8).strokePath();
      }
    }
    if (loaded && artwork !== undefined) {
      const thumbnail = ARTWORK_GALLERY_THUMBNAIL;
      const image = this.add.image(x, y, artwork.thumbnailAssetKey).setDisplaySize(thumbnail.size, thumbnail.size);
      const cornerOcclusion = this.add.graphics().fillStyle(VISUAL_COLORS.bg.app.phaser);
      drawThumbnailCornerOcclusion(cornerOcclusion, bounds, thumbnail.radius);
      objects.push(image, cornerOcclusion, this.add.graphics()
        .lineStyle(BORDERS.structural, VISUAL_COLORS.border.strong.phaser)
        .strokeRoundedRect(bounds.x, bounds.y, 72, 72, COMPONENT_RADII.levelCard));
    }
    if (!loaded && state !== "locked") objects.push(createUiText(this, this.renderScale, x, y + 17,
      state === "unavailable" ? strings.gallerySoon : failed ? strings.galleryUnavailable : strings.galleryLoading,
      "smallMetadata", { color: VISUAL_COLORS.text.secondary.hex, align: "center" }).setOrigin(0.5));
    objects.push(createUiText(this, this.renderScale, x, bounds.y + ARTWORK_GALLERY_LAYOUT.grid.labelOffset,
      strings.levelLabel(level), "smallMetadata", { color: VISUAL_COLORS.text.secondary.hex, align: "center" }).setOrigin(0.5));
    if (loaded && artwork !== undefined) {
      const hit = this.add.rectangle(x, y, 72, 72, 0, 0).setInteractive({ useHandCursor: true })
        .on("pointerup", () => this.scene.start("ArtworkFullViewScene", { levelNumber: level, returnChapter: this.chapter }));
      objects.push(hit);
    }
  }

  private destroyChapterContent(): void {
    this.content?.destroy(true);
    this.content = null;
  }

  private createArrow(right: boolean, enabled: boolean, objects: Phaser.GameObjects.GameObject[]): void {
    const layout = right ? ARTWORK_GALLERY_LAYOUT.next : ARTWORK_GALLERY_LAYOUT.previous;
    const button = createIconButton(this, this.renderScale, { x: layout.centerX, y: layout.centerY, width: 48, height: 48,
      label: "", disabled: !enabled, onActivate: () => this.navigateChapter(right ? 1 : -1) });
    objects.push(button.container);
    objects.push(this.add.graphics().lineStyle(3, enabled ? VISUAL_COLORS.text.primary.phaser : VISUAL_COLORS.state.locked.phaser)
      .beginPath().moveTo(layout.centerX + (right ? -4 : 4), layout.centerY - 8)
      .lineTo(layout.centerX + (right ? 4 : -4), layout.centerY)
      .lineTo(layout.centerX + (right ? -4 : 4), layout.centerY + 8).strokePath());
  }

  private navigateChapter(delta: number): void { const next = this.chapter + delta; if (next >= 1 && next <= CHAPTER_COUNT) { this.chapter = next; this.renderChapter(); } }
  private drawLock(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.lineStyle(3, VISUAL_COLORS.state.locked.phaser).strokeRoundedRect(x - 12, y - 3, 24, 20, 4)
      .beginPath().arc(x, y - 3, 8, Math.PI, 0).strokePath().fillStyle(VISUAL_COLORS.state.locked.phaser).fillCircle(x, y + 6, 2.5);
  }
  private drawImageGlyph(g: Phaser.GameObjects.Graphics, x: number, y: number, broken: boolean): void {
    g.lineStyle(2, VISUAL_COLORS.text.tertiary.phaser).strokeRoundedRect(x - 13, y - 10, 26, 21, 3)
      .fillStyle(VISUAL_COLORS.text.tertiary.phaser).fillCircle(x + 6, y - 4, 2)
      .beginPath().moveTo(x - 10, y + 7).lineTo(x - 3, y).lineTo(x + 2, y + 5).lineTo(x + 7, y).lineTo(x + 11, y + 5).strokePath();
    if (broken) g.lineStyle(2, VISUAL_COLORS.state.danger.phaser).beginPath().moveTo(x - 15, y - 13).lineTo(x + 15, y + 14).strokePath();
  }
  private drawDashedBorder(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
    g.lineStyle(2, VISUAL_COLORS.border.soft.phaser);
    for (let offset = 14; offset < width - 8; offset += 14) {
      g.beginPath().moveTo(x + offset, y).lineTo(x + Math.min(offset + 7, width - 8), y).strokePath()
        .beginPath().moveTo(x + offset, y + height).lineTo(x + Math.min(offset + 7, width - 8), y + height).strokePath();
    }
    for (let offset = 14; offset < height - 8; offset += 14) {
      g.beginPath().moveTo(x, y + offset).lineTo(x, y + Math.min(offset + 7, height - 8)).strokePath()
        .beginPath().moveTo(x + width, y + offset).lineTo(x + width, y + Math.min(offset + 7, height - 8)).strokePath();
    }
  }

  private loadUnlockedChapterThumbnails(): void {
    const [first, last] = getChapterLevelRange(this.chapter);
    const missing = LEVEL_ARTWORK.filter((artwork) => artwork.levelNumber >= first && artwork.levelNumber <= last
      && getArtworkGallerySlotState(this.progress, artwork.levelNumber) === "unlocked"
      && !this.textures.exists(artwork.thumbnailAssetKey) && !this.pendingThumbnails.has(artwork.thumbnailAssetKey)
      && !this.failedThumbnails.has(artwork.thumbnailAssetKey));
    for (const artwork of missing) this.loadThumbnail(artwork);
    if (missing.length > 0 && !this.load.isLoading()) this.load.start();
  }
  private loadThumbnail(artwork: LevelArtworkDefinition): void {
    const key = artwork.thumbnailAssetKey; const completeEvent = `filecomplete-image-${key}`;
    const onComplete = () => { this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError); this.pendingThumbnails.delete(key); if (this.scene.isActive()) this.renderChapter(); };
    const onError = (file: Phaser.Loader.File) => { if (file.key !== key) return; this.load.off(completeEvent, onComplete); this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, onError); this.pendingThumbnails.delete(key); this.failedThumbnails.add(key); if (this.scene.isActive()) this.renderChapter(); };
    this.pendingThumbnails.add(key); this.load.once(completeEvent, onComplete); this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, onError);
    this.load.image(key, artwork.thumbnailPath);
  }
}
