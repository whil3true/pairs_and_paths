import type { ProgressStore } from "../progress/ProgressStore.js";
import { ARTWORK_FULL_VIEW_LAYOUT } from "./ArtworkGalleryVisualPolicy.js";
import { configureLogicalCamera } from "./Display.js";
import { CHAPTER_COUNT, getChapterNumber } from "./LevelSequence.js";
import { getLevelArtwork, isArtworkUnlocked, type LevelArtworkDefinition } from "./LevelArtwork.js";
import { DEFAULT_LOCALE, getChapterTitle, getUiStrings, type SupportedLocale } from "./Localization.js";
import { createIconButton, createUiText } from "./UiPrimitives.js";
import { BORDERS, COMPONENT_RADII, VISUAL_COLORS } from "./VisualTokens.js";

interface ArtworkFullViewStartData { readonly levelNumber?: number; readonly returnChapter?: number; }

export class ArtworkFullViewScene extends Phaser.Scene {
  private artwork: LevelArtworkDefinition | undefined;
  private levelNumber = 0;
  private returnChapter = 1;
  private allowed = false;
  private loadingPresentation: Phaser.GameObjects.Container | null = null;

  constructor(
    private readonly progressStore: ProgressStore,
    private readonly renderScale = 1,
    private readonly locale: SupportedLocale = DEFAULT_LOCALE,
  ) { super({ key: "ArtworkFullViewScene" }); }

  init(data: ArtworkFullViewStartData = {}): void {
    this.levelNumber = Number.isSafeInteger(data.levelNumber) ? data.levelNumber! : 0;
    this.artwork = getLevelArtwork(this.levelNumber);
    this.allowed = this.artwork !== undefined && isArtworkUnlocked(this.progressStore.load(), this.levelNumber);
    const canonicalChapter = this.artwork === undefined ? 1 : getChapterNumber(this.artwork.levelNumber);
    this.returnChapter = Number.isSafeInteger(data.returnChapter) && data.returnChapter! >= 1 && data.returnChapter! <= CHAPTER_COUNT
      ? data.returnChapter! : canonicalChapter;
  }

  preload(): void {
    if (this.allowed && this.artwork !== undefined && !this.textures.exists(this.artwork.fullAssetKey)) {
      configureLogicalCamera(this, this.renderScale);
      this.cameras.main.setBackgroundColor(VISUAL_COLORS.bg.app.phaser);
      this.loadingPresentation = this.renderPresentation("loading");
      this.load.image(this.artwork.fullAssetKey, this.artwork.fullPath);
    }
  }

  create(): void {
    this.loadingPresentation?.destroy(true); this.loadingPresentation = null;
    configureLogicalCamera(this, this.renderScale);
    this.cameras.main.setBackgroundColor(VISUAL_COLORS.bg.app.phaser);
    const loaded = this.allowed && this.artwork !== undefined && this.textures.exists(this.artwork.fullAssetKey);
    this.renderPresentation(loaded ? "artwork" : "unavailable");
  }

  private renderPresentation(state: "loading" | "artwork" | "unavailable"): Phaser.GameObjects.Container {
    const strings = getUiStrings(this.locale); const objects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(item: T): T => { objects.push(item); return item; };
    const back = ARTWORK_FULL_VIEW_LAYOUT.back;
    const backButton = createIconButton(this, this.renderScale, {
      x: back.x + back.width / 2, y: back.y + back.height / 2, width: back.width, height: back.height,
      label: "", onActivate: () => this.scene.start("ArtworkGalleryScene", { chapter: this.returnChapter }),
    });
    backButton.container.setName(strings.back); add(backButton.container);
    add(this.add.graphics().lineStyle(3, VISUAL_COLORS.text.primary.phaser).beginPath()
      .moveTo(52, 36).lineTo(44, 44).lineTo(52, 52).strokePath());
    const title = this.levelNumber > 0 ? strings.levelLabel(this.levelNumber) : strings.galleryUnavailable;
    add(createUiText(this, this.renderScale, 240, 28, title, "screenTitle", { align: "center" }).setOrigin(0.5, 0));
    if (this.artwork !== undefined) {
      const chapter = getChapterNumber(this.artwork.levelNumber);
      add(createUiText(this, this.renderScale, 240, 72,
        strings.chapterHeader(chapter, getChapterTitle(this.locale, chapter)), "caption", {
          color: VISUAL_COLORS.text.secondary.hex, align: "center",
        }).setOrigin(0.5, 0));
    }
    const frame = ARTWORK_FULL_VIEW_LAYOUT.artwork;
    const graphics = add(this.add.graphics().fillStyle(VISUAL_COLORS.surface.card.phaser)
      .fillRoundedRect(frame.x, frame.y, frame.width, frame.height, COMPONENT_RADII.chapterBanner));
    if (state === "artwork" && this.artwork !== undefined) {
      const maskShape = add(this.add.graphics().fillStyle(0xffffff).fillRoundedRect(
        frame.x, frame.y, frame.width, frame.height, COMPONENT_RADII.chapterBanner).setVisible(false));
      const image = add(this.add.image(frame.x + frame.width / 2, frame.y + frame.height / 2, this.artwork.fullAssetKey)
        .setDisplaySize(frame.width, frame.height));
      image.setMask(maskShape.createGeometryMask());
      add(this.add.graphics().lineStyle(BORDERS.emphasized, VISUAL_COLORS.accent.gold.phaser)
        .strokeRoundedRect(frame.x, frame.y, frame.width, frame.height, COMPONENT_RADII.chapterBanner));
    } else {
      graphics.lineStyle(BORDERS.structural, VISUAL_COLORS.border.soft.phaser)
        .strokeRoundedRect(frame.x, frame.y, frame.width, frame.height, COMPONENT_RADII.chapterBanner);
      if (state === "loading") graphics.lineStyle(4, VISUAL_COLORS.accent.gold.phaser).beginPath()
        .arc(240, 338, 18, -1.2, 1.8).strokePath();
      else this.drawUnavailableGlyph(graphics, 240, 330);
      add(createUiText(this, this.renderScale, 240, 372,
        state === "loading" ? strings.artworkLoading : strings.artworkUnavailable, "body", {
          color: VISUAL_COLORS.text.secondary.hex, align: "center",
        }).setOrigin(0.5));
    }
    return this.add.container(0, 0, objects);
  }

  private drawUnavailableGlyph(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    graphics.lineStyle(3, VISUAL_COLORS.text.tertiary.phaser).strokeRoundedRect(x - 28, y - 22, 56, 44, 6)
      .fillStyle(VISUAL_COLORS.text.tertiary.phaser).fillCircle(x + 13, y - 10, 4)
      .beginPath().moveTo(x - 23, y + 16).lineTo(x - 8, y).lineTo(x + 2, y + 10)
      .lineTo(x + 12, y).lineTo(x + 23, y + 13).strokePath();
  }
}
