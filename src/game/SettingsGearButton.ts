import { playAudioEffect } from "../audio/AudioRuntime.js";
import { createUiText } from "./UiPrimitives.js";
import { VISUAL_COLORS } from "./VisualTokens.js";

export const SETTINGS_GEAR_TEXTURE_KEY = "settings-gear";
export const SETTINGS_GEAR_PNG_PATH = "assets/icons/settings-gear.png";

export interface SettingsGearButtonOptions {
  readonly x: number;
  readonly y: number;
  readonly touchSize: number;
  readonly backgroundSize: number;
  readonly iconSize: number;
  readonly onActivate: () => void;
}

/** PNG-only settings control with a generous hitbox and normal button feedback. */
export const createSettingsGearButton = (
  scene: Phaser.Scene, renderScale: number, options: SettingsGearButtonOptions,
): Phaser.GameObjects.Container => {
  const graphics = scene.add.graphics();
  const image = scene.textures.exists(SETTINGS_GEAR_TEXTURE_KEY)
    ? scene.add.image(0, 0, SETTINGS_GEAR_TEXTURE_KEY).setDisplaySize(options.iconSize, options.iconSize)
    : createUiText(scene, renderScale, 0, 0, "⚙", "sectionHeading", { align: "center" }).setOrigin(0.5);
  const touch = scene.add.zone(0, 0, options.touchSize, options.touchSize)
    .setInteractive({ useHandCursor: true });
  const button = scene.add.container(options.x, options.y, [graphics, image, touch]);
  let armed = false;
  let hovered = false;
  const render = (): void => {
    const fill = armed ? VISUAL_COLORS.secondaryPressed.phaser
      : hovered ? VISUAL_COLORS.gallery.soonFill.phaser
        : VISUAL_COLORS.surface.elevated.phaser;
    graphics.clear().fillStyle(fill, 1).fillCircle(0, 0, options.backgroundSize / 2);
    image.setY(armed ? 1 : 0);
  };
  touch.on("pointerover", () => { hovered = true; render(); });
  touch.on("pointerout", () => { hovered = false; armed = false; render(); });
  touch.on("pointerdown", () => {
    armed = true;
    render();
    playAudioEffect("uiClick");
  });
  touch.on("pointerup", () => {
    if (!armed) return;
    armed = false;
    render();
    options.onActivate();
  });
  render();
  return button;
};
