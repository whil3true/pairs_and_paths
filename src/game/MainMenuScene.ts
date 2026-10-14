import { getAudioSettings, setMusicVolume, setSfxVolume } from "../audio/AudioRuntime.js";
import type { ProgressStore } from "../progress/ProgressStore.js";
import { createAudioVolumeSlider } from "./AudioVolumeSlider.js";
import { createSettingsGearButton, SETTINGS_GEAR_PNG_PATH, SETTINGS_GEAR_TEXTURE_KEY } from "./SettingsGearButton.js";
import { WebLocaleStore } from "../platform/WebLocaleStore.js";
import { getPrimaryMenuAction } from "./CampaignNavigation.js";
import { createChapterBanner } from "./ChapterBannerVisual.js";
import { computeMainMenuBrandPlacement, getMainMenuBrandAsset } from "./MainMenuBrandAssets.js";
import { getChapterBannerAsset } from "./ChapterBannerAssets.js";
import { getChapterNumber, TOTAL_LEVELS } from "./LevelSequence.js";
import { configureLogicalCamera } from "./Display.js";
import { DEFAULT_LOCALE, getChapterTitle, getUiStrings, type SupportedLocale } from "./Localization.js";
import { getActiveUiLocale } from "./UiLocaleRuntime.js";
import { formatPrimaryMenuAction, getMainMenuBrandLayout, MAIN_MENU_LAYOUT, progressRatio } from "./MainMenuVisualPolicy.js";
import { playStartData } from "./SceneStart.js";
import { configureUiLocale } from "./UiLocaleRuntime.js";
import { loadProductionFonts } from "./TypographyAssets.js";
import { createCard, createModalShell, createPrimaryButton, createSecondaryButton, createUiText } from "./UiPrimitives.js";
import { BORDERS, COMPONENT_RADII, VISUAL_COLORS } from "./VisualTokens.js";

export class MainMenuScene extends Phaser.Scene {
  private audioSettingsOverlay: Phaser.GameObjects.Container | null = null;
  private changingLanguage = false;

  constructor(
    private readonly progressStore: ProgressStore,
    private readonly renderScale = 1,
    private readonly initialLocale: SupportedLocale = DEFAULT_LOCALE,
    private readonly localeStore: WebLocaleStore = new WebLocaleStore(),
  ) {
    super({ key: "MainMenuScene" });
  }

  private get locale(): SupportedLocale { return getActiveUiLocale(this.initialLocale); }

  preload(): void {
    const primary = getPrimaryMenuAction(this.progressStore.load());
    const asset = getChapterBannerAsset(getChapterNumber(primary.levelNumber));
    if (!this.textures.exists(asset.assetKey)) this.load.image(asset.assetKey, asset.path);
    const logo = getMainMenuBrandAsset(this.locale);
    if (!this.textures.exists(logo.assetKey)) this.load.image(logo.assetKey, logo.path);
    if (!this.textures.exists(SETTINGS_GEAR_TEXTURE_KEY)) {
      this.load.image(SETTINGS_GEAR_TEXTURE_KEY, SETTINGS_GEAR_PNG_PATH);
    }
  }

