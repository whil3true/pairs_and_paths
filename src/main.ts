import { PlayScene } from "./game/PlayScene.js";
import { isProgressResetRequested, isSymbolGalleryRequested, parseDebugStart } from "./game/DebugStart.js";
import { resolveCampaignStartup } from "./game/CampaignStartup.js";
import { SymbolGalleryScene } from "./game/SymbolGalleryScene.js";
import {
  computeRenderScale, isLegacyRenderScaleDebugRequested, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH,
} from "./game/Display.js";
import { WebPlatform } from "./platform/WebPlatform.js";
import { WebProgressStore } from "./platform/WebProgressStore.js";
import { initialCampaignProgress } from "./progress/CampaignProgress.js";

const platform = new WebPlatform();
const progressStore = new WebProgressStore();
const resetProgress = isProgressResetRequested(window.location.search);
if (resetProgress) progressStore.clear();
const debugStart = parseDebugStart(window.location.search);
const progress = resetProgress ? initialCampaignProgress() : progressStore.load();
const startup = resolveCampaignStartup(progress, debugStart);
const automaticRenderScale = computeRenderScale(window.devicePixelRatio || 1);
const renderScale = isLegacyRenderScaleDebugRequested(window.location.search)
  ? 1
  : automaticRenderScale;
const scene = isSymbolGalleryRequested(window.location.search)
  ? new SymbolGalleryScene(renderScale)
  : new PlayScene(platform, startup.position, renderScale,
    startup.persistenceEnabled ? { store: progressStore, progress } : null);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#10182b",
  scene: [scene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // The backing canvas follows the capped DPR while the camera retains this world view.
    width: LOGICAL_GAME_WIDTH * renderScale,
    height: LOGICAL_GAME_HEIGHT * renderScale,
  },
});
