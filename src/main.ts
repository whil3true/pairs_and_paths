import { AudioManager } from "./audio/AudioManager.js";
import { configureAudioRuntime } from "./audio/AudioRuntime.js";
import { HtmlAudioOutput } from "./audio/HtmlAudioOutput.js";
import { attachBrowserAudioLifecycle } from "./audio/BrowserAudioLifecycle.js";
import { WebAudioSettingsStore } from "./platform/WebAudioSettingsStore.js";
import { resolveStartupLocale, WebLocaleStore } from "./platform/WebLocaleStore.js";
import { BootScene } from "./game/BootScene.js";
import { resolveStartupRoute } from "./game/CampaignStartup.js";
import { isProgressResetRequested, isSymbolGalleryRequested, parseDebugSetProgress, parseDebugStart } from "./game/DebugStart.js";
import { MainMenuScene } from "./game/MainMenuScene.js";
import { LevelSelectScene } from "./game/LevelSelectScene.js";
import { PlayScene } from "./game/PlayScene.js";
import { SymbolGalleryScene } from "./game/SymbolGalleryScene.js";
import { ArtworkGalleryScene } from "./game/ArtworkGalleryScene.js";
import { ArtworkFullViewScene } from "./game/ArtworkFullViewScene.js";
import { FullArtworkTextureCache } from "./game/ArtworkTextureCache.js";
import {
  computeRenderScale, isDesktopBrowserUserAgent, isLegacyRenderScaleDebugRequested, selectStartupRenderScale, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH,
  MAX_LOGICAL_VIEWPORT_HEIGHT,
} from "./game/Display.js";
import { loadProductionFonts } from "./game/TypographyAssets.js";
import { configureUiLocale } from "./game/UiLocaleRuntime.js";
import { WebPlatform } from "./platform/WebPlatform.js";
import { WebProgressStore } from "./platform/WebProgressStore.js";
import { VISUAL_COLORS } from "./game/VisualTokens.js";

const platform = new WebPlatform();
const progressStore = new WebProgressStore();
const localeStore = new WebLocaleStore();
const artworkTextures = new FullArtworkTextureCache();
// One audio service for the entire game. Scene navigation must not restart music.
const audioManager = new AudioManager(new HtmlAudioOutput(), new WebAudioSettingsStore());
configureAudioRuntime(audioManager);
attachBrowserAudioLifecycle(audioManager);
const search = window.location.search;
const resetProgress = isProgressResetRequested(search);
if (resetProgress) progressStore.clear();
else {
  const setProgress = parseDebugSetProgress(search);
  if (setProgress !== null) progressStore.save({ version: 1, completedThroughLevel: setProgress });
}
const route = resolveStartupRoute(parseDebugStart(search), isSymbolGalleryRequested(search));
// Renderer density is deliberately fixed for this game instance. Rebuilding
// the WebGL backing buffer, Text objects and runtime atlas during resize would
// be riskier than retaining the startup choice across orientation changes.
const automaticRenderScale = computeRenderScale(
  window.devicePixelRatio || 1,
  window.innerWidth,
  window.innerHeight,
);
const renderScale = selectStartupRenderScale(
  automaticRenderScale,
  isDesktopBrowserUserAgent(navigator.userAgent, navigator.maxTouchPoints),
  isLegacyRenderScaleDebugRequested(search),
);
const locale = resolveStartupLocale(search, localeStore.load());
configureUiLocale(locale);

document.documentElement.lang = locale;

const startGame = async (): Promise<void> => {
  await loadProductionFonts(locale);
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: VISUAL_COLORS.bg.app.hex,
    scene: [
      new BootScene(route),
      new MainMenuScene(progressStore, renderScale, locale, localeStore),
      new LevelSelectScene(progressStore, renderScale, locale),
      new ArtworkGalleryScene(progressStore, renderScale, locale),
      new ArtworkFullViewScene(progressStore, renderScale, locale, artworkTextures),
      new PlayScene(platform, progressStore, renderScale, locale, artworkTextures),
      new SymbolGalleryScene(renderScale),
    ],
    scale: {
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.NO_CENTER,
      expandParent: false,
      width: LOGICAL_GAME_WIDTH * renderScale,
      height: LOGICAL_GAME_HEIGHT * renderScale,
    },
  });
};

void startGame();
