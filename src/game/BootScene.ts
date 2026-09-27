import type { StartupRoute } from "./CampaignStartup.js";

export class BootScene extends Phaser.Scene {
  constructor(private readonly route: StartupRoute) {
    super({ key: "BootScene" });
  }

  create(): void {
    if (this.route.kind === "gallery") this.scene.start("SymbolGalleryScene");
    else if (this.route.kind === "play") this.scene.start("PlayScene", {
      ...this.route.position, persistenceEnabled: this.route.persistenceEnabled,
    });
    else this.scene.start("MainMenuScene");
  }
}
