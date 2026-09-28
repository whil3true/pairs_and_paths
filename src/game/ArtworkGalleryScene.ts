import type { CampaignProgress } from "../progress/CampaignProgress.js";
import type { ProgressStore } from "../progress/ProgressStore.js";
import {
  getArtworkGallerySlotState, getDefaultArtworkGalleryChapter, getUnlockedArtworkCount,
} from "./ArtworkGallery.js";
import { getChapterLevelRange } from "./CampaignNavigation.js";
import { configureLogicalCamera, setHiDpiTextResolution } from "./Display.js";
import { CHAPTER_COUNT } from "./LevelSequence.js";
import { getLevelArtwork, LEVEL_ARTWORK, type LevelArtworkDefinition } from "./LevelArtwork.js";

export interface ArtworkGalleryStartData {
  readonly chapter?: number;
}

export class ArtworkGalleryScene extends Phaser.Scene {
  private progress!: CampaignProgress;
  private chapter = 1;
  private content: Phaser.GameObjects.Container | null = null;
  private readonly pendingThumbnails = new Set<string>();
  private readonly failedThumbnails = new Set<string>();

  constructor(private readonly progressStore: ProgressStore, private readonly renderScale = 1) {
    super({ key: "ArtworkGalleryScene" });
  }

  create(data: ArtworkGalleryStartData = {}): void {
    configureLogicalCamera(this, this.renderScale);
    this.pendingThumbnails.clear();
    this.progress = this.progressStore.load();
    this.chapter = Number.isSafeInteger(data.chapter) && data.chapter! >= 1 && data.chapter! <= CHAPTER_COUNT
      ? data.chapter! : getDefaultArtworkGalleryChapter(this.progress);
    this.text(240, 64, "Gallery", 34, "#f7fbff", true);
    this.text(240, 105, `Unlocked ${getUnlockedArtworkCount(this.progress)} / ${LEVEL_ARTWORK.length}`, 18, "#bcd1ec");
    this.button(70, 744, 105, 44, 0x243c5c, "Menu", () => this.scene.start("MainMenuScene"));
    this.renderChapter();
  }