  create(): void {
    configureLogicalCamera(this, this.renderScale);
    this.cameras.main.setBackgroundColor(VISUAL_COLORS.bg.app.phaser);
    const progress = this.progressStore.load();
    const primary = getPrimaryMenuAction(progress);
    const strings = getUiStrings(this.locale);
    const previewChapter = getChapterNumber(primary.levelNumber);

    const brandLayout = getMainMenuBrandLayout(this.locale);
    const logo = getMainMenuBrandAsset(this.locale);
    const logoSource = this.textures.exists(logo.assetKey) ? this.textures.get(logo.assetKey).source[0] : undefined;
    if (logoSource && logoSource.width > 0 && logoSource.height > 0) {
      const placement = computeMainMenuBrandPlacement(
        logoSource.width, logoSource.height, MAIN_MENU_LAYOUT.logo,
      );
      this.add.image(placement.x + placement.width / 2, placement.y + placement.height / 2, logo.assetKey)
        .setDisplaySize(placement.width, placement.height);
    } else {
      // Keep Main Menu usable if a brand PNG is absent or fails to load.
      createUiText(this, this.renderScale, 240, brandLayout.titleTop, strings.brandTitle,
        brandLayout.titleRole, { align: "center" }).setLetterSpacing(brandLayout.titleTracking).setOrigin(0.5, 0);
    }

    const preview = MAIN_MENU_LAYOUT.preview;
    createChapterBanner(this, previewChapter, preview, false);
    this.add.graphics().fillStyle(VISUAL_COLORS.surface.elevated.phaser, 0.94)
      .fillRoundedRect(preview.x + 16, preview.y + 16, 112, 38, 12)
      .fillRoundedRect(preview.x + 16, preview.y + preview.height - 64, 250, 48, 12);
    createUiText(this, this.renderScale, preview.x + 32, preview.y + 35,
      strings.chapterLabel(previewChapter), "smallMetadata", { color: VISUAL_COLORS.text.secondary.hex }).setOrigin(0, 0.5);
    createUiText(this, this.renderScale, preview.x + 32, preview.y + preview.height - 40,
      getChapterTitle(this.locale, previewChapter), "levelTitle").setOrigin(0, 0.5);

    const button = MAIN_MENU_LAYOUT.primary;
    createPrimaryButton(this, this.renderScale, {
      x: button.x + button.width / 2, y: button.y + button.height / 2, width: button.width, height: button.height,
      label: formatPrimaryMenuAction(primary, strings),
      onActivate: () => this.scene.start("PlayScene", playStartData(primary.levelNumber)),
    });
    for (const [bounds, label, target] of [
      [MAIN_MENU_LAYOUT.secondaryLeft, strings.levels, "LevelSelectScene"],
      [MAIN_MENU_LAYOUT.secondaryRight, strings.gallery, "ArtworkGalleryScene"],
    ] as const) createSecondaryButton(this, this.renderScale, {
      x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2,
      width: bounds.width, height: bounds.height, label, borderless: true,
      onActivate: () => this.scene.start(target),
    });

    const card = MAIN_MENU_LAYOUT.progress;
    createCard(this, { x: card.x + card.width / 2, y: card.y + card.height / 2, width: card.width, height: card.height, borderRole: "none" });
    const completed = progress.completedThroughLevel;
    createUiText(this, this.renderScale, card.x + 20, card.y + 22,
      completed === TOTAL_LEVELS
        ? strings.collectionComplete(completed, TOTAL_LEVELS)
        : strings.openedProgress(completed, TOTAL_LEVELS), "body");
    const track = { x: card.x + 20, y: card.y + 68, width: card.width - 40, height: 8 };
    const graphics = this.add.graphics().fillStyle(VISUAL_COLORS.divider.phaser)
      .fillRoundedRect(track.x, track.y, track.width, track.height, COMPONENT_RADII.tile);
    const fillWidth = track.width * progressRatio(completed, TOTAL_LEVELS);
    if (fillWidth > 0) graphics.fillStyle(VISUAL_COLORS.accent.gold.phaser)
      .fillRoundedRect(track.x, track.y, fillWidth, track.height, Math.min(4, fillWidth / 2));
    if (completed === TOTAL_LEVELS) {
      graphics.lineStyle(BORDERS.structural, VISUAL_COLORS.state.success.phaser)
        .strokeCircle(card.x + card.width - 28, card.y + 31, 10)
        .beginPath().moveTo(card.x + card.width - 33, card.y + 31)
        .lineTo(card.x + card.width - 29, card.y + 35).lineTo(card.x + card.width - 22, card.y + 27).strokePath();
    }

    createSettingsGearButton(this, this.renderScale, {
      x: MAIN_MENU_LAYOUT.audioSettingsButton.centerX,
      y: MAIN_MENU_LAYOUT.audioSettingsButton.centerY,
      touchSize: MAIN_MENU_LAYOUT.audioSettingsButton.touchSize,
      backgroundSize: MAIN_MENU_LAYOUT.audioSettingsButton.backgroundSize,
      iconSize: MAIN_MENU_LAYOUT.audioSettingsButton.iconSize,
      onActivate: () => this.openAudioSettings(),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioSettingsOverlay?.destroy(true);
      this.audioSettingsOverlay = null;
    });
  }

  private openAudioSettings(): void {
    if (this.audioSettingsOverlay !== null) return;
    const layout = MAIN_MENU_LAYOUT.audioSettingsModal;
    const strings = getUiStrings(this.locale);
    const settings = getAudioSettings();
    const shell = createModalShell(this, {
      x: layout.centerX, y: layout.centerY, width: layout.width, height: layout.height,
    });
    const title = createUiText(this, this.renderScale, layout.centerX, layout.titleY,
      strings.settingsTitle, "sectionHeading", { align: "center" }).setOrigin(0.5);
    const sliders = [
      createAudioVolumeSlider(this, this.renderScale, {
        x: layout.centerX, y: layout.sliderCenters[0], width: 336,
        label: strings.audioMusic, value: settings.musicVolume, onChange: setMusicVolume,
      }),
      createAudioVolumeSlider(this, this.renderScale, {
        x: layout.centerX, y: layout.sliderCenters[1], width: 336,
        label: strings.audioEffects, value: settings.sfxVolume, onChange: setSfxVolume,
      }),
    ];
    const languageLabel = createUiText(this, this.renderScale,
      layout.centerX - 160, layout.languageLabelY,
      strings.settingsLanguage, "caption").setOrigin(0, 0.5);
    const languageButtons = ([
      { locale: "ru", label: "Русский", centerX: layout.centerX - 86 },
      { locale: "en", label: "English", centerX: layout.centerX + 86 },
    ] as const).map(({ locale, label, centerX }) => {
      const button = (locale === this.locale ? createPrimaryButton : createSecondaryButton)(
        this, this.renderScale, {
          x: centerX, y: layout.languageButtonsY, width: 160, height: 52, label,
          onActivate: () => this.selectLocale(locale),
        },
      );
      return button.container;
    });
    const close = createPrimaryButton(this, this.renderScale, {
      x: layout.centerX, y: layout.closeY, width: 336, height: 52,
      label: strings.audioClose,
      onActivate: () => {
        this.audioSettingsOverlay?.destroy(true);
        this.audioSettingsOverlay = null;
      },
    });
    this.audioSettingsOverlay = this.add.container(0, 0, [
      shell, title, ...sliders, languageLabel, ...languageButtons, close.container,
    ]).setDepth(50);
  }

  private async selectLocale(next: SupportedLocale): Promise<void> {
    if (next === this.locale || this.changingLanguage) return;
    this.changingLanguage = true;
    try {
      await loadProductionFonts(next);
      if (!this.sys.isActive() || !this.localeStore.save(next)) return;
      configureUiLocale(next);
      document.documentElement.lang = next;
      // Remove the debug override without navigating the browser.
      const url = new URL(window.location.href);
      if (url.searchParams.get("debug") === "1" && url.searchParams.has("locale")) {
        url.searchParams.delete("locale");
        try { window.history.replaceState(null, "", url.toString()); } catch { /* restricted browser */ }
      }
      this.audioSettingsOverlay?.destroy(true);
      this.audioSettingsOverlay = null;
      this.scene.restart();
    } finally {
      this.changingLanguage = false;
    }
  }}
