/** Production entry always opens the Main Menu; debug routing is excluded. */
export class BootScene extends Phaser.Scene {
  constructor() { super({ key: "BootScene" }); }
  create(): void { this.scene.start("MainMenuScene"); }
}