  private renderChapter(): void {
    this.content?.destroy(true);
    const objects: Phaser.GameObjects.GameObject[] = [];
    const addText = (x: number, y: number, value: string, size: number, color: string, bold = false) => {
      const item = this.text(x, y, value, size, color, bold);
      objects.push(item);
      return item;
    };
    addText(240, 165, `Chapter ${this.chapter}`, 26, "#dceaff", true);
    const previous = this.add.rectangle(72, 165, 72, 46, this.chapter > 1 ? 0x243c5c : 0x171f2d)
      .setStrokeStyle(1, this.chapter > 1 ? 0x91acce : 0x3b4656);
    const next = this.add.rectangle(408, 165, 72, 46, this.chapter < CHAPTER_COUNT ? 0x243c5c : 0x171f2d)
      .setStrokeStyle(1, this.chapter < CHAPTER_COUNT ? 0x91acce : 0x3b4656);
    objects.push(previous, next);
    addText(72, 165, "<", 26, this.chapter > 1 ? "#ffffff" : "#59687a");
    addText(408, 165, ">", 26, this.chapter < CHAPTER_COUNT ? "#ffffff" : "#59687a");
    if (this.chapter > 1) previous.setInteractive({ useHandCursor: true }).on("pointerdown", () => { this.chapter -= 1; this.renderChapter(); });
    if (this.chapter < CHAPTER_COUNT) next.setInteractive({ useHandCursor: true }).on("pointerdown", () => { this.chapter += 1; this.renderChapter(); });

    const [first, last] = getChapterLevelRange(this.chapter);
    for (let level = first; level <= last; level += 1) {
      const index = level - first;
      const x = 64 + (index % 5) * 88;
      const y = 310 + Math.floor(index / 5) * 120;
      const state = getArtworkGallerySlotState(this.progress, level);
      const fill = state === "unlocked" ? 0x285b50 : state === "locked" ? 0x242b3a : 0x171f2d;
      const stroke = state === "unlocked" ? 0x83cfb8 : state === "locked" ? 0x8b719e : 0x3b4656;
      const card = this.add.rectangle(x, y, 72, 72, fill).setStrokeStyle(state === "unlocked" ? 3 : 2, stroke);
      objects.push(card);
      const artwork = state === "unlocked" ? getLevelArtwork(level) : undefined;
      if (artwork !== undefined && this.textures.exists(artwork.thumbnailAssetKey)) {
        objects.push(this.add.image(x, y, artwork.thumbnailAssetKey).setDisplaySize(64, 64));
        objects.push(this.add.rectangle(x, y + 23, 64, 18, 0x07101d, 0.8));
        addText(x, y + 23, `Level ${level}`, 11, "#ffffff", true);
      } else {
        addText(x, y - 15, String(level), 20, state === "unavailable" ? "#657184" : "#ffffff", true);
        const unlockedLabel = artwork !== undefined && this.failedThumbnails.has(artwork.thumbnailAssetKey)
          ? "Unavailable" : "Loading…";
        addText(x, y + 16, state === "unlocked" ? unlockedLabel : state === "locked" ? "Locked" : "Soon", 11,
          state === "unlocked" ? "#d8fff2" : state === "locked" ? "#d4bde2" : "#657184", state !== "unavailable");
      }
      if (state === "unlocked") card.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        this.scene.start("ArtworkFullViewScene", { levelNumber: level, returnChapter: this.chapter });
      });
    }
    this.content = this.add.container(0, 0, objects);
    this.loadUnlockedChapterThumbnails();
  }

  private loadUnlockedChapterThumbnails(): void {
    const [first, last] = getChapterLevelRange(this.chapter);
    const missing = LEVEL_ARTWORK.filter((artwork) => artwork.levelNumber >= first && artwork.levelNumber <= last
      && getArtworkGallerySlotState(this.progress, artwork.levelNumber) === "unlocked"
      && !this.textures.exists(artwork.thumbnailAssetKey)
      && !this.pendingThumbnails.has(artwork.thumbnailAssetKey)
      && !this.failedThumbnails.has(artwork.thumbnailAssetKey));
    for (const artwork of missing) this.loadThumbnail(artwork);
    if (missing.length > 0 && !this.load.isLoading()) this.load.start();
  }

  private loadThumbnail(artwork: LevelArtworkDefinition): void {
    this.pendingThumbnails.add(artwork.thumbnailAssetKey);
    this.load.once(`filecomplete-image-${artwork.thumbnailAssetKey}`, () => {
      this.pendingThumbnails.delete(artwork.thumbnailAssetKey);
      if (this.scene.isActive()) this.renderChapter();
    });
    this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      if (file.key !== artwork.thumbnailAssetKey) return;
      this.pendingThumbnails.delete(artwork.thumbnailAssetKey);
      this.failedThumbnails.add(artwork.thumbnailAssetKey);
      if (this.scene.isActive()) this.renderChapter();
    });
    this.load.image(artwork.thumbnailAssetKey, artwork.thumbnailPath);
  }

  private text(x: number, y: number, value: string, size: number, color: string, bold = false): Phaser.GameObjects.Text {
    return setHiDpiTextResolution(this.add.text(x, y, value, {
      color, fontFamily: "Arial, sans-serif", fontSize: `${size}px`, ...(bold ? { fontStyle: "bold" } : {}), align: "center",
    }).setOrigin(0.5), this.renderScale);
  }

  private button(x: number, y: number, width: number, height: number, color: number, label: string, action: () => void): void {
    this.add.rectangle(x, y, width, height, color).setStrokeStyle(1, 0x91acce)
      .setInteractive({ useHandCursor: true }).on("pointerdown", action);
    this.text(x, y, label, 18, "#dceaff");
  }
}
