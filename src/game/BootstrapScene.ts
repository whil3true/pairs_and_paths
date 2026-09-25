import type { PlatformService } from "../platform/PlatformService.js";

export class BootstrapScene extends Phaser.Scene {
  constructor(private readonly platform: PlatformService) {
    super({ key: "BootstrapScene" });
  }

  create(): void {
    const viewport = `${this.scale.width} × ${this.scale.height}`;
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        [
          "Pairs & Paths",
          "",
          "Technical bootstrap OK",
          "Phaser initialized",
          `Platform: ${this.platform.displayName}`,
          `Viewport: ${viewport}`,
        ].join("\n"),
        {
          align: "center",
          color: "#eaf2ff",
          fontFamily: "system-ui, sans-serif",
          fontSize: "22px",
          lineSpacing: 10,
        },
      )
      .setOrigin(0.5);
  }
}
