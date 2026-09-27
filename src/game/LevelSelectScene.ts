import type { CampaignProgress } from "../progress/CampaignProgress.js";
import type { ProgressStore } from "../progress/ProgressStore.js";
import { getChapterLevelRange, getDefaultChapter, getLevelState } from "./CampaignNavigation.js";
import { CHAPTER_COUNT } from "./LevelSequence.js";
import { configureLogicalCamera, setHiDpiTextResolution } from "./Display.js";
import { playStartData } from "./SceneStart.js";

export class LevelSelectScene extends Phaser.Scene {
  private progress!: CampaignProgress;
  private chapter = 1;
  private content: Phaser.GameObjects.Container | null = null;

  constructor(private readonly progressStore: ProgressStore, private readonly renderScale = 1) {
    super({ key: "LevelSelectScene" });
  }

  create(): void {
    configureLogicalCamera(this, this.renderScale);
    this.progress = this.progressStore.load();
    this.chapter = getDefaultChapter(this.progress);
    this.text(240, 76, "Levels", 34, "#f7fbff", true);
    this.add.rectangle(70, 744, 105, 44, 0x243c5c).setStrokeStyle(1, 0x91acce)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => this.scene.start("MainMenuScene"));
    this.text(70, 744, "Menu", 18, "#dceaff");
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
    addText(240, 155, `Chapter ${this.chapter}`, 26, "#dceaff", true);
    const previous = this.add.rectangle(72, 155, 72, 46, this.chapter > 1 ? 0x243c5c : 0x171f2d)
      .setStrokeStyle(1, this.chapter > 1 ? 0x91acce : 0x3b4656);
    const next = this.add.rectangle(408, 155, 72, 46, this.chapter < CHAPTER_COUNT ? 0x243c5c : 0x171f2d)
      .setStrokeStyle(1, this.chapter < CHAPTER_COUNT ? 0x91acce : 0x3b4656);
    objects.push(previous, next);
    addText(72, 155, "<", 26, this.chapter > 1 ? "#ffffff" : "#59687a");
    addText(408, 155, ">", 26, this.chapter < CHAPTER_COUNT ? "#ffffff" : "#59687a");
    if (this.chapter > 1) previous.setInteractive({ useHandCursor: true }).on("pointerdown", () => { this.chapter -= 1; this.renderChapter(); });
    if (this.chapter < CHAPTER_COUNT) next.setInteractive({ useHandCursor: true }).on("pointerdown", () => { this.chapter += 1; this.renderChapter(); });

    const [first, last] = getChapterLevelRange(this.chapter);
    for (let level = first; level <= last; level += 1) {
      const index = level - first;
      const x = 64 + (index % 5) * 88;
      const y = 300 + Math.floor(index / 5) * 112;
      const state = getLevelState(this.progress, level);
      const fill = state === "completed" ? 0x285b50 : state === "available" ? 0x3976b9 : 0x171f2d;
      const stroke = state === "available" ? 0xffd34e : state === "completed" ? 0x83cfb8 : 0x3b4656;
      const button = this.add.rectangle(x, y, 72, 72, fill).setStrokeStyle(state === "available" ? 3 : 2, stroke);
      objects.push(button);
      addText(x, y - (state === "completed" ? 7 : 0), String(level), 21,
        state === "locked" ? "#657184" : "#ffffff", true);
      if (state === "completed") addText(x, y + 20, "✓", 15, "#d8fff2", true);
      if (state !== "locked") button.setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.scene.start("PlayScene", playStartData(level)));
    }
    this.content = this.add.container(0, 0, objects);
  }

  private text(x: number, y: number, value: string, size: number, color: string, bold = false): Phaser.GameObjects.Text {
    return setHiDpiTextResolution(this.add.text(x, y, value, {
      color, fontFamily: "Arial, sans-serif", fontSize: `${size}px`, ...(bold ? { fontStyle: "bold" } : {}),
    }).setOrigin(0.5), this.renderScale);
  }
}
