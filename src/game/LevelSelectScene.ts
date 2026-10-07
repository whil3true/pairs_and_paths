import type { CampaignProgress } from "../progress/CampaignProgress.js";
import type { ProgressStore } from "../progress/ProgressStore.js";
import { getChapterLevelRange, getDefaultChapter, getLevelState } from "./CampaignNavigation.js";
import { createChapterBanner } from "./ChapterBannerVisual.js";
import { CHAPTER_BANNER_ASSETS } from "./ChapterBannerAssets.js";
import { CHAPTER_COUNT, TOTAL_LEVELS } from "./LevelSequence.js";
import { configureLogicalCamera } from "./Display.js";
import { DEFAULT_LOCALE, getChapterTitle, getUiStrings, type SupportedLocale } from "./Localization.js";
import {
  canNavigateChapter, getLevelCardBounds, getLevelCardGeometry, LEVEL_SELECT_LAYOUT, resolveLevelCardVisual,
} from "./LevelSelectVisualPolicy.js";
import { playStartData } from "./SceneStart.js";
import { createIconButton, createSecondaryButton, createUiText } from "./UiPrimitives.js";
import { COMPONENT_RADII, MOTION, VISUAL_COLORS } from "./VisualTokens.js";

export class LevelSelectScene extends Phaser.Scene {
  private progress!: CampaignProgress;
  private chapter = 1;
  private content: Phaser.GameObjects.Container | null = null;

  constructor(
    private readonly progressStore: ProgressStore,
    private readonly renderScale = 1,
    private readonly locale: SupportedLocale = DEFAULT_LOCALE,
  ) {
    super({ key: "LevelSelectScene" });
  }

  preload(): void {
    for (const asset of CHAPTER_BANNER_ASSETS) {
      if (!this.textures.exists(asset.assetKey)) this.load.image(asset.assetKey, asset.path);
    }
  }

  create(): void {
    configureLogicalCamera(this, this.renderScale);
    this.cameras.main.setBackgroundColor(VISUAL_COLORS.bg.app.phaser);
    this.progress = this.progressStore.load();
    this.chapter = getDefaultChapter(this.progress);
    const back = LEVEL_SELECT_LAYOUT.back;
    createSecondaryButton(this, this.renderScale, {
      x: back.x + back.width / 2, y: back.y + back.height / 2, width: back.width, height: back.height,
      label: getUiStrings(this.locale).backToMenu, onActivate: () => this.scene.start("MainMenuScene"),
    });
    this.renderChapter();
  }

