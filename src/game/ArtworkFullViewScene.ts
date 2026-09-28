import type { ProgressStore } from "../progress/ProgressStore.js";
import { configureLogicalCamera, setHiDpiTextResolution } from "./Display.js";
import { getLevelArtwork, isArtworkUnlocked, type LevelArtworkDefinition } from "./LevelArtwork.js";

interface ArtworkFullViewStartData {
  readonly levelNumber?: number;
  readonly returnChapter?: number;
}

export class ArtworkFullViewScene extends Phaser.Scene {
  private artwork: LevelArtworkDefinition | undefined;
  private levelNumber = 0;
  private returnChapter = 1;
  private allowed = false;
  private loadingPresentation: Phaser.GameObjects.Container | null = null;

  constructor(private readonly progressStore: ProgressStore, private readonly renderScale = 1) {
    super({ key: "ArtworkFullViewScene" });
  }

  init(data: ArtworkFullViewStartData = {}): void {
    this.levelNumber = Number.isSafeInteger(data.levelNumber) ? data.levelNumber! : 0;
    this.returnChapter = Number.isSafeInteger(data.returnChapter) ? data.returnChapter! : 1;
    this.artwork = getLevelArtwork(this.levelNumber);
    this.allowed = this.artwork !== undefined && isArtworkUnlocked(this.progressStore.load(), this.levelNumber);
  }

  preload(): void {
    if (this.allowed && this.artwork !== undefined && !this.textures.exists(this.artwork.fullAssetKey)) {
      configureLogicalCamera(this, this.renderScale);
      this.loadingPresentation = this.add.container(0, 0, [
        this.text(240, 72, `Level ${this.levelNumber}`, 32, "#f7fbff", true),
        this.add.rectangle(240, 370, 400, 400, 0x171f2d).setStrokeStyle(2, 0x3b4656),
        this.text(240, 370, "Loading artwork…", 20, "#bcd1ec", true),
      ]);
      this.load.image(this.artwork.fullAssetKey, this.artwork.fullPath);
    }
  }

  create(): void {
    this.loadingPresentation?.destroy(true);
    this.loadingPresentation = null;
    configureLogicalCamera(this, this.renderScale);
    this.text(240, 72, this.allowed ? `Level ${this.levelNumber}` : "Gallery artwork", 32, "#f7fbff", true);
    if (this.allowed && this.artwork !== undefined && this.textures.exists(this.artwork.fullAssetKey)) {
      this.add.image(240, 370, this.artwork.fullAssetKey).setDisplaySize(400, 400);
    } else {
      this.add.rectangle(240, 370, 400, 400, 0x171f2d).setStrokeStyle(2, 0x3b4656);
      this.text(240, 370, "Artwork unavailable", 20, "#bcd1ec", true);
    }
    this.add.rectangle(240, 680, 180, 54, 0x243c5c).setStrokeStyle(1, 0x91acce)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        this.scene.start("ArtworkGalleryScene", { chapter: this.returnChapter });
      });
    this.text(240, 680, "Back", 20, "#dceaff", true);
  }

  private text(x: number, y: number, value: string, size: number, color: string, bold = false): Phaser.GameObjects.Text {
    return setHiDpiTextResolution(this.add.text(x, y, value, {
      color, fontFamily: "Arial, sans-serif", fontSize: `${size}px`, ...(bold ? { fontStyle: "bold" } : {}), align: "center",
    }).setOrigin(0.5), this.renderScale);
  }
}
