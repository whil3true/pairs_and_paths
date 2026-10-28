import { playAudioEffect } from "../audio/AudioRuntime.js";
import { setHiDpiTextResolution } from "./Display.js";
import {
  COMPACT_HUD_ASSETS, GAMEPLAY_HUD, getGameplayHudLayout, getStageDotStates,
  shouldShowStageIndicator,
} from "./GameplayHudPolicy.js";
import { getUiStrings, type SupportedLocale } from "./Localization.js";
import { createButtonHitArea } from "./UiPolicy.js";
import { FONT_UI_FAMILY, VISUAL_COLORS } from "./VisualTokens.js";
import type { UiButton } from "./UiPrimitives.js";

const HUD_DEPTH = 30;

export const preloadCompactGameplayHud = (scene: Phaser.Scene): void => {
  for (const asset of Object.values(COMPACT_HUD_ASSETS)) {
    if (!scene.textures.exists(asset.key)) scene.load.image(asset.key, asset.path);
  }
};

const createHudText = (
  scene: Phaser.Scene,
  renderScale: number,
  value: string,
  size: number,
  weight: number,
): Phaser.GameObjects.Text => setHiDpiTextResolution(scene.add.text(0, 0, value, {
  color: VISUAL_COLORS.text.primary.hex,
  fontFamily: FONT_UI_FAMILY,
  fontSize: `${size}px`,
  fontStyle: String(weight),
  align: "center",
}), renderScale).setOrigin(0.5);

const drawPauseIcon = (graphics: Phaser.GameObjects.Graphics): void => {
  graphics.fillStyle(VISUAL_COLORS.text.primary.phaser, 1)
    .fillRoundedRect(-7, -9, 5, 18, 2)
    .fillRoundedRect(2, -9, 5, 18, 2);
};

const drawHintIcon = (graphics: Phaser.GameObjects.Graphics): void => {
  const color = VISUAL_COLORS.text.primary.phaser;
  graphics.lineStyle(2.4, color, 1)
    .strokeCircle(0, -4, 7)
    .beginPath().moveTo(-4, 2).lineTo(-3, 7).lineTo(3, 7).lineTo(4, 2).strokePath()
    .lineStyle(2, color, 1)
    .beginPath().moveTo(-3, 10).lineTo(3, 10).strokePath();
  for (const [x1, y1, x2, y2] of [[0, -15, 0, -12], [-11, -10, -9, -8], [11, -10, 9, -8]] as const) {
    graphics.beginPath().moveTo(x1, y1).lineTo(x2, y2).strokePath();
  }
};

const createHudButton = (
  scene: Phaser.Scene,
  icon: "pause" | "hint",
  onActivate: () => void,
): UiButton => {
  const base = scene.add.image(0, 0, COMPACT_HUD_ASSETS.button.key)
    .setDisplaySize(GAMEPLAY_HUD.buttonSize, GAMEPLAY_HUD.buttonSize);
  const iconGraphics = scene.add.graphics();
  if (icon === "pause") drawPauseIcon(iconGraphics);
  else drawHintIcon(iconGraphics);
  const focus = scene.add.graphics();
  const visual = scene.add.container(0, 0, [base, iconGraphics]);
  const container = scene.add.container(0, 0, [focus, visual]);
  let disabled = false;
  let hovered = false;
  let focused = false;
  let armed = false;

  const render = (pressed = false): void => {
    visual.setAlpha(disabled ? 0.48 : 1)
      .setScale(pressed ? 0.95 : hovered && !disabled ? 1.025 : 1)
      .setY(pressed ? 1 : 0);
    focus.clear();
    if (focused && !disabled) focus.lineStyle(2, VISUAL_COLORS.route.halo.phaser, 1)
      .strokeCircle(0, 0, GAMEPLAY_HUD.buttonSize / 2 + 3);
  };
  const hitArea = createButtonHitArea(GAMEPLAY_HUD.buttonSize, GAMEPLAY_HUD.buttonSize);
  const syncInput = (): void => {
    if (disabled) container.disableInteractive();
    else container.setInteractive(
      new Phaser.Geom.Rectangle(hitArea.left, hitArea.top, hitArea.width, hitArea.height),
      Phaser.Geom.Rectangle.Contains,
    ).input!.cursor = "pointer";
  };
  container.setSize(GAMEPLAY_HUD.buttonSize, GAMEPLAY_HUD.buttonSize)
    .on("pointerover", () => { if (!disabled) { hovered = true; render(); } })
    .on("pointerout", () => { hovered = false; armed = false; render(); })
    .on("pointerdown", () => {
      if (disabled || armed) return;
      armed = true;
      playAudioEffect("uiClick");
      render(true);
    })
    .on("pointerup", () => {
      if (disabled || !armed) return;
      armed = false;
      render();
      onActivate();
    });
  render();
  syncInput();
  return {
    container,
    setDisabled(value: boolean): void {
      disabled = value;
      armed = false;
      syncInput();
      render();
    },
    setFocused(value: boolean): void { focused = value; render(); },
  };
};

type NineSlicePolicy = typeof GAMEPLAY_HUD.statNineSlice | typeof GAMEPLAY_HUD.stageNineSlice;

