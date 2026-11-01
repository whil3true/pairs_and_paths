/** Production entry opens a noninteractive intro before the Main Menu; debug routing is excluded. */
export class BootScene extends Phaser.Scene {
  constructor() { super({ key: "BootScene" }); }
  create(): void { this.scene.start("IntroScene"); }
}
