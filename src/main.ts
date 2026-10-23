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
import {
  computeRenderScale, isLegacyRenderScaleDebugRequested, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH,
  MAX_LOGICAL_VIEWPORT_HEIGHT,
} from "./game/Display.js";
import { loadProductionFonts } from "./game/TypographyAssets.js";
import { configureUiLocale } from "./game/UiLocaleRuntime.js";
import { createPlatform } from "./platform/createPlatform.js";
import { attachGameReady } from "./platform/GameReady.js";
import { WebProgressStore } from "./platform/WebProgressStore.js";
import { VISUAL_COLORS } from "./game/VisualTokens.js";

const search = window.location.search;
const resetProgress = isProgressResetRequested(search);
const route = resolveStartupRoute(parseDebugStart(search), isSymbolGalleryRequested(search));
// Renderer density is deliberately fixed for this game instance. Rebuilding
// the WebGL backing buffer, Text objects and runtime atlas during resize would
// be riskier than retaining the startup choice across orientation changes.
const automaticRenderScale = computeRenderScale(
  window.devicePixelRatio || 1,
  window.innerWidth,
  window.innerHeight,
);
const renderScale = isLegacyRenderScaleDebugRequested(search) ? 1 : automaticRenderScale;
const startGame = async (): Promise<void> => {
  // SDK before audio/Phaser: startup ads can pause the game immediately.
  const platform = await createPlatform();
  const progressStore = new WebProgressStore();
  const localeStore = new WebLocaleStore();
  if (resetProgress) progressStore.clear();
  else {
    const setProgress = parseDebugSetProgress(search);
    if (setProgress !== null) progressStore.save({ version: 1, completedThroughLevel: setProgress });
  }
  const locale = resolveStartupLocale(search, localeStore.load());
  configureUiLocale(locale);
  document.documentElement.lang = locale;

  const audioManager = new AudioManager(new HtmlAudioOutput(), new WebAudioSettingsStore());
  configureAudioRuntime(audioManager);
  platform.onPause(() => audioManager.setAdActive(true));
  platform.onResume(() => audioManager.setAdActive(false));
  if (platform.isPaused) audioManager.setAdActive(true);
  attachBrowserAudioLifecycle(audioManager);

  await loadProductionFonts(locale);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: VISUAL_COLORS.bg.app.hex,
    scene: [
      new BootScene(route),
      new MainMenuScene(progressStore, renderScale, locale, localeStore),
      new LevelSelectScene(progressStore, renderScale, locale),
      new ArtworkGalleryScene(progressStore, renderScale, locale),
      new ArtworkFullViewScene(progressStore, renderScale, locale),
      new PlayScene(platform, progressStore, renderScale, locale),
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
  attachGameReady(game, platform);
};

/** SDK failure in a real Yandex player should never leave a silent blank canvas. */
void startGame().catch((error: unknown) => {
  console.error("Unable to initialize game platform", error);
  const target = document.getElementById("game");
  if (!target) return;
  target.replaceChildren();
  const panel = document.createElement("div");
  panel.style.cssText = "position:absolute;inset:20% 5% auto;padding:24px;background:#FFFDF8;border-radius:16px;text-align:center;font:16px sans-serif;color:#26383A";
  const title = document.createElement("p");
  title.textContent = "Не удалось запустить игру / Unable to start the game";
  const action = document.createElement("button");
  action.textContent = "Повторить / Retry";
  action.addEventListener("click", () => window.location.reload());
  panel.append(title, action);
  target.append(panel);
});
