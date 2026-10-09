import { BootScene } from "./game/BootScene.js";
import { resolveStartupRoute } from "./game/CampaignStartup.js";
import { isProgressResetRequested, isSymbolGalleryRequested, parseDebugLocale, parseDebugSetProgress, parseDebugStart } from "./game/DebugStart.js";
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
import { WebPlatform } from "./platform/WebPlatform.js";
import { WebProgressStore } from "./platform/WebProgressStore.js";
import { VISUAL_COLORS } from "./game/VisualTokens.js";

const platform = new WebPlatform();
const progressStore = new WebProgressStore();
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
const renderScale = isLegacyRenderScaleDebugRequested(search) ? 1 : automaticRenderScale;
const locale = parseDebugLocale(search);

document.documentElement.lang = locale;

const startGame = async (): Promise<void> => {
  await loadProductionFonts(locale);
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: VISUAL_COLORS.bg.app.hex,
    scene: [
      new BootScene(route),
      new MainMenuScene(progressStore, renderScale, locale),
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
};

void startGame();