  private renderChapter(): void {
    this.content?.destroy(true);
    const strings = getUiStrings(this.locale);
    const objects: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject>(item: T): T => { objects.push(item); return item; };
    const header = LEVEL_SELECT_LAYOUT.header;
    add(createUiText(this, this.renderScale, 240, header.chapterLabelTop,
      strings.chapterLabel(this.chapter), "hudSecondary", {
        color: VISUAL_COLORS.text.secondary.hex, align: "center",
      }).setOrigin(0.5, 0));
    add(createUiText(this, this.renderScale, 240, header.chapterTitleTop,
      getChapterTitle(this.locale, this.chapter), "chapterHeading", { align: "center" }).setOrigin(0.5, 0));
    add(createUiText(this, this.renderScale, 240, header.progressTop,
      strings.globalProgress(this.progress.completedThroughLevel, TOTAL_LEVELS), "body", {
        color: VISUAL_COLORS.text.secondary.hex, align: "center",
      }).setOrigin(0.5, 0));
    add(createChapterBanner(this, this.chapter, LEVEL_SELECT_LAYOUT.banner, false));

    const navigation = canNavigateChapter(this.chapter);
    this.createChapterArrow(LEVEL_SELECT_LAYOUT.previous.centerX, false, navigation.previous, objects);
    this.createChapterArrow(LEVEL_SELECT_LAYOUT.next.centerX, true, navigation.next, objects);
    add(createUiText(this, this.renderScale, 240, 316, strings.chapterLabel(this.chapter), "caption", {
      color: VISUAL_COLORS.text.secondary.hex, align: "center",
    }).setOrigin(0.5));

    const [first, last] = getChapterLevelRange(this.chapter);
    for (let level = first; level <= last; level += 1) {
      const bounds = getLevelCardBounds(level - first);
      const geometry = getLevelCardGeometry(bounds);
      const state = getLevelState(this.progress, level);
      const visual = resolveLevelCardVisual(state);
      const card = this.createLevelCard(geometry.centerX, geometry.centerY, level, state, false);
      add(card);
      if (visual.selectable) card.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, geometry.interactiveWidth, geometry.interactiveHeight), Phaser.Geom.Rectangle.Contains,
      ).input!.cursor = "pointer";
      if (visual.selectable) card.on("pointerup", () => this.scene.start("PlayScene", playStartData(level)));
    }
    this.content = this.add.container(0, 0, objects);
  }

  /** focused is a presentation seam for a later keyboard-navigation owner. */
  private createLevelCard(centerX: number, centerY: number, level: number, state: ReturnType<typeof getLevelState>, focused: boolean): Phaser.GameObjects.Container {
    const size = LEVEL_SELECT_LAYOUT.grid.cardSize;
    const half = size / 2;
    const visual = resolveLevelCardVisual(state);
    const graphics = this.add.graphics();
    if (focused) graphics.lineStyle(3, VISUAL_COLORS.primary.teal.phaser)
      .strokeRoundedRect(-half - 4, -half - 4, size + 8, size + 8, COMPONENT_RADII.levelCard + 4);
    graphics.fillStyle(visual.fill).fillRoundedRect(-half, -half, size, size, COMPONENT_RADII.levelCard);
    if (visual.borderWidth > 0) graphics.lineStyle(visual.borderWidth, visual.border)
      .strokeRoundedRect(-half, -half, size, size, COMPONENT_RADII.levelCard);
    const number = createUiText(this, this.renderScale, 0, 0, String(level), "sectionHeading", {
      color: state === "locked" ? VISUAL_COLORS.text.tertiary.hex : VISUAL_COLORS.text.primary.hex, align: "center",
    }).setOrigin(0.5);
    if (visual.numberSize === 20) number.setFontSize(20);
    if (visual.affordance === "check") graphics.lineStyle(2, VISUAL_COLORS.state.success.phaser)
      .beginPath().moveTo(17, -20).lineTo(21, -16).lineTo(28, -25).strokePath();
    else if (visual.affordance === "tab") graphics.fillStyle(VISUAL_COLORS.accent.gold.phaser)
      .fillTriangle(-6, 36, 6, 36, 0, 28);
    else {
      graphics.lineStyle(2, VISUAL_COLORS.state.locked.phaser).strokeRoundedRect(17, -22, 11, 10, 2)
        .beginPath().arc(22.5, -22, 4, Math.PI, 0).strokePath();
    }
    return this.add.container(centerX, centerY, [graphics, number]).setSize(size, size);
  }

  private createChapterArrow(x: number, pointsRight: boolean, enabled: boolean, objects: Phaser.GameObjects.GameObject[]): void {
    const button = createIconButton(this, this.renderScale, {
      x, y: LEVEL_SELECT_LAYOUT.previous.centerY, width: 48, height: 48, label: "", disabled: !enabled,
      onActivate: () => this.navigateChapter(pointsRight ? 1 : -1),
    });
    objects.push(button.container);
    const chevron = this.add.graphics().lineStyle(3,
      enabled ? VISUAL_COLORS.text.primary.phaser : VISUAL_COLORS.state.locked.phaser)
      .beginPath().moveTo(x + (pointsRight ? -4 : 4), 308)
      .lineTo(x + (pointsRight ? 4 : -4), 316)
      .lineTo(x + (pointsRight ? -4 : 4), 324).strokePath();
    objects.push(chevron);
  }

  private navigateChapter(delta: -1 | 1): void {
    const next = this.chapter + delta;
    if (next < 1 || next > CHAPTER_COUNT) return;
    this.chapter = next;
    this.renderChapter();
  }
}
