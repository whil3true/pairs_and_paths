import { AudioManager } from "./audio/AudioManager.js";
import { configureAudioRuntime } from "./audio/AudioRuntime.js";
import { HtmlAudioOutput } from "./audio/HtmlAudioOutput.js";
import { attachBrowserAudioLifecycle } from "./audio/BrowserAudioLifecycle.js";
import { WebAudioSettingsStore } from "./platform/WebAudioSettingsStore.js";
import { resolveStartupLocale, WebLocaleStore } from "./platform/WebLocaleStore.js";
import { BootScene } from "./game/BootScene.js";
import { MainMenuScene } from "./game/MainMenuScene.js";
import { LevelSelectScene } from "./game/LevelSelectScene.js";
import { PlayScene } from "./game/PlayScene.js";
import { ArtworkGalleryScene } from "./game/ArtworkGalleryScene.js";
import { ArtworkFullViewScene } from "./game/ArtworkFullViewScene.js";
import { FullArtworkTextureCache } from "./game/ArtworkTextureCache.js";
import {
  computeRenderScale, isDesktopBrowserUserAgent, selectStartupRenderScale, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH,
} from "./game/Display.js";
import { loadProductionFonts } from "./game/TypographyAssets.js";
import { configureUiLocale } from "./game/UiLocaleRuntime.js";
import { createPlatform } from "./platform/createPlatform.js";
import { attachGameReady } from "./platform/GameReady.js";
import { attachSdkInputGuard } from "./platform/SdkInputGuard.js";
import { InterstitialController } from "./platform/InterstitialController.js";
import { WebProgressStore } from "./platform/WebProgressStore.js";
import { VISUAL_COLORS } from "./game/VisualTokens.js";

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
  false,
);
const bootTime = performance.now();
const sdkTrace = (name: string): void => {
  console.info(`[Cozy SDK] ${name} +${Math.round(performance.now() - bootTime)}ms`);
};
const startGame = async (): Promise<void> => {
  sdkTrace("bootstrap_begin");
  // Platform events may arrive during startup before Phaser/audio exist.
  const platform = await createPlatform();
  sdkTrace(`platform_initialized:${platform.id}`);
  platform.onPause(() => sdkTrace("platform_pause"));
  platform.onResume(() => sdkTrace("platform_resume"));
  const progressStore = new WebProgressStore();
  const localeStore = new WebLocaleStore();
  const artworkTextures = new FullArtworkTextureCache();
  const interstitials = new InterstitialController(platform);
  const locale = resolveStartupLocale(
    localeStore.load(), platform.id === "yandex" ? platform.locale : undefined,
  );
  configureUiLocale(locale);
  document.documentElement.lang = locale;

  // Shared audio manager survives scene navigation.
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
      new BootScene(),
      new MainMenuScene(progressStore, renderScale, locale, localeStore),
      new LevelSelectScene(progressStore, renderScale, locale),
      new ArtworkGalleryScene(progressStore, renderScale, locale, interstitials),
      new ArtworkFullViewScene(progressStore, renderScale, locale, artworkTextures),
      new PlayScene(platform, progressStore, renderScale, locale, artworkTextures, interstitials),
    ],
    scale: {
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.NO_CENTER,
      expandParent: false,
      width: LOGICAL_GAME_WIDTH * renderScale,
      height: LOGICAL_GAME_HEIGHT * renderScale,
    },
  });
  attachSdkInputGuard(game, platform);
  attachGameReady(game, platform, () => sdkTrace("game_ready"));
};

void startGame().catch((error: unknown) => {
  console.error("Unable to initialize game platform", error);
  const target = document.getElementById("game");
  if (!target) return;
  target.replaceChildren();
  const panel = document.createElement("div");
  panel.style.cssText = "position:absolute;inset:20% 5% auto;padding:24px;background:#FFFDF8;border-radius:16px;text-align:center;font:16px sans-serif;color:#26383A";
  const message = document.createElement("p");
  message.textContent = "Не удалось запустить игру / Unable to start the game";
  const action = document.createElement("button");
  action.textContent = "Повторить / Retry";
  action.addEventListener("click", () => window.location.reload());
  panel.append(message, action);
  target.append(panel);
});
