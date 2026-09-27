import type { ProgressStore } from "../progress/ProgressStore.js";
import { TOTAL_LEVELS } from "./LevelSequence.js";
import { getPrimaryMenuAction } from "./CampaignNavigation.js";
import { configureLogicalCamera, setHiDpiTextResolution } from "./Display.js";
import { playStartData } from "./SceneStart.js";

export class MainMenuScene extends Phaser.Scene {
  constructor(private readonly progressStore: ProgressStore, private readonly renderScale = 1) {
    super({ key: "MainMenuScene" });
  }

  create(): void {
    configureLogicalCamera(this, this.renderScale);
    const progress = this.progressStore.load();
    const primary = getPrimaryMenuAction(progress);
    this.text(240, 160, "Pairs & Paths", 38, "#f7fbff", true);
    this.text(240, 245, `${progress.completedThroughLevel} / ${TOTAL_LEVELS} completed`, 20, "#bcd1ec");
    this.button(240, 370, 300, 82, 0x3976b9,
      primary.label === "Play again" ? primary.label : `${primary.label}\nLevel ${primary.levelNumber}`,
      () => this.scene.start("PlayScene", playStartData(primary.levelNumber)));
    this.button(240, 490, 240, 62, 0x243c5c, "Levels",
      () => this.scene.start("LevelSelectScene"));
  }

  private text(x: number, y: number, value: string, size: number, color: string, bold = false): Phaser.GameObjects.Text {
    return setHiDpiTextResolution(this.add.text(x, y, value, {
      color, fontFamily: "Arial, sans-serif", fontSize: `${size}px`,
      ...(bold ? { fontStyle: "bold" } : {}), align: "center",
    }).setOrigin(0.5), this.renderScale);
  }

  private button(x: number, y: number, width: number, height: number, color: number, label: string, action: () => void): void {
    this.add.rectangle(x, y, width, height, color).setStrokeStyle(2, 0xb9cce2)
      .setInteractive({ useHandCursor: true }).on("pointerdown", action);
    this.text(x, y, label, 22, "#ffffff", true);
  }
}
