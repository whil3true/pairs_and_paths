import type { PlatformService } from "../platform/PlatformService.js";
import { configureLogicalCamera } from "./Display.js";
import { getMainMenuBrandAsset, computeMainMenuBrandPlacement } from "./MainMenuBrandAssets.js";
import { getActiveUiLocale } from "./UiLocaleRuntime.js";
import type { SupportedLocale } from "./Localization.js";
import { VISUAL_COLORS } from "./VisualTokens.js";

/** Brief non-interactive startup screen; never initiates advertising. */
export const STARTUP_INTRO_DURATION_MS = 1200;
export const shouldFinishStartupIntro = (elapsedMs: number, sdkPaused: boolean): boolean =>
  elapsedMs >= STARTUP_INTRO_DURATION_MS && !sdkPaused;

export class IntroScene extends Phaser.Scene {
  private startedAt = 0;
  private finished = false;

  constructor(
    private readonly platform: PlatformService,
    private readonly renderScale: number,
    private readonly initialLocale: SupportedLocale,
  ) {
    super({ key: "IntroScene" });
  }

  preload(): void {
    const asset = getMainMenuBrandAsset(getActiveUiLocale(this.initialLocale));
    if (!this.textures.exists(asset.assetKey)) this.load.image(asset.assetKey, asset.path);
  }

  create(): void {
    configureLogicalCamera(this, this.renderScale);
    this.cameras.main.setBackgroundColor(VISUAL_COLORS.bg.app.phaser);
    // There are deliberately no buttons or input listeners on this screen.
    this.input.enabled = false;
    const asset = getMainMenuBrandAsset(getActiveUiLocale(this.initialLocale));
    const source = this.textures.exists(asset.assetKey) ? this.textures.get(asset.assetKey).source[0] : undefined;
    if (source && source.width > 0 && source.height > 0) {
      const placement = computeMainMenuBrandPlacement(source.width, source.height, {
        x: 48, y: 332, width: 384, height: 136,
      });
      this.add.image(placement.x + placement.width / 2, placement.y + placement.height / 2, asset.assetKey)
        .setDisplaySize(placement.width, placement.height);
    }
    // A missing PNG safely falls back to a text-free neutral screen.
    this.startedAt = performance.now();
  }

  update(): void {
    if (this.finished || !shouldFinishStartupIntro(performance.now() - this.startedAt, this.platform.isPaused)) return;
    this.finished = true;
    this.scene.start("MainMenuScene");
  }
}