const createNineSlice = (
  scene: Phaser.Scene,
  texture: string,
  policy: NineSlicePolicy,
): Phaser.GameObjects.NineSlice => scene.add.nineslice(
  0, 0, texture, undefined, policy.objectWidth, policy.objectHeight,
  policy.leftWidth, policy.rightWidth, policy.topHeight, policy.bottomHeight,
).setScale(policy.scale);

interface StatChip {
  readonly root: Phaser.GameObjects.Container;
  readonly label: Phaser.GameObjects.Text;
  readonly value: Phaser.GameObjects.Text;
}

const createStatChip = (scene: Phaser.Scene, renderScale: number): StatChip => {
  const base = createNineSlice(scene, COMPACT_HUD_ASSETS.statChip.key, GAMEPLAY_HUD.statNineSlice);
  const label = createHudText(scene, renderScale, "", 10, 500).setY(GAMEPLAY_HUD.statLabelY);
  const value = createHudText(scene, renderScale, "", 16, 600).setY(GAMEPLAY_HUD.statValueY);
  return { root: scene.add.container(0, 0, [base, label, value]), label, value };
};

export class CompactGameplayHud {
  readonly root: Phaser.GameObjects.Container;
  readonly pauseControl: UiButton;
  readonly hintControl: UiButton;
  private readonly levelChip: StatChip;
  private readonly remainingChip: StatChip;
  private readonly stageRoot: Phaser.GameObjects.Container;
  private readonly stageLabel: Phaser.GameObjects.Text;
  private readonly stageDots: Phaser.GameObjects.Image[] = [];
  private stageCount = 1;
  private visible = true;

  constructor(
    scene: Phaser.Scene,
    private readonly renderScale: number,
    private readonly locale: SupportedLocale,
    onPause: () => void,
    onHint: () => void,
  ) {
    this.pauseControl = createHudButton(scene, "pause", onPause);
    this.hintControl = createHudButton(scene, "hint", onHint);
    this.levelChip = createStatChip(scene, renderScale);
    this.remainingChip = createStatChip(scene, renderScale);
    const stageBase = createNineSlice(scene, COMPACT_HUD_ASSETS.stagePill.key, GAMEPLAY_HUD.stageNineSlice);
    this.stageLabel = createHudText(scene, renderScale, "", 11, 600).setY(GAMEPLAY_HUD.stageLabelY);
    this.stageRoot = scene.add.container(0, 0, [stageBase, this.stageLabel]);
    this.root = scene.add.container(0, 0, [
      this.pauseControl.container, this.levelChip.root, this.stageRoot,
      this.remainingChip.root, this.hintControl.container,
    ]).setDepth(HUD_DEPTH);
    this.update(1, 0, 0, 1);
  }

  update(level: number, remainingPairs: number, stageIndex: number, stageCount: number): void {
    this.stageCount = stageCount;
    const layout = getGameplayHudLayout(stageCount);
    this.pauseControl.container.setPosition(layout.pause.centerX, layout.pause.centerY);
    this.levelChip.root.setPosition(layout.level.centerX, layout.level.centerY);
    this.stageRoot.setPosition(layout.stage.centerX, layout.stage.centerY);
    this.remainingChip.root.setPosition(layout.remaining.centerX, layout.remaining.centerY);
    this.hintControl.container.setPosition(layout.hint.centerX, layout.hint.centerY);

    const strings = getUiStrings(this.locale);
    this.levelChip.label.setText(strings.gameplayLevelCaption);
    this.levelChip.value.setText(String(level));
    this.remainingChip.label.setText(strings.gameplayRemainingCaption);
    this.remainingChip.value.setText(strings.gameplayPairCount(remainingPairs));
    this.stageLabel.setText(strings.stageLabel(stageIndex + 1, stageCount));
    this.renderStageDots(stageIndex, stageCount);
    this.stageRoot.setVisible(this.visible && shouldShowStageIndicator(stageCount));
  }

  setRemainingPairs(count: number): void {
    this.remainingChip.value.setText(getUiStrings(this.locale).gameplayPairCount(count));
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.setVisible(visible);
    this.stageRoot.setVisible(visible && shouldShowStageIndicator(this.stageCount));
    this.pauseControl.setDisabled(!visible);
    this.hintControl.setDisabled(!visible);
  }

  private renderStageDots(stageIndex: number, stageCount: number): void {
    for (const dot of this.stageDots) dot.destroy();
    this.stageDots.length = 0;
    if (!shouldShowStageIndicator(stageCount)) return;
    const states = getStageDotStates(stageIndex, stageCount);
    const span = stageCount * GAMEPLAY_HUD.stageDotSize + (stageCount - 1) * GAMEPLAY_HUD.stageDotGap;
    for (let index = 0; index < stageCount; index += 1) {
      const key = states[index]
        ? COMPACT_HUD_ASSETS.stageDotActive.key : COMPACT_HUD_ASSETS.stageDotInactive.key;
      const dot = this.stageRoot.scene.add.image(
        -span / 2 + GAMEPLAY_HUD.stageDotSize / 2
          + index * (GAMEPLAY_HUD.stageDotSize + GAMEPLAY_HUD.stageDotGap),
        GAMEPLAY_HUD.stageDotsY,
        key,
      ).setDisplaySize(GAMEPLAY_HUD.stageDotSize, GAMEPLAY_HUD.stageDotSize);
      this.stageRoot.add(dot);
      this.stageDots.push(dot);
    }
  }
}
