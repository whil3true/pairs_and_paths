import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { BoardLayout, getVisibleBackingCount } from "../.test-dist/game/BoardLayout.js";
import {
  BOARD_ARTWORK_APERTURE_INSET, BOARD_ARTWORK_APERTURE_RADIUS, BOARD_FRAME_PADDING,
  BOARD_SHEET_OFFSET_X, BOARD_SHEET_OFFSET_Y, BOARD_SHEET_SHADE_ALPHA,
  BOARD_VISUAL_STYLE, getBackingSheetShadeAlpha, getBoardArtworkApertureBounds,
  getBoardArtworkApertureCorners, getBoardContentBounds, getBoardFrameBounds, getBoardFrameOpening,
} from "../.test-dist/game/BoardVisualPolicy.js";
import { isSymbolGalleryRequested, parseDebugLocale, parseDebugStart } from "../.test-dist/game/DebugStart.js";
import {
  computePortraitFrame, computeRenderScale, isLegacyRenderScaleDebugRequested,
  LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH, MAX_LOGICAL_VIEWPORT_HEIGHT, MAX_RENDER_SCALE, MIN_RENDER_SCALE,
} from "../.test-dist/game/Display.js";
import { applyMove, findLegalMoves, findPath, solveBoard, validateGeneratedLevel } from "../.test-dist/domain/index.js";
import {
  CAMPAIGN_BLOCKERS, CHAPTER_COUNT, LEVELS_PER_CHAPTER, PROGRESSION_BANDS, TOTAL_LEVELS,
  createLevel, getChapterNumber, getLevelConfig, hasNextLevel, levelSeed,
  MULTI_STAGE_LEVELS, createLevelStage, getLevelStageConfigs, getStageClearOutcome, getStageCount, preStageSeed,
} from "../.test-dist/game/LevelSequence.js";
import {
  getTileSymbol, LEGACY_SYMBOL_DISPLAY_SIZE, PRODUCTION_SYMBOL_DISPLAY_SIZE, TILE_SYMBOLS,
} from "../.test-dist/game/TileSymbols.js";
import { resolveTileCardFrame, TILE_VISUAL_STYLE } from "../.test-dist/game/TileVisual.js";
import {
  BOARD_CARD_FRAMES, BOARD_RUNTIME_ATLAS_COLUMNS, BOARD_RUNTIME_ATLAS_ROWS, BOARD_SYMBOL_FRAMES,
  computeBoardRuntimeAtlasLayout, getBoardSymbolFrameName,
} from "../.test-dist/game/BoardRuntimeAtlas.js";
import {
  computeContainedSquarePlacement, getLevelArtwork, isArtworkRevealStage, isArtworkUnlocked, LEVEL_ARTWORK,
} from "../.test-dist/game/LevelArtwork.js";
import {
  getArtworkGallerySlotState, getDefaultArtworkGalleryChapter, getUnlockedArtworkCount,
  getUnlockedArtworkCountInChapter,
} from "../.test-dist/game/ArtworkGallery.js";
import {
  ARTWORK_FULL_VIEW_LAYOUT, ARTWORK_GALLERY_LAYOUT, ARTWORK_GALLERY_THUMBNAIL, getArtworkGallerySlotBounds,
} from "../.test-dist/game/ArtworkGalleryVisualPolicy.js";
import {
  BORDERS, COMPONENT_RADII, FONT_DISPLAY_FAMILY, FONT_UI_FAMILY, MOTION, RADII, SPACING, TYPOGRAPHY,
  VISUAL_COLORS,
} from "../.test-dist/game/VisualTokens.js";
import { createButtonHitArea, resolveButtonVisual } from "../.test-dist/game/UiPolicy.js";
import { createViewportBackdrop } from "../.test-dist/game/UiPrimitives.js";
import { GAMEPLAY_HUD } from "../.test-dist/game/GameplayHudPolicy.js";
import {
  BLOCKER_VISUAL_STYLE, createPolylineMetrics, GAMEPLAY_FEEDBACK, partialPolyline,
  partialPolylineFromMetrics,
} from "../.test-dist/game/GameplayFeedbackPolicy.js";
import { getChapterTitle, getUiStrings, UI_STRINGS } from "../.test-dist/game/Localization.js";
import { CHAPTER_PRESENTATIONS, getChapterPresentation, getLevelChapterPresentation } from "../.test-dist/game/ChapterPresentation.js";
import { CHAPTER_BANNER_ASSETS, getChapterBannerAsset } from "../.test-dist/game/ChapterBannerAssets.js";
import {
  computeContainedChapterBannerPlacement, getChapterBannerFallbackManifest, shouldOccludeChapterBannerCorners,
} from "../.test-dist/game/ChapterBannerVisual.js";
import { formatMainMenuBrandTitle, formatPrimaryMenuAction, getMainMenuBrandLayout, MAIN_MENU_BRAND_MOTIF, MAIN_MENU_LAYOUT, progressRatio } from "../.test-dist/game/MainMenuVisualPolicy.js";
import { canNavigateChapter, getLevelCardBounds, getLevelCardGeometry, LEVEL_SELECT_LAYOUT, resolveLevelCardVisual } from "../.test-dist/game/LevelSelectVisualPolicy.js";
import { getPrimaryMenuAction } from "../.test-dist/game/CampaignNavigation.js";
import { getProductionFontProbes } from "../.test-dist/game/TypographyAssets.js";
import {
  COMPLETE_LAYOUT, getRewardMotionPolicy, REWARD_LAYOUT, REWARD_TRANSITION_DIM_ALPHA,
} from "../.test-dist/game/RewardVisualPolicy.js";
import { getPauseMotionPolicy, PAUSE_FADE_EASE, PAUSE_LAYOUT } from "../.test-dist/game/PauseVisualPolicy.js";

const progressAt = (completedThroughLevel) => ({ version: 1, completedThroughLevel });

test("Phase 4 localization dictionaries have equivalent complete shapes", () => {
  assert.deepEqual(Object.keys(UI_STRINGS).sort(), ["en", "ru"]);
  assert.deepEqual(Object.keys(UI_STRINGS.ru).sort(), Object.keys(UI_STRINGS.en).sort());
  const required = ["gameTitle", "brandTitle", "brandDescriptor", "tagline", "play", "gameplayPause", "gameplayHint", "remainingPairs", "stageLabel", "continueLevel", "playAgainLevel", "levels", "gallery",
    "openedProgress", "collectionComplete", "chapterLabel", "chapterHeader", "globalProgress", "backToMenu",
    "galleryChapterProgress", "levelLabel", "gallerySoon", "galleryLoading", "galleryUnavailable", "back",
    "artworkLoading", "artworkUnavailable",
    "rewardHeading", "rewardContinue", "levelComplete", "campaignComplete", "nextLevel", "restartFromLevelOne",
    "replayLevel", "menu", "pauseTitle", "pauseResume", "pauseRestart", "pauseExit",
    "restartConfirmTitle", "restartConfirmBody", "restartConfirmAction", "exitConfirmTitle",
    "exitConfirmBody", "exitConfirmAction", "cancel", "chapterTitles"];
  assert.deepEqual(Object.keys(UI_STRINGS.ru).sort(), required.sort());
  assert.equal(UI_STRINGS.ru.chapterTitles.length, 10);
  assert.equal(UI_STRINGS.en.chapterTitles.length, 10);
  assert.equal(getUiStrings("ru").brandTitle, "Уютная галерея");
  assert.equal(getUiStrings("ru").brandDescriptor, "Соедини пары");
  assert.equal(getUiStrings("en").brandTitle, "Cozy Gallery");
  assert.equal(getUiStrings("en").brandDescriptor, "Pair Connect");
  assert.equal(getUiStrings("ru").continueLevel(30), "Продолжить · Уровень 30");
  assert.equal(getUiStrings("en").continueLevel(30), "Continue · Level 30");
  assert.equal(getUiStrings("ru").openedProgress(29, 100), "Открыто 29 из 100");
  assert.equal(getUiStrings("en").openedProgress(29, 100), "Unlocked 29 of 100");
});

test("Pause and confirmation production policy freezes layout, motion, and localization", () => {
  assert.deepEqual(PAUSE_LAYOUT.panel, { centerX: 240, centerY: 400, width: 416, height: 360 });
  assert.deepEqual(PAUSE_LAYOUT.button, { centerX: 240, width: 368, height: 52, gap: 12 });
  assert.deepEqual(PAUSE_LAYOUT.pauseButtonCenters, [360, 424, 488]);
  assert.deepEqual(PAUSE_LAYOUT.confirmationButtonCenters, { safe: 420, danger: 484 });
  assert.equal(PAUSE_FADE_EASE, "Linear");
  assert.deepEqual(getPauseMotionPolicy(false), {
    enterDuration: 200, exitDuration: 160, contentDelay: 45, contentDuration: 155, contentLift: 8,
  });
  assert.deepEqual(getPauseMotionPolicy(true), {
    enterDuration: 100, exitDuration: 80, contentDelay: 0, contentDuration: 100, contentLift: 0,
  });
  assert.deepEqual(
    [getUiStrings("ru").pauseTitle, getUiStrings("ru").pauseResume, getUiStrings("ru").pauseRestart,
      getUiStrings("ru").pauseExit, getUiStrings("ru").restartConfirmTitle,
      getUiStrings("ru").restartConfirmBody, getUiStrings("ru").restartConfirmAction,
      getUiStrings("ru").exitConfirmTitle, getUiStrings("ru").exitConfirmBody,
      getUiStrings("ru").exitConfirmAction, getUiStrings("ru").cancel],
    ["Пауза", "Продолжить", "Начать уровень заново", "Выйти в меню", "Начать заново?",
      "Текущий уровень начнётся с первого этапа.", "Начать заново", "Выйти в меню?",
      "Незавершённый уровень не сохранится.", "Выйти", "Отмена"],
  );
  assert.deepEqual(
    [getUiStrings("en").pauseTitle, getUiStrings("en").pauseResume, getUiStrings("en").pauseRestart,
      getUiStrings("en").pauseExit, getUiStrings("en").restartConfirmTitle,
      getUiStrings("en").restartConfirmBody, getUiStrings("en").restartConfirmAction,
      getUiStrings("en").exitConfirmTitle, getUiStrings("en").exitConfirmBody,
      getUiStrings("en").exitConfirmAction, getUiStrings("en").cancel],
    ["Paused", "Resume", "Restart level", "Exit to menu", "Restart level?",
      "The current level will restart from Stage 1.", "Restart", "Exit to menu?",
      "Unfinished level progress will not be saved.", "Exit", "Cancel"],
  );
});

test("danger button policy uses the production danger token and tactile press", () => {
  const defaultVisual = resolveButtonVisual("danger", "default");
  const pressedVisual = resolveButtonVisual("danger", "pressed");
  assert.equal(defaultVisual.fill, VISUAL_COLORS.state.danger.phaser);
  assert.equal(defaultVisual.label, VISUAL_COLORS.white.hex);
  assert.equal(pressedVisual.fill, VISUAL_COLORS.state.danger.phaser);
  assert.equal(pressedVisual.offsetY, 2);
  assert.equal(resolveButtonVisual("primary", "default").fill, VISUAL_COLORS.primary.action.phaser);
  assert.equal(resolveButtonVisual("secondary", "default").fill, VISUAL_COLORS.surface.card.phaser);
});

test("Reward and Complete presentation policy freezes layout, motion, and localization", () => {
  assert.deepEqual(REWARD_LAYOUT.artwork,
    { x: 40, y: 124, width: 400, height: 400, centerX: 240, centerY: 324 });
  assert.deepEqual(REWARD_LAYOUT.continueButton,
    { x: 72, y: 620, width: 336, height: 56, centerX: 240, centerY: 648 });
  assert.equal(REWARD_TRANSITION_DIM_ALPHA, 0.22);
  assert.ok(REWARD_TRANSITION_DIM_ALPHA > 0 && REWARD_TRANSITION_DIM_ALPHA <= 0.25);
  assert.deepEqual(COMPLETE_LAYOUT.panel, { centerX: 240, centerY: 410, width: 416, height: 360 });
  const normal = getRewardMotionPolicy(false);
  const reduced = getRewardMotionPolicy(true);
  assert.ok(normal.holdDuration >= 450 && normal.holdDuration <= 650);
  assert.ok(normal.transitionDuration >= 280 && normal.transitionDuration <= 360);
  assert.deepEqual(normal, { holdDuration: 500, transitionDuration: 320, spatialTravel: true });
  assert.deepEqual(reduced, { holdDuration: 250, transitionDuration: 150, spatialTravel: false });
  assert.ok(reduced.holdDuration < normal.holdDuration);
  assert.ok(reduced.transitionDuration < normal.transitionDuration);
  assert.equal(getUiStrings("ru").rewardHeading, "Картина открыта");
  assert.equal(getUiStrings("en").rewardHeading, "Artwork unlocked");
  assert.equal(getUiStrings("ru").rewardContinue, "Продолжить");
  assert.equal(getUiStrings("en").rewardContinue, "Continue");
  assert.deepEqual(
    [getUiStrings("ru").levelComplete, getUiStrings("ru").campaignComplete,
      getUiStrings("ru").nextLevel, getUiStrings("ru").restartFromLevelOne,
      getUiStrings("ru").replayLevel, getUiStrings("ru").menu],
    ["Уровень пройден", "Кампания пройдена", "Следующий уровень", "Начать с уровня 1",
      "Переиграть уровень", "Меню"],
  );
  assert.deepEqual(
    [getUiStrings("en").levelComplete, getUiStrings("en").campaignComplete,
      getUiStrings("en").nextLevel, getUiStrings("en").restartFromLevelOne,
      getUiStrings("en").replayLevel, getUiStrings("en").menu],
    ["Level complete", "Campaign complete", "Next level", "Restart from Level 1", "Replay level", "Menu"],
  );
  assert.equal(getUiStrings("ru").chapterHeader(3, getChapterTitle("ru", 3)), "Глава 3 · Цветочные лавки");
  assert.equal(getUiStrings("en").chapterHeader(3, getChapterTitle("en", 3)), "Chapter 3 · Flower Shops");
});

test("localized chapter names are exact and numbered one through ten", () => {
  assert.deepEqual(Array.from({ length: 10 }, (_, index) => getChapterTitle("ru", index + 1)), [
    "Утро дома", "Чай и выпечка", "Цветочные лавки", "Книги и письма", "Сады и дворики",
    "У моря", "Дороги и станции", "Осенние огни", "Зимние окна", "Тихая магия",
  ]);
  assert.deepEqual(Array.from({ length: 10 }, (_, index) => getChapterTitle("en", index + 1)), [
    "Morning at Home", "Tea & Baking", "Flower Shops", "Books & Letters", "Gardens & Courtyards",
    "By the Sea", "Roads & Stations", "Autumn Lights", "Winter Windows", "Quiet Magic",
  ]);
  for (const invalid of [0, 11, 1.5]) assert.throws(() => getChapterTitle("ru", invalid), RangeError);
});

test("main menu production geometry, progress, and localized primary actions are stable", () => {
  assert.deepEqual(MAIN_MENU_LAYOUT.preview, { x: 24, y: 124, width: 432, height: 232 });
  assert.deepEqual(MAIN_MENU_LAYOUT.primary, { x: 24, y: 380, width: 432, height: 64 });
  assert.deepEqual(MAIN_MENU_LAYOUT.secondaryLeft, { x: 24, y: 460, width: 208, height: 56 });
  assert.deepEqual(MAIN_MENU_LAYOUT.secondaryRight, { x: 248, y: 460, width: 208, height: 56 });
  assert.deepEqual(MAIN_MENU_LAYOUT.progress, { x: 24, y: 540, width: 432, height: 104 });
  assert.deepEqual([0, 1, 50, 100].map((value) => progressRatio(value, 100)), [0, 0.01, 0.5, 1]);
  for (const [completed, ru, en, target] of [[0, "Играть", "Play", 1], [17, "Продолжить · Уровень 18", "Continue · Level 18", 18],
    [100, "Играть снова · Уровень 1", "Play Again · Level 1", 1]]) {
    const action = getPrimaryMenuAction(progressAt(completed));
    assert.equal(action.levelNumber, target);
    assert.equal(formatPrimaryMenuAction(action, UI_STRINGS.ru), ru);
    assert.equal(formatPrimaryMenuAction(action, UI_STRINGS.en), en);
  }
});

test("main menu keeps its preview, secondary actions, and progress card borderless", async () => {
  const source = await readFile(new URL("../src/game/MainMenuScene.ts", import.meta.url), "utf8");
  assert.match(source, /createChapterBanner\(this, previewChapter, preview, false\)/);
  assert.match(source, /borderless: true/);
  assert.match(source, /borderRole: "none"/);
  assert.match(source, /preview\.y \+ 35[\s\S]*setOrigin\(0, 0\.5\)/);
  assert.match(source, /preview\.height - 40[\s\S]*setOrigin\(0, 0\.5\)/);
});

test("main menu locked brand plus descriptor composition clears the preview in both locales", () => {
  for (const locale of ["ru", "en"]) {
    const layout = getMainMenuBrandLayout(locale);
    assert.ok(layout.titleTop + layout.titleLineHeight < layout.descriptorTop);
    assert.ok(layout.descriptorTop + layout.descriptorLineHeight < MAIN_MENU_LAYOUT.preview.y);
    assert.equal(layout.titleRole, "displayBrand");
    assert.equal(layout.titleTracking, 0.35);
    assert.equal(layout.descriptorRole, "brandDescriptor");
  }
});

test("Main Menu decorative pair motif stays within descriptor row and away from text", () => {
  for (const locale of ["ru", "en"]) {
    const layout = getMainMenuBrandLayout(locale);
    assert.ok(MAIN_MENU_BRAND_MOTIF.y - 9 >= layout.descriptorTop);
    assert.ok(MAIN_MENU_BRAND_MOTIF.y + 9 <= layout.descriptorTop + layout.descriptorLineHeight);
  }
  assert.ok(MAIN_MENU_BRAND_MOTIF.leftX + 20 < 180);
  assert.ok(MAIN_MENU_BRAND_MOTIF.rightX - 20 > 300);
});

test("Main Menu Literata CAPS pilot formats RU and EN without changing localized naming", () => {
  assert.equal(formatMainMenuBrandTitle(UI_STRINGS.ru.brandTitle, "ru"), "УЮТНАЯ ГАЛЕРЕЯ");
  assert.equal(formatMainMenuBrandTitle(UI_STRINGS.en.brandTitle, "en"), "COZY GALLERY");
  assert.equal(UI_STRINGS.ru.brandTitle, "Уютная галерея");
  assert.equal(UI_STRINGS.en.brandTitle, "Cozy Gallery");
});

test("production typography roles use Literata only for brand and Onest 400 through 600 for UI", () => {
  assert.equal(FONT_DISPLAY_FAMILY, '"Literata", Georgia, "Times New Roman", serif');
  assert.equal(FONT_UI_FAMILY, '"Onest", system-ui, -apple-system, "Segoe UI", Arial, sans-serif');
  assert.deepEqual(
    Object.fromEntries(Object.entries(TYPOGRAPHY).map(([role, token]) => [role, [token.family, token.weight]])),
    {
      displayBrand: ["display", 600],
      brandDescriptor: ["ui", 600],
      screenTitle: ["ui", 600],
      chapterHeading: ["ui", 600],
      sectionHeading: ["ui", 600],
      levelTitle: ["ui", 600],
      hudPrimary: ["ui", 600],
      hudSecondary: ["ui", 500],
      buttonPrimary: ["ui", 600],
      buttonSecondary: ["ui", 600],
      body: ["ui", 400],
      caption: ["ui", 500],
      smallMetadata: ["ui", 500],
    },
  );
});

test("production font probes cover active locale and every shipped UI weight", () => {
  const ru = getProductionFontProbes("ru");
  const en = getProductionFontProbes("en");
  assert.deepEqual(ru.map(({ family, weight }) => [family, weight]),
    [["Literata", 600], ["Onest", 400], ["Onest", 500], ["Onest", 600]]);
  assert.deepEqual(en.map(({ family, weight }) => [family, weight]),
    [["Literata", 600], ["Onest", 400], ["Onest", 500], ["Onest", 600]]);
  assert.ok(ru.some(({ text }) => /[А-Яа-яЁё]/.test(text)));
  assert.ok(en.every(({ text }) => !/[А-Яа-яЁё]/.test(text)));
});

test("production font CSS references the exact pinned uploaded WOFF2 files and both licenses exist", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  for (const path of [
    "literata/literata_5.3.0_cyrillic-600-normal.woff2",
    "literata/literata_5.3.0_latin-600-normal.woff2",
    "onest/onest_5.3.1_cyrillic-wght-normal.woff2",
    "onest/onest_5.3.1_latin-wght-normal.woff2",
  ]) assert.ok(css.includes(path), `missing production font asset reference: ${path}`);
  for (const license of ["Literata-OFL.txt", "Onest-OFL.txt"]) {
    const text = await readFile(new URL(`../public/assets/fonts/licenses/${license}`, import.meta.url), "utf8");
    assert.match(text, /SIL OPEN FONT LICENSE Version 1\.1/);
  }
});

test("production chapter banner mapping is complete, explicit, and deterministic", () => {
  const expectedPaths = [
    "chapter-banner-01-morning-home.webp", "chapter-banner-02-tea-baking.webp",
    "chapter-banner-03-flower-shops.webp", "chapter-banner-04-books-letters.webp",
    "chapter-banner-05-gardens-courtyards.webp", "chapter-banner-06-by-the-sea.webp",
    "chapter-banner-07-roads-stations.webp", "chapter-banner-08-autumn-lights.webp",
    "chapter-banner-09-winter-windows.webp", "chapter-banner-10-quiet-magic.webp",
  ].map((name) => `assets/chapter-banners/${name}`);
  assert.equal(CHAPTER_BANNER_ASSETS.length, 10);
  assert.deepEqual(CHAPTER_BANNER_ASSETS.map(({ chapterNumber }) => chapterNumber), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(CHAPTER_BANNER_ASSETS.map(({ assetKey }) => assetKey),
    ["chapter-banner-01", "chapter-banner-02", "chapter-banner-03", "chapter-banner-04", "chapter-banner-05",
      "chapter-banner-06", "chapter-banner-07", "chapter-banner-08", "chapter-banner-09", "chapter-banner-10"]);
  assert.deepEqual(CHAPTER_BANNER_ASSETS.map(({ path }) => path), expectedPaths);
  assert.equal(new Set(CHAPTER_BANNER_ASSETS.map(({ assetKey }) => assetKey)).size, 10);
  assert.equal(new Set(CHAPTER_BANNER_ASSETS.map(({ path }) => path)).size, 10);
  for (let chapter = 1; chapter <= 10; chapter += 1) {
    assert.equal(getChapterBannerAsset(chapter), CHAPTER_BANNER_ASSETS[chapter - 1]);
  }
  for (const invalid of [0, 11, 1.5, Number.NaN]) assert.throws(() => getChapterBannerAsset(invalid), RangeError);
});

test("chapter banner contain geometry preserves the production aspect ratio", () => {
  assert.deepEqual(computeContainedChapterBannerPlacement({ x: 24, y: 124, width: 432, height: 232 }),
    { x: 24, y: 158, width: 432, height: 164 });
  assert.deepEqual(computeContainedChapterBannerPlacement({ x: 24, y: 116, width: 432, height: 164 }),
    { x: 24, y: 116, width: 432, height: 164 });
  assert.deepEqual(computeContainedChapterBannerPlacement({ x: 10, y: 20, width: 216, height: 200 }),
    { x: 10, y: 79, width: 216, height: 82 });
  for (const bounds of [
    { x: 0, y: 0, width: 0, height: 164 }, { x: 0, y: 0, width: 432, height: -1 },
    { x: 0, y: 0, width: Number.POSITIVE_INFINITY, height: 164 },
  ]) assert.throws(() => computeContainedChapterBannerPlacement(bounds), RangeError);
});

test("chapter banner corner occlusion is limited to images that fill their destination", () => {
  const levelSelectBounds = { x: 24, y: 116, width: 432, height: 164 };
  const mainMenuBounds = { x: 24, y: 124, width: 432, height: 232 };
  assert.equal(shouldOccludeChapterBannerCorners(
    levelSelectBounds, computeContainedChapterBannerPlacement(levelSelectBounds),
  ), true);
  assert.equal(shouldOccludeChapterBannerCorners(
    mainMenuBounds, computeContainedChapterBannerPlacement(mainMenuBounds),
  ), false);
});

test("chapter presentation and fallback-only manifests remain restrained and deterministic campaign-wide", () => {
  assert.equal(CHAPTER_PRESENTATIONS.length, 10);
  assert.deepEqual(CHAPTER_PRESENTATIONS.map(({ number }) => number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (let chapter = 1; chapter <= 10; chapter += 1) {
    assert.equal(getChapterPresentation(chapter).number, chapter);
    assert.deepEqual(getChapterBannerFallbackManifest(chapter), getChapterBannerFallbackManifest(chapter));
    assert.equal(getChapterBannerFallbackManifest(chapter).length, 4);
    assert.deepEqual(getChapterBannerFallbackManifest(chapter).map(({ kind }) => kind),
      ["innerTint", "leftRail", "bottomRail", "cornerChip"]);
  }
  assert.deepEqual(getChapterBannerFallbackManifest(1), [
    { kind: "innerTint", inset: 16, radius: 16, colorRole: "primary", alpha: 0.10 },
    { kind: "leftRail", inset: 16, width: 10, radius: 5, colorRole: "primary", alpha: 0.84 },
    { kind: "bottomRail", inset: 16, height: 10, radius: 5, colorRole: "accent", alpha: 0.84 },
    { kind: "cornerChip", top: 16, right: 16, width: 72, height: 26, radius: 10, colorRole: "secondary", alpha: 0.78 },
  ]);
  for (let level = 1; level <= 100; level += 1) assert.equal(getLevelChapterPresentation(level).number, getChapterNumber(level));
  for (const invalid of [0, 11, 1.5]) assert.throws(() => getChapterPresentation(invalid), RangeError);
});

test("level select geometry, navigation boundaries, and semantic cards are stable", () => {
  assert.deepEqual(LEVEL_SELECT_LAYOUT.header, {
    chapterLabelTop: 22, chapterTitleTop: 46, progressTop: 82,
    chapterLabelLineHeight: 20, chapterTitleLineHeight: 30, progressLineHeight: 24,
  });
  assert.deepEqual(LEVEL_SELECT_LAYOUT.banner, { x: 24, y: 116, width: 432, height: 164 });
  assert.deepEqual(LEVEL_SELECT_LAYOUT.previous, { centerX: 48, centerY: 316, width: 48, height: 48 });
  assert.deepEqual(LEVEL_SELECT_LAYOUT.next, { centerX: 432, centerY: 316, width: 48, height: 48 });
  assert.deepEqual(LEVEL_SELECT_LAYOUT.back, { x: 24, y: 708, width: 432, height: 56 });
  const header = LEVEL_SELECT_LAYOUT.header;
  assert.ok(header.chapterLabelTop + header.chapterLabelLineHeight <= header.chapterTitleTop);
  assert.ok(header.chapterTitleTop + header.chapterTitleLineHeight <= header.progressTop);
  assert.ok(header.progressTop + header.progressLineHeight < LEVEL_SELECT_LAYOUT.banner.y);
  const bannerBottom = LEVEL_SELECT_LAYOUT.banner.y + LEVEL_SELECT_LAYOUT.banner.height;
  const navigationTop = LEVEL_SELECT_LAYOUT.previous.centerY - LEVEL_SELECT_LAYOUT.previous.height / 2;
  const navigationBottom = LEVEL_SELECT_LAYOUT.previous.centerY + LEVEL_SELECT_LAYOUT.previous.height / 2;
  assert.deepEqual({ bannerBottom, navigationTop, navigationBottom, gridTop: LEVEL_SELECT_LAYOUT.grid.y },
    { bannerBottom: 280, navigationTop: 292, navigationBottom: 340, gridTop: 352 });
  assert.equal(navigationTop - bannerBottom, 12);
  assert.equal(LEVEL_SELECT_LAYOUT.grid.y - navigationBottom, 12);
  const cards = Array.from({ length: 10 }, (_, index) => getLevelCardBounds(index));
  assert.deepEqual(cards[0], { x: 24, y: 352, width: 72, height: 72 });
  assert.deepEqual(cards[4], { x: 384, y: 352, width: 72, height: 72 });
  assert.deepEqual(cards[5], { x: 24, y: 448, width: 72, height: 72 });
  assert.deepEqual(cards[9], { x: 384, y: 448, width: 72, height: 72 });
  assert.deepEqual(getLevelCardGeometry(cards[0]), {
    centerX: 60, centerY: 388, interactiveWidth: 72, interactiveHeight: 72,
  });
  assert.deepEqual(canNavigateChapter(1), { previous: false, next: true });
  assert.deepEqual(canNavigateChapter(10), { previous: true, next: false });
  assert.deepEqual(["completed", "available", "locked"].map((state) => {
    const visual = resolveLevelCardVisual(state);
    return [visual.affordance, visual.selectable, visual.numberSize, visual.borderWidth];
  }), [["check", true, 22, 0], ["tab", true, 22, 0], ["lock", false, 20, 0]]);
});

test("level-card release navigation survives pointerout after a confirmed tap", async () => {
  const source = await readFile(new URL("../src/game/LevelSelectScene.ts", import.meta.url), "utf8");
  assert.match(source, /new Phaser\.Geom\.Rectangle\(0, 0, geometry\.interactiveWidth, geometry\.interactiveHeight\)/);
  assert.match(source, /let activating = false/);
  assert.match(source, /const resetPress = \(\): void => \{[\s\S]*if \(activating\) return/);
  assert.match(source, /pointerdown[\s\S]*targets:\s*card[\s\S]*scaleX:\s*0\.96[\s\S]*MOTION\.buttonPressDown/);
  assert.match(source, /pointerup[\s\S]*activating = true[\s\S]*targets:\s*card[\s\S]*MOTION\.buttonPressUp[\s\S]*onComplete:\s*\(\) => this\.scene\.start\("PlayScene"/);
  assert.doesNotMatch(source, /const pressVisual = card\.getAt/);
});

test("pause content enters after the shell instead of appearing as a static first frame", async () => {
  const policy = await import("../.test-dist/game/PauseVisualPolicy.js");
  const normal = policy.getPauseMotionPolicy(false);
  const reduced = policy.getPauseMotionPolicy(true);
  assert.deepEqual(normal, {
    enterDuration: 200, exitDuration: 160, contentDelay: 45, contentDuration: 155, contentLift: 8,
  });
  assert.deepEqual(reduced, {
    enterDuration: 100, exitDuration: 80, contentDelay: 0, contentDuration: 100, contentLift: 0,
  });
  const source = await readFile(new URL("../src/game/PlayScene.ts", import.meta.url), "utf8");
  assert.match(source, /content\.setAlpha\(0\)\.setY\(motion\.contentLift\)/);
  assert.match(source, /targets:\s*content[\s\S]*delay:\s*motion\.contentDelay[\s\S]*duration:\s*motion\.contentDuration/);
});

test("portrait startup root matches the game field while landscape restores the oat backdrop", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  assert.match(css, /--page-backdrop-color:\s*#F5EEDF/);
  assert.match(css, /@media \(orientation: landscape\)[\s\S]*--page-backdrop-color:\s*#E7DCC8/);
});

test("level-select states remain distinct without structural borders", () => {
  const completed = resolveLevelCardVisual("completed");
  const available = resolveLevelCardVisual("available");
  const locked = resolveLevelCardVisual("locked");
  assert.equal(completed.fill, VISUAL_COLORS.state.selectedFill.phaser);
  assert.equal(available.fill, VISUAL_COLORS.state.hintFill.phaser);
  assert.equal(locked.fill, VISUAL_COLORS.state.lockedFill.phaser);
  assert.deepEqual([completed.borderWidth, available.borderWidth, locked.borderWidth], [0, 0, 0]);
  assert.deepEqual([completed.affordance, available.affordance, locked.affordance], ["check", "tab", "lock"]);
});

test("debug locale override is gated, valid, non-persistent, and defaults to Russian", () => {
  assert.equal(parseDebugLocale(""), "ru");
  assert.equal(parseDebugLocale("?locale=en"), "ru");
  assert.equal(parseDebugLocale("?debug=1&locale=en"), "en");
  for (const search of ["?debug=1", "?debug=1&locale=ru", "?debug=1&locale=de", "?debug=0&locale=en"]) {
    assert.equal(parseDebugLocale(search), "ru");
  }
});

test("production visual tokens protect core palette and layout invariants", () => {
  assert.equal(VISUAL_COLORS.bg.app.hex, "#F5EEDF");
  assert.equal(VISUAL_COLORS.bg.app.phaser, 0xf5eedf);
  assert.equal(VISUAL_COLORS.primary.action.hex, "#A34F3B");
  assert.equal(VISUAL_COLORS.primary.actionHover.hex, "#B05A44");
  assert.equal(VISUAL_COLORS.primary.actionPressed.hex, "#873E31");
  assert.equal(VISUAL_COLORS.route.core.hex, "#0B7475");
  assert.equal(VISUAL_COLORS.state.success.hex, "#2D7464");
  assert.equal(VISUAL_COLORS.state.danger.hex, "#A5423F");
  assert.equal("error" in VISUAL_COLORS, false);
  assert.equal(SPACING.minimumTouchTarget, 48);
  assert.equal(SPACING.primaryButtonHeight, 56);
  for (const value of [SPACING.screenMargin, SPACING.boardMargin, SPACING.cardPadding,
    SPACING.buttonPadding, SPACING.buttonStackGap, SPACING.iconLabelGap]) assert.equal(value % 4, 0);
  assert.deepEqual(RADII, { s: 8, m: 12, l: 16, xl: 20, modal: 24 });
  assert.equal(COMPONENT_RADII.boardOuter, 24);
  assert.deepEqual(BORDERS, { divider: 1, structural: 2, emphasized: 3 });
  assert.equal(MOTION.hint, 900);
  assert.deepEqual([MOTION.stageLift, MOTION.stageSettle], [220, 140]);
});

test("typography roles preserve production floors and valid metrics", () => {
  assert.equal(Object.keys(TYPOGRAPHY).length, 13);
  for (const role of Object.values(TYPOGRAPHY)) {
    assert.ok(role.weight >= 400 && role.weight <= 600);
    assert.ok(role.size >= 14);
    assert.ok(role.lineHeight >= role.size);
    assert.ok(role.family === "display" || role.family === "ui");
  }
  assert.equal(TYPOGRAPHY.hudSecondary.size, 16);
  assert.deepEqual(TYPOGRAPHY.chapterHeading,
    { family: "ui", weight: 600, size: 24, lineHeight: 30, tracking: -0.2, align: "center" });
  assert.equal(TYPOGRAPHY.buttonPrimary.size, 19);
});

test("button visual policy is deterministic and exposes disabled and focus states", () => {
  assert.equal(resolveButtonVisual("secondary", "hover").fill, VISUAL_COLORS.secondaryHover.phaser);
  assert.equal(resolveButtonVisual("secondary", "pressed").fill, VISUAL_COLORS.secondaryPressed.phaser);
  assert.equal(resolveButtonVisual("tertiary", "pressed").fill, VISUAL_COLORS.secondaryPressed.phaser);
  const primaryPressed = resolveButtonVisual("primary", "pressed");
  assert.deepEqual(resolveButtonVisual("primary", "pressed"), primaryPressed);
  assert.equal(primaryPressed.fill, VISUAL_COLORS.primary.actionPressed.phaser);
  assert.equal(primaryPressed.offsetY, 2);
  const primaryHover = resolveButtonVisual("primary", "hover");
  assert.equal(primaryHover.fill, VISUAL_COLORS.primary.actionHover.phaser);
  assert.notEqual(primaryHover.fill, VISUAL_COLORS.primary.action.phaser);
  assert.equal(primaryHover.offsetY, -1);
  assert.equal(resolveButtonVisual("primary", "disabled").fill, VISUAL_COLORS.primary.actionDisabled.phaser);
  assert.equal(resolveButtonVisual("primary", "disabled").offsetY, 0);
  assert.equal(resolveButtonVisual("secondary", "disabled").border, VISUAL_COLORS.state.locked.phaser);
  assert.equal(resolveButtonVisual("secondary", "disabled").borderWidth, 0);
  assert.equal(resolveButtonVisual("secondary", "default").borderWidth, 0);
  assert.equal(resolveButtonVisual("secondary", "focus").focusRing, true);
});

test("button hit area matches the sized Container's local visual rectangle", () => {
  const hitArea = createButtonHitArea(104, 48);
  assert.deepEqual(hitArea, {
    left: 0, top: 0, right: 104, bottom: 48,
    width: 104, height: 48, centerX: 52, centerY: 24,
  });
  assert.equal(hitArea.centerX, (hitArea.left + hitArea.right) / 2);
  assert.equal(hitArea.centerY, (hitArea.top + hitArea.bottom) / 2);
});

test("gameplay HUD policy freezes compact production bounds and localized copy", () => {
  assert.deepEqual(GAMEPLAY_HUD.pause, { left: 24, top: 20, width: 104, height: 48, centerX: 76, centerY: 44 });
  assert.deepEqual(GAMEPLAY_HUD.hint, { left: 352, top: 20, width: 104, height: 48, centerX: 404, centerY: 44 });
  assert.deepEqual(
    [GAMEPLAY_HUD.statusLeftX, GAMEPLAY_HUD.statusRightX, GAMEPLAY_HUD.stageCenterX],
    [24, 456, 240],
  );

  assert.deepEqual(
    [UI_STRINGS.ru.gameplayPause, UI_STRINGS.ru.gameplayHint, UI_STRINGS.ru.stageLabel(1, 2)],
    ["Пауза", "Подсказка", "Этап 1/2"],
  );
  assert.deepEqual(
    [UI_STRINGS.en.gameplayPause, UI_STRINGS.en.gameplayHint, UI_STRINGS.en.stageLabel(1, 2)],
    ["Pause", "Hint", "Stage 1/2"],
  );

  for (const [count, word] of [[1, "пара"], [2, "пары"], [4, "пары"], [5, "пар"], [11, "пар"],
    [21, "пара"], [22, "пары"], [25, "пар"]]) {
    assert.equal(UI_STRINGS.ru.remainingPairs(count), `Осталось: ${count} ${word}`);
  }
  assert.equal(UI_STRINGS.en.remainingPairs(1), "Remaining: 1 pair");
  assert.equal(UI_STRINGS.en.remainingPairs(2), "Remaining: 2 pairs");
});

test("partial route progression follows physical length for arbitrary polylines", () => {
  const route = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
  const metrics = createPolylineMetrics(route);
  assert.deepEqual(metrics.cumulativeLengths, [0, 10, 20]);
  assert.equal(metrics.totalLength, 20);
  assert.deepEqual(partialPolylineFromMetrics(metrics, 0), [{ x: 0, y: 0 }]);
  assert.deepEqual(partialPolylineFromMetrics(metrics, 0.25), [{ x: 0, y: 0 }, { x: 5, y: 0 }]);
  assert.deepEqual(partialPolylineFromMetrics(metrics, 0.5), [{ x: 0, y: 0 }, { x: 10, y: 0 }]);
  assert.deepEqual(partialPolylineFromMetrics(metrics, 0.75), [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }]);
  assert.deepEqual(partialPolylineFromMetrics(metrics, 1), route);
  const multiSegmentRoute = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }, { x: 1, y: 4 }];
  const multiSegmentMetrics = createPolylineMetrics(multiSegmentRoute);
  assert.deepEqual(multiSegmentMetrics.cumulativeLengths, [0, 3, 7, 9]);
  assert.equal(multiSegmentMetrics.totalLength, 9);
  assert.deepEqual(partialPolyline(multiSegmentRoute, 8 / 9),
    [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 4 }, { x: 2, y: 4 }]);
  const duplicateMetrics = createPolylineMetrics([{ x: 2, y: 3 }, { x: 2, y: 3 }, { x: 6, y: 3 }]);
  assert.deepEqual(duplicateMetrics.cumulativeLengths, [0, 0, 4]);
  assert.equal(duplicateMetrics.totalLength, 4);
  assert.deepEqual(partialPolylineFromMetrics(duplicateMetrics, 0.5), [{ x: 2, y: 3 }, { x: 4, y: 3 }]);
  const zeroLengthMetrics = createPolylineMetrics([{ x: 2, y: 3 }, { x: 2, y: 3 }]);
  assert.equal(zeroLengthMetrics.totalLength, 0);
  assert.deepEqual(partialPolylineFromMetrics(zeroLengthMetrics, 0.5), [{ x: 2, y: 3 }]);
});

test("gameplay feedback policy freezes route, Hint, removal, and blocker values", () => {
  assert.equal(GAMEPLAY_FEEDBACK.initialStageSettleDuration, 80);
  assert.equal(GAMEPLAY_FEEDBACK.route.haloWidth, 11);
  assert.equal(GAMEPLAY_FEEDBACK.route.coreWidth, 5);
  assert.deepEqual([
    GAMEPLAY_FEEDBACK.route.entryDuration,
    GAMEPLAY_FEEDBACK.route.holdDuration,
    GAMEPLAY_FEEDBACK.route.fadeDuration,
  ], [180, 40, 60]);
  assert.equal(GAMEPLAY_FEEDBACK.route.entryDuration + GAMEPLAY_FEEDBACK.route.holdDuration
    + GAMEPLAY_FEEDBACK.route.fadeDuration, MOTION.pairRoute);
  assert.equal(GAMEPLAY_FEEDBACK.hint.duration, 900);
  assert.equal(GAMEPLAY_FEEDBACK.hint.scalePeak, 1.035);
  assert.equal(GAMEPLAY_FEEDBACK.hint.movingDuration, 720);
  assert.equal(GAMEPLAY_FEEDBACK.removal.duration, 180);
  assert.equal(GAMEPLAY_FEEDBACK.removal.scale, 0.88);
  assert.ok(GAMEPLAY_FEEDBACK.removal.duration >= MOTION.pairRemovalMin);
  assert.ok(GAMEPLAY_FEEDBACK.removal.duration <= MOTION.pairRemovalMax);
  assert.equal(BLOCKER_VISUAL_STYLE.size, 56);
  assert.equal(BLOCKER_VISUAL_STYLE.edgeWidth, 3);
  assert.equal(BLOCKER_VISUAL_STYLE.fill, VISUAL_COLORS.blocker.fill.phaser);
  assert.equal(BLOCKER_VISUAL_STYLE.edge, VISUAL_COLORS.blocker.dark.phaser);
});

test("semantic tile states take precedence over transient pressed frame", () => {
  assert.equal(resolveTileCardFrame("default", false), "default");
  assert.equal(resolveTileCardFrame("default", true), "pressed");
  for (const state of ["selected", "hint", "blocked"]) {
    assert.equal(resolveTileCardFrame(state, false), state);
    assert.equal(resolveTileCardFrame(state, true), state);
  }
});

test("board runtime atlas manifest covers five cards and all thirty symbols exactly once", () => {
  assert.equal(BOARD_CARD_FRAMES.length, 5);
  assert.equal(BOARD_SYMBOL_FRAMES.length, 30);
  assert.deepEqual(BOARD_CARD_FRAMES.map(({ frameName }) => frameName), [
    "tile/default", "tile/pressed", "tile/selected", "tile/hint", "tile/blocked",
  ]);
  assert.deepEqual(BOARD_SYMBOL_FRAMES.map(({ definition }) => definition.assetKey),
    TILE_SYMBOLS.map(({ assetKey }) => assetKey));
  assert.deepEqual(BOARD_SYMBOL_FRAMES.map(({ frameName }) => frameName),
    TILE_SYMBOLS.map(({ assetKey }) => getBoardSymbolFrameName(assetKey)));
  const names = [...BOARD_CARD_FRAMES, ...BOARD_SYMBOL_FRAMES].map(({ frameName }) => frameName);
  assert.equal(new Set(names).size, 35);
  assert.ok(names.length <= BOARD_RUNTIME_ATLAS_COLUMNS * BOARD_RUNTIME_ATLAS_ROWS);
});

test("board runtime atlas layout is guarded, deterministic, integral, non-overlapping, and mobile-safe", () => {
  for (const renderScale of [1, 1.5, 2]) {
    const layout = computeBoardRuntimeAtlasLayout(renderScale);
    assert.deepEqual(layout, computeBoardRuntimeAtlasLayout(renderScale));
    for (const value of [layout.guardPx, layout.visualContentPx, layout.slotPx,
      layout.atlasWidthPx, layout.atlasHeightPx]) assert.equal(Number.isInteger(value), true);
    assert.ok(layout.guardPx > 0);
    assert.ok(layout.atlasWidthPx <= 2048 && layout.atlasHeightPx <= 2048);
    assert.equal(layout.placements.length, 35);
    for (const [index, frame] of layout.placements.entries()) {
      assert.ok(frame.x >= 0 && frame.y >= 0);
      assert.ok(frame.x + frame.width <= layout.atlasWidthPx);
      assert.ok(frame.y + frame.height <= layout.atlasHeightPx);
      for (const other of layout.placements.slice(index + 1)) {
        assert.ok(frame.x + frame.width <= other.x || other.x + other.width <= frame.x
          || frame.y + frame.height <= other.y || other.y + other.height <= frame.y);
      }
    }
  }
});

test("board runtime atlas protects tile and symbol visual geometry", () => {
  assert.equal(TILE_VISUAL_STYLE.size, 56);
  assert.equal(TILE_VISUAL_STYLE.radius, 12);
  assert.equal(TILE_VISUAL_STYLE.borderWidth, 1);
  assert.equal(TILE_VISUAL_STYLE.emphasizedBorderWidth, 3);
  assert.equal(PRODUCTION_SYMBOL_DISPLAY_SIZE, 56);
  assert.equal(LEGACY_SYMBOL_DISPLAY_SIZE, 38);
  const hint = BOARD_CARD_FRAMES.find(({ state }) => state === "hint");
  const selected = BOARD_CARD_FRAMES.find(({ state }) => state === "selected");
  assert.equal(hint.borderWidth, 3);
  assert.equal(hint.innerBorderWidth, 1);
  assert.equal(TILE_VISUAL_STYLE.hintInnerInset, 5);
  assert.equal(TILE_VISUAL_STYLE.hintInnerRadius, 9);
  assert.equal(selected.innerBorderWidth, 0);
  assert.equal(TILE_VISUAL_STYLE.selectedMarker, false);
});

const validatePilotWebp = (webp, path, expectedSize) => {
  const message = (reason) => `${path}: ${reason}`;
  assert.ok(webp.length >= 12, message("file is too short for a RIFF/WebP header"));
  assert.equal(webp.subarray(0, 4).toString("ascii"), "RIFF", message("invalid RIFF signature"));
  assert.equal(webp.subarray(8, 12).toString("ascii"), "WEBP", message("invalid WEBP signature"));
  assert.equal(webp.readUInt32LE(4) + 8, webp.length,
    message("RIFF declared size does not match actual file length"));

  let offset = 12;
  let vp8Chunks = 0;
  while (offset < webp.length) {
    assert.ok(offset + 8 <= webp.length, message("incomplete chunk header"));
    const chunkType = webp.subarray(offset, offset + 4).toString("ascii");
    const chunkSize = webp.readUInt32LE(offset + 4);
    const payloadStart = offset + 8;
    const chunkEnd = payloadStart + chunkSize + (chunkSize % 2);
    assert.ok(chunkEnd <= webp.length, message(`${chunkType} chunk extends beyond file`));

    if (chunkType === "VP8 ") {
      vp8Chunks += 1;
      assert.ok(chunkSize >= 10, message("VP8 chunk is too short for a frame header"));
      assert.deepEqual([...webp.subarray(payloadStart + 3, payloadStart + 6)], [0x9d, 0x01, 0x2a],
        message("invalid VP8 frame signature"));
      const width = webp.readUInt16LE(payloadStart + 6) & 0x3fff;
      const height = webp.readUInt16LE(payloadStart + 8) & 0x3fff;
      assert.deepEqual([width, height], [expectedSize, expectedSize],
        message(`unexpected image dimensions: ${width}x${height}`));
    }
    offset = chunkEnd;
  }
  assert.equal(vp8Chunks, 1, message("expected exactly one VP8 image chunk"));
};

test("artwork Gallery derives unavailable, locked, and unlocked slot states", () => {
  assert.equal(getArtworkGallerySlotState(progressAt(0), 1), "locked");
  assert.equal(getArtworkGallerySlotState(progressAt(0), 2), "unavailable");
  assert.equal(getArtworkGallerySlotState(progressAt(0), 30), "locked");
  assert.equal(getArtworkGallerySlotState(progressAt(0), 80), "locked");
  assert.equal(getArtworkGallerySlotState(progressAt(1), 1), "unlocked");
  assert.equal(getArtworkGallerySlotState(progressAt(29), 30), "locked");
  assert.equal(getArtworkGallerySlotState(progressAt(30), 30), "unlocked");
  assert.equal(getArtworkGallerySlotState(progressAt(79), 80), "locked");
  assert.equal(getArtworkGallerySlotState(progressAt(80), 80), "unlocked");
  for (const level of [1, 30, 80]) assert.equal(getArtworkGallerySlotState(progressAt(100), level), "unlocked");
});

test("artwork Gallery count and default chapter derive from catalog and progress", () => {
  const expectations = [[0, 0, 1], [1, 1, 1], [29, 1, 1], [30, 2, 3], [79, 2, 3], [80, 3, 8], [100, 3, 8]];
  for (const [completed, count, chapter] of expectations) {
    assert.equal(getUnlockedArtworkCount(progressAt(completed)), count);
    assert.equal(getDefaultArtworkGalleryChapter(progressAt(completed)), chapter);
  }
});

test("production artwork Gallery and Full View geometry is stable", () => {
  assert.deepEqual([ARTWORK_GALLERY_LAYOUT.grid.columns, ARTWORK_GALLERY_LAYOUT.grid.rows,
    ARTWORK_GALLERY_LAYOUT.grid.cardSize], [5, 2, 72]);
  const slots = Array.from({ length: 10 }, (_, index) => getArtworkGallerySlotBounds(index));
  assert.deepEqual(slots.map(({ x, width }) => x + width / 2), [60, 150, 240, 330, 420, 60, 150, 240, 330, 420]);
  assert.deepEqual(slots.map(({ y }) => y), [176, 176, 176, 176, 176, 292, 292, 292, 292, 292]);
  assert.ok(slots.every(({ width, height }) => width === 72 && height === 72));
  assert.deepEqual(ARTWORK_GALLERY_THUMBNAIL, { size: 72, radius: 16 });
  assert.deepEqual(ARTWORK_FULL_VIEW_LAYOUT.artwork, { x: 40, y: 156, width: 400, height: 400 });
  assert.deepEqual(ARTWORK_FULL_VIEW_LAYOUT.back, { x: 24, y: 20, width: 48, height: 48 });
  for (const invalid of [-1, 10, 1.5]) assert.throws(() => getArtworkGallerySlotBounds(invalid), RangeError);
});

test("production Gallery counts only implemented unlocked artwork out of 100 campaign slots", () => {
  assert.equal(TOTAL_LEVELS, 100);
  assert.deepEqual([0, 1, 30, 80, 100].map((completed) => getUnlockedArtworkCount(progressAt(completed))),
    [0, 1, 2, 3, 3]);
  assert.deepEqual([1, 3, 8].map((chapter) => getUnlockedArtworkCountInChapter(progressAt(100), chapter)), [1, 1, 1]);
  assert.equal(getUnlockedArtworkCountInChapter(progressAt(29), 3), 0);
  assert.equal(getUnlockedArtworkCountInChapter(progressAt(30), 3), 1);
});

test("production Gallery localization resolves equivalent RU and EN copy", () => {
  const ru = getUiStrings("ru"); const en = getUiStrings("en");
  assert.deepEqual([ru.gallery, ru.galleryChapterProgress(1, 10), ru.levelLabel(30), ru.gallerySoon,
    ru.galleryLoading, ru.galleryUnavailable, ru.back, ru.artworkLoading, ru.artworkUnavailable],
  ["Галерея", "Открыто 1 из 10", "Уровень 30", "Скоро", "Загрузка…", "Недоступно", "Назад",
    "Загрузка картины…", "Картина недоступна"]);
  assert.deepEqual([en.gallery, en.galleryChapterProgress(1, 10), en.levelLabel(30), en.gallerySoon,
    en.galleryLoading, en.galleryUnavailable, en.back, en.artworkLoading, en.artworkUnavailable],
  ["Gallery", "Unlocked 1 of 10", "Level 30", "Soon", "Loading…", "Unavailable", "Back",
    "Loading artwork…", "Artwork unavailable"]);
});

test("pilot artwork catalog and final-stage reveal eligibility are explicit", () => {
  assert.deepEqual(LEVEL_ARTWORK.map(({ levelNumber }) => levelNumber), [1, 30, 80]);
  for (const level of [1, 30, 80]) assert.equal(getLevelArtwork(level)?.levelNumber, level);
  assert.equal(getLevelArtwork(2), undefined);
  assert.equal(isArtworkRevealStage(1, 0), true);
  assert.equal(isArtworkRevealStage(30, 0), false);
  assert.equal(isArtworkRevealStage(30, 1), false);
  assert.equal(isArtworkRevealStage(30, 2), true);
});

test("pilot artwork catalog references distinct full and thumbnail WebP fixtures", async () => {
  const allKeys = LEVEL_ARTWORK.flatMap(({ fullAssetKey, thumbnailAssetKey }) =>
    [fullAssetKey, thumbnailAssetKey]);
  assert.equal(new Set(allKeys).size, allKeys.length);
  for (const artwork of LEVEL_ARTWORK) {
    assert.notEqual(artwork.fullAssetKey, artwork.thumbnailAssetKey);
    assert.notEqual(artwork.fullPath, artwork.thumbnailPath);
    assert.match(artwork.fullPath, /\.webp$/);
    assert.match(artwork.thumbnailPath, /\.webp$/);
    for (const [path, expectedSize] of [[artwork.fullPath, 1024], [artwork.thumbnailPath, 256]]) {
      const webp = await readFile(new URL(`../public/${path}`, import.meta.url));
      validatePilotWebp(webp, path, expectedSize);
    }
  }
});

test("pilot WebP validation rejects a truncated file with intact magic bytes", async () => {
  const path = LEVEL_ARTWORK[0].fullPath;
  const webp = await readFile(new URL(`../public/${path}`, import.meta.url));
  const truncatedWebp = webp.subarray(0, webp.length - 34);
  assert.throws(() => validatePilotWebp(truncatedWebp, path, 1024),
    /RIFF declared size does not match actual file length/);
});

test("artwork unlock is derived only from completed campaign progress", () => {
  assert.equal(isArtworkUnlocked({ version: 1, completedThroughLevel: 0 }, 1), false);
  assert.equal(isArtworkUnlocked({ version: 1, completedThroughLevel: 1 }, 1), true);
  assert.equal(isArtworkUnlocked({ version: 1, completedThroughLevel: 1 }, 2), false);
  assert.equal(isArtworkUnlocked({ version: 1, completedThroughLevel: 30 }, 30), true);
  assert.equal(isArtworkUnlocked({ version: 1, completedThroughLevel: 30 }, 31), false);
});

test("square artwork placement is centered within final board bounds", () => {
  const cases = [
    { columns: 4, rows: 4, width: 256, height: 256, size: 256, verticalMargin: 0 },
    { columns: 5, rows: 5, width: 320, height: 320, size: 320, verticalMargin: 0 },
    { columns: 6, rows: 6, width: 384, height: 384, size: 384, verticalMargin: 0 },
    { columns: 7, rows: 7, width: 448, height: 448, size: 448, verticalMargin: 0 },
  ];
  for (const { columns, rows, width, height, size, verticalMargin } of cases) {
    const board = new BoardLayout({
      sceneWidth: 480, sceneHeight: 800, boardWidth: columns, boardHeight: rows,
    });
    assert.equal(board.boardRight - board.boardLeft, width);
    assert.equal(board.boardBottom - board.boardTop, height);
    const placement = computeContainedSquarePlacement(
      board.boardLeft, board.boardTop, width, height,
    );
    assert.deepEqual(placement, {
      x: board.boardLeft + (width - size) / 2,
      y: board.boardTop + (height - size) / 2,
      size,
    });
    assert.equal(placement.x + size / 2, (board.boardLeft + board.boardRight) / 2);
    assert.equal(placement.y + size / 2, (board.boardTop + board.boardBottom) / 2);
    assert.equal((placement.y - board.boardTop) * 2, verticalMargin);
    assert.deepEqual(computeContainedSquarePlacement(
      board.boardLeft, board.boardTop, width, height,
    ), placement);
    assert.deepEqual(Object.keys(placement).sort(), ["size", "x", "y"]);
  }

  for (const dimensions of [
    [0, 0, 0, 100], [0, 0, 100, -1],
    [Number.NaN, 0, 100, 100], [0, Number.POSITIVE_INFINITY, 100, 100],
  ]) assert.throws(() => computeContainedSquarePlacement(...dimensions), RangeError);
});

test("tile symbol catalog implements the deterministic 30-entry production mapping", () => {
  const maxCampaignTileId = Math.max(...Array.from({ length: TOTAL_LEVELS }, (_, index) => index + 1)
    .flatMap((level) => getLevelStageConfigs(level).map(({ pairCount }) => pairCount)));
  assert.equal(maxCampaignTileId, 22);
  assert.equal(TILE_SYMBOLS.length, 30);
  assert.deepEqual(TILE_SYMBOLS.map(({ name }) => name), [
    "cup", "teapot", "sun", "cloud", "key", "leaf", "feather", "flower", "clover", "acorn",
    "bell", "compass", "camera", "mountain", "planet", "shell", "wave", "lightning", "fish", "flame",
    "mushroom", "crystal", "jam-jar", "heart", "butterfly", "snowflake", "moon", "star", "lantern", "gem",
  ]);
  assert.equal(Object.isFrozen(TILE_SYMBOLS), true);
  assert.ok(TILE_SYMBOLS.slice(0, 8).every(Object.isFrozen));
  assert.equal(new Set(TILE_SYMBOLS.map(({ name }) => name)).size, TILE_SYMBOLS.length);
  assert.equal(new Set(TILE_SYMBOLS.map(({ assetKey }) => assetKey)).size, TILE_SYMBOLS.length);
  for (let tileId = 1; tileId <= TILE_SYMBOLS.length; tileId += 1) {
    const first = getTileSymbol(tileId);
    assert.strictEqual(getTileSymbol(tileId), first);
    const prefix = first.artwork === "production-pilot"
      ? "assets/production-pilot/symbols/" : "assets/symbols/";
    assert.equal(first.assetPath, `${prefix}${first.name}.png`);
    assert.equal(first.displaySize, first.artwork === "production-pilot"
      ? PRODUCTION_SYMBOL_DISPLAY_SIZE : LEGACY_SYMBOL_DISPLAY_SIZE);
  }
  assert.ok(TILE_SYMBOLS.filter(({ artwork }) => artwork === "production-pilot")
    .every(({ displaySize }) => displaySize === 56));
  assert.ok(TILE_SYMBOLS.filter(({ artwork }) => artwork === "legacy-placeholder")
    .every(({ displaySize }) => displaySize === 38));
  assert.throws(() => getTileSymbol(0), RangeError);
  assert.throws(() => getTileSymbol(TILE_SYMBOLS.length + 1), RangeError);
});

test("tile symbol runtime PNG paths resolve to committed 256x256 RGBA textures", async () => {
  for (const definition of TILE_SYMBOLS) {
    const png = await readFile(new URL(`../public/${definition.assetPath}`, import.meta.url));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a",
      `${definition.name} must have a valid PNG signature`);
    assert.equal(png.readUInt32BE(16), 256, `${definition.name} must be 256 px wide`);
    assert.equal(png.readUInt32BE(20), 256, `${definition.name} must be 256 px high`);
    assert.equal(png[24], 8, `${definition.name} must use 8-bit channels`);
    assert.equal(png[25], 6, `${definition.name} must use RGBA color type`);

    if (definition.artwork === "legacy-placeholder") {
      const svg = await readFile(new URL(`../art/source/symbols/${definition.name}.svg`, import.meta.url), "utf8");
      assert.match(svg, /^<svg\b/, `${definition.name} must retain its legacy SVG source master`);
    }
  }
});

test("approved production pilot symbol hashes match staged sources and review values", async () => {
  const expected = new Map(Object.entries({
    cup: "ce07c4113f5944b9b7c2b65b0514d3043887ead9b11330b21e4f19b2321fd3b8",
    teapot: "203df497d4255bc13c115f5ef784f5c20e83e21db8217f98ed105c939ea1db23",
    leaf: "d5674f92c7893fda9f94f596bbf51afce8972e45b43eae5ed870c99e5a252c7c",
    feather: "3d706278be02778073b1e4605fdc9cf3148731c30f268c239b86fe83df4ef577",
    flower: "6a1e7d1a74a5afe7490652128d922b7a76355e60af6f76fb4ecfcfc509a01570",
    compass: "ea02c3fe274b00f14337edf228b07394ae3bfa47cbda9881d5be60555aea9873",
    camera: "d00f2273f7959647250a941dfe4a3649cfcf40a634974605f49738984e69a5b0",
    shell: "5906913f270ec7807ef108da9c721a6d170efbf94f94e9776d1c1133dd6cb6e9",
    "jam-jar": "4e5dfb63c1855ab5cd9fe9b9852ef08c6e3dd9ce8e4ab8d1f25dbf3511709dc5",
    snowflake: "5f33be15a18acf49d91e001bfa020fadf945e88105d5fa004ea7f32c10278b79",
    star: "e10b7edee6cbed95b92f2183773f2b361b55a1b3de3bbfc7b6627b6b27442cf3",
    lantern: "edab028cb64b0ea44bf2c0d0453f0e4ec4bb044cafeaca4ee17096ba87729695",
  }));
  const production = TILE_SYMBOLS.filter(({ artwork }) => artwork === "production-pilot");
  assert.equal(production.length, 12);
  assert.deepEqual(production.map(({ name }) => name), [...expected.keys()]);
  for (const definition of production) {
    const runtime = await readFile(new URL(`../public/${definition.assetPath}`, import.meta.url));
    const staged = await readFile(new URL(`../art/production-pilot/symbols/${definition.name}.png`, import.meta.url));
    const digest = createHash("sha256").update(runtime).digest("hex");
    assert.equal(digest, expected.get(definition.name));
    assert.deepEqual(runtime, staged, `${definition.name} runtime must match its approved staged source`);
  }
});

test("developer symbol gallery requires both flags and reuses the shared catalog", async () => {
  assert.equal(isSymbolGalleryRequested("?debug=1&symbols=1"), true);
  for (const search of ["", "?symbols=1", "?debug=1", "?debug=0&symbols=1", "?debug=1&symbols=0"]) {
    assert.equal(isSymbolGalleryRequested(search), false);
  }
  const gallerySource = await readFile(new URL("../src/game/SymbolGalleryScene.ts", import.meta.url), "utf8");
  assert.match(gallerySource, /TILE_SYMBOLS\.forEach/);
  assert.doesNotMatch(gallerySource, /assets\/symbols\//);
});

test("game parent owns mobile viewport geometry while landscape keeps centered 480:800 presentation", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const main = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(css, /--page-backdrop-color:\s*#E7DCC8/);
  assert.match(css, /#game\s*\{[^}]*inset:\s*0;[^}]*background:\s*transparent/);
  assert.match(css, /@media \(orientation: landscape\)[\s\S]*width:\s*min\(100dvw, calc\(100dvh \* 0\.6\)\)/);
  assert.match(css, /@media \(orientation: landscape\)[\s\S]*left:\s*50%[\s\S]*translateX\(-50%\)/);
  assert.match(html, /name="theme-color" content="#F5EEDF"/);
  assert.match(main, /mode:\s*Phaser\.Scale\.EXPAND/);
  assert.match(main, /autoCenter:\s*Phaser\.Scale\.NO_CENTER/);
  assert.match(main, /expandParent:\s*false/);
  assert.doesNotMatch(main, /scale:\s*\{[\s\S]*?max:\s*\{/);
});

test("transparent game parent exposes the fixed page dim while the canvas owns the game background", async () => {
  const [css, html, main] = await Promise.all([
    readFile(new URL("../public/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/main.ts", import.meta.url), "utf8"),
  ]);
  const gameRules = [...css.matchAll(/#game\s*\{([^}]*)\}/g)].map((match) => match[1]);
  assert.equal(gameRules.length, 2);
  assert.match(gameRules[0], /background:\s*transparent;/);
  assert.match(gameRules[0], /z-index:\s*1;/);
  assert.doesNotMatch(gameRules[1], /background(?:-color)?:/);
  const dim = css.match(/#page-dim\s*\{([^}]*)\}/)?.[1];
  assert.ok(dim);
  for (const declaration of [/position:\s*fixed;/, /inset:\s*0;/, /z-index:\s*0;/,
    /pointer-events:\s*none;/, /opacity:\s*var\(--page-dim-opacity\);/]) {
    assert.match(dim, declaration);
  }
  assert.match(dim, new RegExp(`background:\\s*${VISUAL_COLORS.overlay.modal.hex};`, "i"));
  const rootRules = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map((match) => match[1]);
  assert.equal(rootRules.length, 2);
  assert.match(rootRules[0], /--page-backdrop-color:\s*#F5EEDF;/);
  assert.match(rootRules[0], /background-color:\s*var\(--page-backdrop-color\);/);
  assert.match(rootRules[1], /--page-backdrop-color:\s*#E7DCC8;/);
  assert.match(css, /body\s*\{[^}]*background-color:\s*var\(--page-backdrop-color\);[^}]*isolation:\s*isolate;/);
  assert.match(html, /id="page-dim"[^>]*aria-hidden="true"/);
  assert.match(main, /backgroundColor:\s*VISUAL_COLORS\.bg\.app\.hex/);
  assert.equal(VISUAL_COLORS.bg.app.hex, "#F5EEDF");
  assert.doesNotMatch(css, /border(?:-[a-z]+)*-radius\s*:|clip-path\s*:/);
  assert.doesNotMatch(html, /border-radius|clip-path/);
  assert.doesNotMatch(css, /max-width\s*:|safe-area-inset/);
});

test("viewport backdrops cover expanded tablet and tall-phone space and release resize listeners", () => {
  const previousPhaser = globalThis.Phaser;
  globalThis.Phaser = { Scale: { Events: { RESIZE: "resize" } }, GameObjects: { Events: { DESTROY: "destroy" } } };
  try {
    const scale = Object.assign(new EventEmitter(), { gameSize: { width: 1200, height: 1600 } });
    const scene = {
      scale,
      cameras: { main: { zoom: 2 } },
      add: {
        rectangle(x, y, width, height, color, alpha) {
          return Object.assign(new EventEmitter(), {
            x, y, width, height, color, alpha,
            setSize(w, h) { this.width = w; this.height = h; return this; },
          });
        },
      },
    };
    const backdrop = createViewportBackdrop(scene, VISUAL_COLORS.overlay.modal.phaser, 0.72);
    assert.deepEqual([backdrop.x, backdrop.y, backdrop.width, backdrop.height], [240, 400, 600, 800]);
    assert.equal(backdrop.alpha, 0.72);
    assert.equal(backdrop.color, VISUAL_COLORS.overlay.modal.phaser);
    assert.equal(scale.listenerCount("resize"), 1);
    for (const [width, height, zoom, expectedWidth, expectedHeight] of [
      [960, 2080, 2, 480, 1040],
      [480, 800, 1, 480, 800],
      [600, 800, 1, 600, 800],
      [960, 4000, 2, 480, 2000],
    ]) {
      scale.gameSize = { width, height };
      scene.cameras.main.zoom = zoom;
      scale.emit("resize");
      assert.deepEqual([backdrop.x, backdrop.y, backdrop.width, backdrop.height],
        [240, 400, expectedWidth, expectedHeight]);
    }
    const replacement = createViewportBackdrop(scene, VISUAL_COLORS.bg.app.phaser);
    assert.equal(replacement.alpha, 1);
    assert.equal(scale.listenerCount("resize"), 2);
    backdrop.emit("destroy");
    assert.equal(scale.listenerCount("resize"), 1);
    replacement.emit("destroy");
    assert.equal(scale.listenerCount("resize"), 0);
  } finally {
    if (previousPhaser === undefined) delete globalThis.Phaser;
    else globalThis.Phaser = previousPhaser;
  }
});

test("pause and complete secondary actions use the dedicated modal contrast tone", async () => {
  const play = await readFile(new URL("../src/game/PlayScene.ts", import.meta.url), "utf8");
  const primitives = await readFile(new URL("../src/game/UiPrimitives.ts", import.meta.url), "utf8");
  assert.match(play, /tone: kind === "secondary" \? "modalSecondary" : "default"/);
  assert.match(play, /label: strings\.replayLevel, tone: "modalSecondary"/);
  assert.match(play, /label: strings\.menu, tone: "modalSecondary"/);
  assert.match(primitives, /options\.tone === "modalSecondary"/);
  assert.match(primitives, /VISUAL_COLORS\.state\.pressedFill\.phaser/);
});

test("page frame uses the full layout viewport without CSS safe-area inset gutters", async () => {
  const css = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
  assert.match(css, /#game\s*\{[\s\S]*inset:\s*0;/);
  assert.doesNotMatch(css, /#game\s*\{[\s\S]*env\(safe-area-inset/);
});

test("flat UI keeps decorative chrome borderless while semantic state borders remain explicit", async () => {
  const levelSelect = await readFile(new URL("../src/game/LevelSelectScene.ts", import.meta.url), "utf8");
  const gallery = await readFile(new URL("../src/game/ArtworkGalleryScene.ts", import.meta.url), "utf8");
  const primitives = await readFile(new URL("../src/game/UiPrimitives.ts", import.meta.url), "utf8");

  assert.match(levelSelect, /createChapterBanner\(this, this\.chapter, LEVEL_SELECT_LAYOUT\.banner, false\)/);
  assert.doesNotMatch(gallery, /VISUAL_COLORS\.border\.strong\.phaser[\s\S]*strokeRoundedRect\(bounds\.x, bounds\.y, 72, 72/);
  assert.match(gallery, /drawDashedBorder/);
  assert.match(primitives, /options\.borderRole === "strong" \|\| options\.borderRole === "soft"/);
  assert.doesNotMatch(primitives, /const modalBorderRole/);
});

test("production viewport keeps desktop full-height with symmetric side backdrop gutters", () => {
  const desktopViewports = [
    [1920, 1080],
    [2560, 1440],
    [1440, 900],
    [1366, 768],
    [1024, 768],
  ];

  for (const [width, height] of desktopViewports) {
    const frame = computePortraitFrame(width, height);
    assert.ok(Math.abs(frame.displayHeight - height) < 1e-9,
      `${width}x${height} must use the full available height`);
    assert.ok(Math.abs(frame.topBottomGutter) < 1e-9);
    assert.ok(frame.sideGutter > 0);
    assert.equal(frame.logicalViewportWidth, 480);
    assert.equal(frame.logicalViewportHeight, 800);
  }

  assert.deepEqual(computePortraitFrame(1920, 1080), {
    scale: 1.35,
    displayWidth: 648,
    displayHeight: 1080,
    sideGutter: 636,
    topBottomGutter: 0,
    logicalViewportWidth: 480,
    logicalViewportHeight: 800,
  });
});

test("normal tall-mobile viewport expands Phaser vertically with no CSS gutters", () => {
  for (const [width, height] of [
    [1080, 1920],
    [1220, 2712],
  ]) {
    const frame = computePortraitFrame(width, height);
    assert.ok(Math.abs(frame.displayWidth - width) < 1e-9);
    assert.ok(Math.abs(frame.displayHeight - height) < 1e-9);
    assert.ok(Math.abs(frame.sideGutter) < 1e-9);
    assert.ok(Math.abs(frame.topBottomGutter) < 1e-9);
    assert.equal(frame.logicalViewportWidth, 480);
    assert.ok(frame.logicalViewportHeight > 800);
    assert.ok(frame.logicalViewportHeight < MAX_LOGICAL_VIEWPORT_HEIGHT);
  }
});

test("canonical viewport stays exact and pathological tall ratios retain a fill-rate guard", () => {
  assert.deepEqual(computePortraitFrame(480, 800), {
    scale: 1,
    displayWidth: 480,
    displayHeight: 800,
    sideGutter: 0,
    topBottomGutter: 0,
    logicalViewportWidth: 480,
    logicalViewportHeight: 800,
  });

  const extreme = computePortraitFrame(480, 2000);
  assert.equal(extreme.logicalViewportHeight, MAX_LOGICAL_VIEWPORT_HEIGHT);
  assert.equal(extreme.displayHeight, MAX_LOGICAL_VIEWPORT_HEIGHT);
  assert.equal(extreme.topBottomGutter, 200);
});

test("production render scale preserves the finite 1 through 2 DPR baseline", () => {
  assert.deepEqual([0.75, 1, 1.5, 2, 2.5, 3].map(computeRenderScale), [1, 1, 1.5, 2, 2, 2]);
  assert.equal(computeRenderScale(Number.NaN), 1);
  assert.equal(computeRenderScale(Number.POSITIVE_INFINITY), 1);
  assert.equal(computeRenderScale(Number.NEGATIVE_INFINITY), 1);
});

test("production render density accounts for startup CSS presentation and remains bounded", () => {
  const cases = [
    { name: "Full-HD desktop DPR 1", width: 1920, height: 1080, dpr: 1, expected: 1.35 },
    { name: "QHD desktop DPR 1", width: 2560, height: 1440, dpr: 1, expected: 1.8 },
    { name: "portrait phone DPR 2", width: 390, height: 844, dpr: 2, expected: 2 },
    { name: "portrait phone DPR 3", width: 390, height: 844, dpr: 3, expected: 2 },
    { name: "tablet DPR 2", width: 768, height: 1024, dpr: 2, expected: 2 },
    { name: "landscape phone DPR 2", width: 844, height: 390, dpr: 2, expected: 2 },
  ];
  for (const { name, width, height, dpr, expected } of cases) {
    const scale = computeRenderScale(dpr, width, height);
    assert.equal(scale, expected, name);
    assert.ok(Number.isFinite(scale), name);
    assert.ok(scale >= MIN_RENDER_SCALE, name);
    assert.ok(scale <= MAX_RENDER_SCALE, name);
  }

  assert.equal(computeRenderScale(1, Number.NaN, 1080), 1);
  assert.equal(computeRenderScale(1, 1920, Number.POSITIVE_INFINITY), 1);
  assert.equal(computeRenderScale(1, 0, 1080), 1);
  assert.equal(computeRenderScale(1, 3840, 2160), MAX_RENDER_SCALE);
});

test("render density does not alter the canonical authored composition", () => {
  assert.equal(LOGICAL_GAME_WIDTH, 480);
  assert.equal(LOGICAL_GAME_HEIGHT, 800);
  assert.equal(MIN_RENDER_SCALE, 1);
  assert.equal(MAX_RENDER_SCALE, 2);
});

test("only debug renderScale 1 requests the legacy render density", () => {
  assert.equal(isLegacyRenderScaleDebugRequested("?debug=1&renderScale=1"), true);
  for (const search of [
    "", "?renderScale=1", "?debug=0&renderScale=1", "?debug=1&renderScale=2",
    "?debug=1&renderScale=3", "?debug=1&renderScale=abc", "?debug=1&hidpi=1",
  ]) {
    assert.equal(isLegacyRenderScaleDebugRequested(search), false);
  }
});

const layout = (boardWidth, boardHeight) => new BoardLayout({
  sceneWidth: 480, sceneHeight: 800, boardWidth, boardHeight,
});

test("debug campaign start requires its explicit gate and a valid level", () => {
  assert.equal(parseDebugStart(""), null);
  assert.equal(parseDebugStart("?level=58"), null);
  assert.equal(parseDebugStart("?debug=0&level=58"), null);
  assert.deepEqual(parseDebugStart("?debug=1&level=58"), { levelNumber: 58, stageIndex: 0 });
  for (const level of ["0", "101", "-1", "abc", "1.5", ""]) {
    assert.equal(parseDebugStart(`?debug=1&level=${level}`), null);
  }
});

test("debug campaign stages are one-based and fall back to stage one", () => {
  assert.deepEqual(parseDebugStart("?debug=1&level=48&stage=1"), { levelNumber: 48, stageIndex: 0 });
  assert.deepEqual(parseDebugStart("?debug=1&level=48&stage=2"), { levelNumber: 48, stageIndex: 1 });
  assert.deepEqual(parseDebugStart("?debug=1&level=48&stage=3"), { levelNumber: 48, stageIndex: 2 });
  assert.deepEqual(parseDebugStart("?debug=1&level=48&stage=4"), { levelNumber: 48, stageIndex: 0 });
  assert.deepEqual(parseDebugStart("?debug=1&level=50&stage=2"), { levelNumber: 50, stageIndex: 0 });
  assert.deepEqual(parseDebugStart("?debug=1&level=100&stage=2"), { levelNumber: 100, stageIndex: 1 });
  for (const stage of ["0", "-1", "abc", "1.5", "999"]) {
    assert.deepEqual(parseDebugStart(`?debug=1&level=48&stage=${stage}`), { levelNumber: 48, stageIndex: 0 });
  }
});

test("level 1 starts the calibrated campaign with a small deterministic board", () => {
  const first = createLevel(1), second = createLevel(1);
  assert.equal(levelSeed(1), 0x0000_0000);
  assert.deepEqual(getLevelConfig(1), { width: 4, height: 4, pairCount: 4, seed: 0, avoidAdjacentMatchingPairs: true });
  assert.deepEqual(getLevelConfig(1), getLevelConfig(1));
  assert.deepEqual(first.board.toRows(), second.board.toRows());
  assert.equal(first.board.toRows().flat().filter((tile) => tile !== null).length, 8);
  assert.equal(first.board.toRows().flat().filter((tile) => tile === null).length, 8);
  assert.ok(first.metrics.initialLegalMoveCount >= 2);
});

test("opening levels increase pair workload and satisfy exact-board invariants", () => {
  const expected = [
    { width: 4, height: 4, pairCount: 4, seed: levelSeed(1), avoidAdjacentMatchingPairs: true },
    { width: 4, height: 4, pairCount: 5, seed: levelSeed(2), avoidAdjacentMatchingPairs: true },
    { width: 4, height: 4, pairCount: 6, seed: levelSeed(3), avoidAdjacentMatchingPairs: true },
  ];
  assert.deepEqual([1, 2, 3].map(getLevelConfig), expected);

  for (const levelNumber of [1, 2, 3]) {
    const first = createLevel(levelNumber);
    const second = createLevel(levelNumber);
    assert.deepEqual(first.board.toRows(), second.board.toRows(), `level ${levelNumber} must replay deterministically`);
    assert.equal(validateGeneratedLevel(first).valid, true, `level ${levelNumber} must validate`);
    assert.ok(first.metrics.initialLegalMoveCount >= 2, `level ${levelNumber} must start with at least two moves`);
    for (const move of first.witness) {
      const distance = Math.abs(move.start.col - move.end.col) + Math.abs(move.start.row - move.end.row);
      assert.notEqual(distance, 1, `level ${levelNumber} must not contain adjacent matching pairs`);
    }
    const solver = solveBoard(first.board);
    assert.equal(solver.status, "solved", `level ${levelNumber} must solve`);
    let replay = first.board;
    for (const move of solver.moves) replay = applyMove(replay, move);
    assert.ok(replay.toRows().flat().every((tile) => tile === null), `level ${levelNumber} replay must empty board`);
  }
});

test("campaign constants and chapter boundaries are stable", () => {
  assert.equal(TOTAL_LEVELS, 100);
  assert.equal(CHAPTER_COUNT, 10);
  assert.equal(LEVELS_PER_CHAPTER, 10);
  assert.deepEqual([1, 10, 11, 90, 91, 100].map(getChapterNumber), [1, 1, 2, 9, 10, 10]);
});

test("campaign blockers preserve the pilot and exact curated rhythm", () => {
  const expected = new Map([[11, [{ col: 2, row: 2 }]], [12, [{ col: 2, row: 1 }, { col: 2, row: 3 }]],
    [13, [{ col: 1, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 2 }]]]);
  for (const [levelNumber, wanted] of expected) assert.deepEqual(getLevelConfig(levelNumber).blockedCells, wanted);
  assert.deepEqual(CAMPAIGN_BLOCKERS.map(({ levelNumber }) => levelNumber), [
    11, 12, 13, 16, 19, 22, 25, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56,
    58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100,
  ]);
  for (const levelNumber of [1, 10, 14, 15, 17, 20, 21, 31, 41, 61, 81, 99]) {
    assert.equal(getLevelConfig(levelNumber).blockedCells, undefined, `level ${levelNumber} must remain a breathing level`);
  }
});

test("campaign blocker data has unique in-range levels and valid coordinates and capacity", () => {
  assert.equal(new Set(CAMPAIGN_BLOCKERS.map(({ levelNumber }) => levelNumber)).size, CAMPAIGN_BLOCKERS.length);
  for (const { levelNumber, blockedCells } of CAMPAIGN_BLOCKERS) {
    assert.ok(levelNumber >= 1 && levelNumber <= TOTAL_LEVELS);
    const { width, height, pairCount } = getLevelConfig(levelNumber);
    assert.ok(2 * pairCount + blockedCells.length <= width * height, `level ${levelNumber} capacity`);
    const keys = new Set();
    for (const { col, row } of blockedCells) {
      assert.ok(col >= 0 && col < width && row >= 0 && row < height, `level ${levelNumber} blocker bounds`);
      keys.add(`${col},${row}`);
    }
    assert.equal(keys.size, blockedCells.length, `level ${levelNumber} blocker uniqueness`);
    assert.deepEqual(createLevel(levelNumber).board.blockedCells(), blockedCells);
  }
});

test("progression bands cover the campaign exactly once without gaps or overlaps", () => {
  assert.equal(PROGRESSION_BANDS[0].startLevel, 1);
  assert.equal(PROGRESSION_BANDS.at(-1).endLevel, TOTAL_LEVELS);
  const coverage = Array(TOTAL_LEVELS + 1).fill(0);
  for (const band of PROGRESSION_BANDS) {
    assert.ok(band.startLevel <= band.endLevel);
    for (let level = band.startLevel; level <= band.endLevel; level += 1) coverage[level] += 1;
  }
  assert.deepEqual(coverage.slice(1), Array(TOTAL_LEVELS).fill(1));
});

test("every campaign final board is square, follows the approved size ranges, and retains two empty cells", () => {
  const expectedSide = (level) => level <= 7 ? 4 : level <= 16 ? 5 : level <= 26 ? 6 : 7;
  const sides = new Set();
  for (let level = 1; level <= TOTAL_LEVELS; level += 1) {
    const config = getLevelConfig(level);
    const final = getLevelStageConfigs(level).at(-1);
    const blockerCount = config.blockedCells?.length ?? 0;
    assert.equal(config.width, config.height, `level ${level} final must be square`);
    assert.equal(config.width, expectedSide(level), `level ${level} final side`);
    assert.equal(final.width, final.height, `level ${level} last stage must be square`);
    assert.ok(config.width * config.height - config.pairCount * 2 - blockerCount >= 2,
      `level ${level} final must retain at least two empty non-blocked cells`);
    sides.add(config.width);
  }
  assert.deepEqual([...sides].sort(), [4, 5, 6, 7]);
});

test("early progression transitions have frozen profiles", () => {
  const profile = (level) => {
    const { width, height, pairCount } = getLevelConfig(level);
    return { width, height, pairCount };
  };
  assert.deepEqual([3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 16, 17, 20, 21, 23, 24, 26, 27, 30, 31]
    .map((level) => [level, profile(level)]), [
    [3, { width: 4, height: 4, pairCount: 6 }], [4, { width: 4, height: 4, pairCount: 5 }],
    [5, { width: 4, height: 4, pairCount: 5 }], [6, { width: 4, height: 4, pairCount: 6 }],
    [7, { width: 4, height: 4, pairCount: 6 }], [8, { width: 5, height: 5, pairCount: 7 }],
    [10, { width: 5, height: 5, pairCount: 7 }], [11, { width: 5, height: 5, pairCount: 8 }],
    [13, { width: 5, height: 5, pairCount: 8 }], [14, { width: 5, height: 5, pairCount: 9 }],
    [16, { width: 5, height: 5, pairCount: 9 }], [17, { width: 6, height: 6, pairCount: 11 }],
    [20, { width: 6, height: 6, pairCount: 11 }], [21, { width: 6, height: 6, pairCount: 12 }],
    [23, { width: 6, height: 6, pairCount: 12 }], [24, { width: 6, height: 6, pairCount: 13 }],
    [26, { width: 6, height: 6, pairCount: 13 }], [27, { width: 7, height: 7, pairCount: 15 }],
    [30, { width: 7, height: 7, pairCount: 15 }], [31, { width: 7, height: 7, pairCount: 16 }],
  ]);
});

test("level numbers must be integers inside the finite campaign", () => {
  for (const invalid of [0, 101, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => getLevelConfig(invalid), RangeError);
    assert.throws(() => getChapterNumber(invalid), RangeError);
    assert.throws(() => hasNextLevel(invalid), RangeError);
  }
});

test("only levels 1 through 99 have a next level", () => {
  for (let level = 1; level < TOTAL_LEVELS; level += 1) assert.equal(hasNextLevel(level), true);
  assert.equal(hasNextLevel(100), false);
  assert.throws(() => createLevel(101), RangeError);
});

test("campaign multi-stage distribution and stage split are frozen", () => {
  const expected = [21, 24, 30, 35, 39, 43, 48, 54, 59, 63, 68, 73, 77, 80, 82, 87, 91, 94, 100];
  assert.deepEqual(MULTI_STAGE_LEVELS.map(({ levelNumber }) => levelNumber), expected);
  assert.equal(TOTAL_LEVELS, 100);
  assert.equal(expected.filter((level) => getStageCount(level) === 2).length, 14);
  assert.equal(expected.filter((level) => getStageCount(level) === 3).length, 5);
  assert.equal(Array.from({ length: TOTAL_LEVELS }, (_, index) => getStageCount(index + 1))
    .reduce((sum, count) => sum + count, 0), 124);
  for (let level = 1; level <= TOTAL_LEVELS; level += 1) {
    if (!expected.includes(level)) assert.equal(getStageCount(level), 1);
    if (level <= 20) assert.equal(getStageCount(level), 1);
  }
});

test("authored preludes are unique, in range, blocker-free, fit, and progress toward the final", () => {
  const levelNumbers = MULTI_STAGE_LEVELS.map(({ levelNumber }) => levelNumber);
  assert.equal(new Set(levelNumbers).size, levelNumbers.length);
  for (const { levelNumber, preStages } of MULTI_STAGE_LEVELS) {
    assert.ok(levelNumber >= 1 && levelNumber <= TOTAL_LEVELS);
    assert.ok(preStages.length >= 1 && preStages.length <= 2);
    const configs = getLevelStageConfigs(levelNumber);
    for (let index = 0; index < configs.length - 1; index += 1) {
      const config = configs[index];
      const next = configs[index + 1];
      assert.equal(config.blockedCells, undefined);
      assert.ok(config.pairCount * 2 <= config.width * config.height);
      assert.ok(config.pairCount < next.pairCount);
      assert.ok(config.width * config.height <= next.width * next.height);
      if (![21, 24, 30].includes(levelNumber)) {
        assert.ok(createLevelStage(levelNumber, index).metrics.initialLegalMoveCount >= 2);
      }
    }
  }
});

test("pre-stage seeds and exact pilot configs are stable", () => {
  assert.deepEqual([preStageSeed(21, 0), preStageSeed(24, 0), preStageSeed(30, 0), preStageSeed(30, 1)],
    [422698975, 1803337488, 1422392722, 319819725]);
  const profiles = [21, 24, 30].map((level) => getLevelStageConfigs(level)
    .map(({ width, height, pairCount, seed, blockedCells }) =>
      ({ width, height, pairCount, seed, blockerCount: blockedCells?.length ?? 0 })));
  assert.deepEqual(profiles, [
    [{ width: 5, height: 5, pairCount: 8, seed: 422698975, blockerCount: 0 },
      { width: 6, height: 6, pairCount: 12, seed: levelSeed(21), blockerCount: 0 }],
    [{ width: 5, height: 6, pairCount: 10, seed: 1803337488, blockerCount: 0 },
      { width: 6, height: 6, pairCount: 13, seed: levelSeed(24), blockerCount: 0 }],
    [{ width: 4, height: 5, pairCount: 6, seed: 1422392722, blockerCount: 0 },
      { width: 5, height: 6, pairCount: 9, seed: 319819725, blockerCount: 0 },
      { width: 7, height: 7, pairCount: 15, seed: levelSeed(30), blockerCount: 3 }],
  ]);
  assert.equal(new Set(profiles.flat().map(({ seed }) => seed)).size, 7);
});

test("every campaign stage validates, solves, replays, preserves blockers, and avoids adjacent pairs", () => {
  for (let levelNumber = 1; levelNumber <= TOTAL_LEVELS; levelNumber += 1) {
    const configs = getLevelStageConfigs(levelNumber);
    assert.deepEqual(configs.at(-1), getLevelConfig(levelNumber));
    for (let stageIndex = 0; stageIndex < configs.length; stageIndex += 1) {
      const generated = createLevelStage(levelNumber, stageIndex);
      assert.deepEqual(generated.board.toRows(), createLevelStage(levelNumber, stageIndex).board.toRows());
      assert.equal(validateGeneratedLevel(generated).valid, true, `${levelNumber}:${stageIndex} validates`);
      const solved = solveBoard(generated.board);
      assert.equal(solved.status, "solved", `${levelNumber}:${stageIndex} solves`);
      let replay = generated.board;
      for (const move of solved.moves) replay = applyMove(replay, move);
      assert.equal(replay.hasTiles(), false);
      assert.deepEqual(replay.blockedCells(), generated.board.blockedCells());
      for (const move of generated.witness) {
        assert.notEqual(Math.abs(move.start.col - move.end.col) + Math.abs(move.start.row - move.end.row), 1);
      }
    }
    const final = createLevelStage(levelNumber, configs.length - 1);
    const original = createLevel(levelNumber);
    assert.deepEqual(final.board.toRows(), original.board.toRows());
    assert.deepEqual(final.board.blockedCells(), original.board.blockedCells());
    assert.deepEqual(final.witness, original.witness);
  }
});

test("stage clear outcomes keep the level stable and reset actions target stage zero", () => {
  assert.deepEqual(getStageClearOutcome(30, 0), { kind: "next-stage", stageIndex: 1 });
  assert.deepEqual(getStageClearOutcome(30, 1), { kind: "next-stage", stageIndex: 2 });
  assert.deepEqual(getStageClearOutcome(30, 2), { kind: "level-complete" });
  assert.deepEqual(getStageClearOutcome(99, 0), { kind: "level-complete" });
  assert.equal(getStageCount(100), 2);
  assert.deepEqual(getStageClearOutcome(100, 0), { kind: "next-stage", stageIndex: 1 });
  assert.deepEqual(getStageClearOutcome(100, 1), { kind: "level-complete" });
  assert.equal(hasNextLevel(100), false);
  // Replay, Next Level, and campaign restart all call PlayScene.startLevel(), whose first action is stageIndex = 0.
  assert.deepEqual(createLevelStage(21, 0).config, getLevelStageConfigs(21)[0]);
});

test("first 100 sequence levels are distinct, valid, non-adjacent, and solvable", () => {
  const seeds = new Set();
  let previousSnapshot = null;
  for (let levelNumber = 1; levelNumber <= 100; levelNumber += 1) {
    const config = getLevelConfig(levelNumber);
    assert.deepEqual(config, getLevelConfig(levelNumber), `level ${levelNumber} config must be deterministic`);
    const level = createLevel(levelNumber);
    const snapshot = JSON.stringify({ rows: level.board.toRows(), blocked: level.board.blockedCells() });
    seeds.add(config.seed);
    assert.equal(validateGeneratedLevel(level).valid, true, `level ${levelNumber} must validate`);
    const solver = solveBoard(level.board);
    assert.equal(solver.status, "solved", `level ${levelNumber} must solve`);
    let replay = level.board;
    for (const move of solver.moves) {
      assert.deepEqual(findPath(replay, move.start, move.end), move.path);
      replay = applyMove(replay, move);
    }
    assert.ok(replay.toRows().flat().every((tile) => tile === null), `level ${levelNumber} solver replay must empty board`);
    assert.deepEqual(replay.blockedCells(), level.board.blockedCells(), `level ${levelNumber} blockers must survive replay`);
    for (const move of level.witness) {
      const distance = Math.abs(move.start.col - move.end.col) + Math.abs(move.start.row - move.end.row);
      assert.notEqual(distance, 1, `level ${levelNumber} must not start with adjacent pairs`);
    }
    if (previousSnapshot !== null) {
      assert.notEqual(snapshot, previousSnapshot, `level ${levelNumber} must differ from its predecessor`);
    }
    const repeated = createLevel(levelNumber).board;
    assert.equal(snapshot, JSON.stringify({ rows: repeated.toRows(), blocked: repeated.blockedCells() }), "replay must reproduce the board");
    if (levelNumber <= 4) assert.ok(level.metrics.initialLegalMoveCount >= 2, `level ${levelNumber} must start with at least two moves`);
    if (levelNumber === 5) assert.equal(level.metrics.initialLegalMoveCount, 1,
      "level 5's frozen seed on the approved 4x4 geometry has one initial move");
    assert.ok(level.metrics.initialLegalMoveCount >= 1, `level ${levelNumber} must start with a move`);
    previousSnapshot = snapshot;
  }
  assert.equal(seeds.size, 100);
  assert.notEqual(getLevelConfig(42).seed, getLevelConfig(43).seed);
});

test("every legal move encountered in campaign blocker solver replay preserves solvability", () => {
  for (const { levelNumber } of CAMPAIGN_BLOCKERS) {
    let board = createLevel(levelNumber).board;
    const replay = solveBoard(board);
    assert.equal(replay.status, "solved");
    for (const chosen of replay.moves) {
      for (const move of findLegalMoves(board)) {
        assert.equal(solveBoard(applyMove(board, move)).status, "solved", `level ${levelNumber} legal move must remain solvable`);
      }
      board = applyMove(board, chosen);
    }
  }
});

test("real cell centers and the full board fit the portrait play area", () => {
  const full = layout(7, 7);
  assert.deepEqual(full.cellCenter({ col: 0, row: 0 }), { x: 48, y: 228 });
  assert.deepEqual(full.cellCenter({ col: 6, row: 6 }), { x: 432, y: 612 });
  assert.deepEqual(
    [full.boardLeft, full.boardTop, full.boardRight, full.boardBottom],
    [16, 196, 464, 644],
  );
  assert.equal(BoardLayout.CELL_PITCH, 64);
  assert.equal(BoardLayout.TILE_SIZE, 56);
  assert.equal(full.pitch, BoardLayout.CELL_PITCH);
  assert.equal(full.tileSize, BoardLayout.TILE_SIZE);
  assert.equal(BoardLayout.CELL_PITCH - BoardLayout.TILE_SIZE, 8);
  assert.equal(7 * BoardLayout.CELL_PITCH, 448);
  assert.ok(full.boardLeft >= 0 && full.boardRight <= 480);
});

test("production board and tile visual policies protect frozen geometry and tokens", () => {
  const cases = [
    [4, [112, 292, 368, 548], [104, 284, 376, 556]],
    [5, [80, 260, 400, 580], [72, 252, 408, 588]],
    [6, [48, 228, 432, 612], [40, 220, 440, 620]],
    [7, [16, 196, 464, 644], [8, 188, 472, 652]],
  ];
  for (const [side, expectedContent, expectedFrame] of cases) {
    const board = layout(side, side);
    const content = getBoardContentBounds(board);
    const frame = getBoardFrameBounds(board);
    const aperture = getBoardArtworkApertureBounds(board);
    assert.deepEqual([content.left, content.top, content.right, content.bottom], expectedContent);
    assert.deepEqual([frame.left, frame.top, frame.right, frame.bottom], expectedFrame);
    assert.deepEqual(
      [aperture.left, aperture.top, aperture.right, aperture.bottom],
      expectedContent.map((edge, index) => index < 2
        ? edge + BOARD_ARTWORK_APERTURE_INSET : edge - BOARD_ARTWORK_APERTURE_INSET),
    );
    const outlinePath = [
      frame.left + BOARD_VISUAL_STYLE.outlineInset,
      frame.top + BOARD_VISUAL_STYLE.outlineInset,
      frame.right - BOARD_VISUAL_STYLE.outlineInset,
      frame.bottom - BOARD_VISUAL_STYLE.outlineInset,
    ];
    assert.deepEqual(outlinePath.map((edge, index) => (
      index < 2 ? edge - BOARD_VISUAL_STYLE.borderWidth / 2
        : edge + BOARD_VISUAL_STYLE.borderWidth / 2
    )), expectedFrame);
    assert.deepEqual([content.centerX, content.centerY], [240, 420]);
  }
  const rectangular = layout(5, 6);
  assert.deepEqual([getBoardContentBounds(rectangular).centerX, getBoardContentBounds(rectangular).centerY], [240, 420]);
  assert.equal(rectangular.pitch, 64);
  assert.equal(BOARD_FRAME_PADDING, 8);
  assert.equal(BOARD_ARTWORK_APERTURE_INSET, 2);
  assert.equal(BOARD_ARTWORK_APERTURE_RADIUS, 14);
  assert.equal(BOARD_SHEET_OFFSET_X, 0);
  assert.equal(BOARD_SHEET_OFFSET_Y, 7);
  assert.equal("innerEdgeWidth" in BOARD_VISUAL_STYLE, false);
  assert.equal((BoardLayout.CELL_PITCH - BoardLayout.TILE_SIZE) / 2, 4);
  assert.equal(BOARD_VISUAL_STYLE.outerRadius, 24);
  assert.equal(BOARD_VISUAL_STYLE.innerRadius, 16);
  assert.equal(BOARD_VISUAL_STYLE.borderWidth, 2);
  assert.equal(BOARD_VISUAL_STYLE.outlineInset, 1);
  assert.equal(BOARD_VISUAL_STYLE.outlineRadius + BOARD_VISUAL_STYLE.outlineInset, 24);
  assert.equal(BOARD_VISUAL_STYLE.frameFill, VISUAL_COLORS.surface.elevated.phaser);
  assert.equal(BOARD_VISUAL_STYLE.frameBorder, VISUAL_COLORS.border.strong.phaser);
  assert.equal(BOARD_VISUAL_STYLE.backingFill, VISUAL_COLORS.surface.elevated.phaser);
  assert.equal("backingBorder" in BOARD_VISUAL_STYLE, false);
  assert.equal(BOARD_VISUAL_STYLE.frameFill, BOARD_VISUAL_STYLE.backingFill);
  assert.notEqual(BOARD_VISUAL_STYLE.frameFill, VISUAL_COLORS.border.strong.phaser);
  assert.equal(TILE_VISUAL_STYLE.size, 56);
  const tileClearance = (BoardLayout.CELL_PITCH - BoardLayout.TILE_SIZE) / 2;
  const curveCenter = tileClearance + TILE_VISUAL_STYLE.radius;
  assert.equal(curveCenter, 16);
  assert.equal(BOARD_VISUAL_STYLE.outerRadius - BOARD_FRAME_PADDING, curveCenter);
  assert.equal(BOARD_VISUAL_STYLE.innerRadius, curveCenter);
  assert.equal(
    BOARD_ARTWORK_APERTURE_INSET + BOARD_ARTWORK_APERTURE_RADIUS,
    curveCenter,
  );
  assert.equal(
    BOARD_VISUAL_STYLE.outerRadius - BOARD_VISUAL_STYLE.innerRadius,
    BOARD_FRAME_PADDING,
  );
  assert.equal(
    BOARD_VISUAL_STYLE.outerRadius - BOARD_ARTWORK_APERTURE_RADIUS,
    BOARD_FRAME_PADDING + BOARD_ARTWORK_APERTURE_INSET,
  );
  assert.equal(TILE_VISUAL_STYLE.radius, 12);
  assert.equal(TILE_VISUAL_STYLE.fill, VISUAL_COLORS.surface.card.phaser);
  assert.equal(TILE_VISUAL_STYLE.border, VISUAL_COLORS.divider.phaser);
  assert.equal(TILE_VISUAL_STYLE.borderWidth, BORDERS.divider);
  assert.equal(TILE_VISUAL_STYLE.selectedBorder, VISUAL_COLORS.route.core.phaser);
  assert.equal(TILE_VISUAL_STYLE.selectedFill, VISUAL_COLORS.state.selectedFill.phaser);
  assert.equal(TILE_VISUAL_STYLE.hintBorder, VISUAL_COLORS.state.hint.phaser);
  assert.equal(TILE_VISUAL_STYLE.blockedBorder, VISUAL_COLORS.state.danger.phaser);
  assert.equal(TILE_VISUAL_STYLE.emphasizedBorderWidth, 3);
  assert.equal(TILE_VISUAL_STYLE.selectedMarker, false);
  assert.equal(TILE_VISUAL_STYLE.pressedFill, VISUAL_COLORS.state.pressedFill.phaser);
  assert.equal(TILE_VISUAL_STYLE.pressedDuration, 80);
  assert.equal(PRODUCTION_SYMBOL_DISPLAY_SIZE, 56);
  assert.equal(LEGACY_SYMBOL_DISPLAY_SIZE, 38);
});

test("frame opening policy applies overlap only when artwork is present", () => {
  const square = layout(4, 4);
  const artworkOpening = getBoardFrameOpening(square, true);
  assert.deepEqual(
    [artworkOpening.bounds.left, artworkOpening.bounds.top,
      artworkOpening.bounds.right, artworkOpening.bounds.bottom, artworkOpening.radius],
    [114, 294, 366, 546, 14],
  );
  const noArtworkOpening = getBoardFrameOpening(square, false);
  assert.deepEqual(
    [noArtworkOpening.bounds.left, noArtworkOpening.bounds.top,
      noArtworkOpening.bounds.right, noArtworkOpening.bounds.bottom, noArtworkOpening.radius],
    [112, 292, 368, 548, 16],
  );

  const rectangular = layout(5, 6);
  assert.deepEqual(getBoardFrameOpening(rectangular, false).bounds, getBoardContentBounds(rectangular));
  assert.equal(getBoardFrameOpening(rectangular, false).radius, BOARD_VISUAL_STYLE.innerRadius);
});

test("artwork aperture corner tangents keep a fixed radius across board sizes", () => {
  for (const [side, expected] of [
    [4, {
      topLeft: [[114, 294], [128, 308], [128, 294], [114, 308]],
      topRight: [[366, 294], [352, 308], [352, 294], [366, 308]],
      bottomRight: [[366, 546], [352, 532], [352, 546], [366, 532]],
      bottomLeft: [[114, 546], [128, 532], [128, 546], [114, 532]],
    }],
    [7, {
      topLeft: [[18, 198], [32, 212], [32, 198], [18, 212]],
      topRight: [[462, 198], [448, 212], [448, 198], [462, 212]],
      bottomRight: [[462, 642], [448, 628], [448, 642], [462, 628]],
      bottomLeft: [[18, 642], [32, 628], [32, 642], [18, 628]],
    }],
  ]) {
    const corners = getBoardArtworkApertureCorners(layout(side, side));
    for (const name of ["topLeft", "topRight", "bottomRight", "bottomLeft"]) {
      const geometry = corners[name];
      assert.deepEqual([
        [geometry.corner.x, geometry.corner.y],
        [geometry.center.x, geometry.center.y],
        [geometry.horizontalTangent.x, geometry.horizontalTangent.y],
        [geometry.verticalTangent.x, geometry.verticalTangent.y],
      ], expected[name]);
      assert.equal(Math.abs(geometry.center.x - geometry.verticalTangent.x), BOARD_ARTWORK_APERTURE_RADIUS);
      assert.equal(Math.abs(geometry.center.y - geometry.horizontalTangent.y), BOARD_ARTWORK_APERTURE_RADIUS);
    }
  }
});

test("stage stack backing count communicates remaining stages", () => {
  assert.equal(getVisibleBackingCount(0, 3), 2);
  assert.equal(getVisibleBackingCount(1, 3), 1);
  assert.equal(getVisibleBackingCount(2, 3), 0);
  assert.equal(getVisibleBackingCount(0, 2), 1);
  assert.equal(getVisibleBackingCount(0, 1), 0);
  const offsets = (stageIndex, stageCount) => Array.from(
    { length: getVisibleBackingCount(stageIndex, stageCount) },
    (_, index) => [(index + 1) * BOARD_SHEET_OFFSET_X, (index + 1) * BOARD_SHEET_OFFSET_Y],
  );
  assert.deepEqual(offsets(0, 3), [[0, 7], [0, 14]]);
  assert.deepEqual(offsets(1, 3), [[0, 7]]);
  assert.deepEqual(offsets(2, 3), []);
});

test("stage sheet shade follows current visual depth rather than stage identity", () => {
  assert.deepEqual(BOARD_SHEET_SHADE_ALPHA, [0, 0.16, 0.28]);
  const shades = [0, 1, 2].map(getBackingSheetShadeAlpha);
  assert.deepEqual(shades, [0, 0.16, 0.28]);
  assert.ok(shades[2] > shades[1] && shades[1] > shades[0]);
  assert.throws(() => getBackingSheetShadeAlpha(3), RangeError);

  const stageShades = (stageIndex, stageCount) => [
    getBackingSheetShadeAlpha(0),
    ...Array.from(
      { length: getVisibleBackingCount(stageIndex, stageCount) },
      (_, index) => getBackingSheetShadeAlpha(index + 1),
    ),
  ];
  assert.deepEqual(stageShades(0, 2), [0, 0.16]);
  assert.deepEqual(stageShades(1, 2), [0]);
  assert.deepEqual(stageShades(0, 3), [0, 0.16, 0.28]);
  assert.deepEqual(stageShades(1, 3), [0, 0.16]);
  assert.deepEqual(stageShades(2, 3), [0]);
});

test("smaller boards remain centered in the same safe play area", () => {
  const square = layout(4, 4);
  const short = layout(4, 2);
  assert.deepEqual([square.boardLeft, square.boardRight, square.boardTop, square.boardBottom], [112, 368, 292, 548]);
  assert.deepEqual([short.boardLeft, short.boardRight, short.boardTop, short.boardBottom], [112, 368, 356, 484]);
  assert.equal((square.boardLeft + square.boardRight) / 2, 240);
  assert.equal((short.boardTop + short.boardBottom) / 2, 420);
});

test("square board footprints use the fixed global scale", () => {
  for (const [side, footprint] of [[4, 256], [5, 320], [6, 384], [7, 448]]) {
    const board = layout(side, side);
    assert.equal(board.boardRight - board.boardLeft, footprint);
    assert.equal(board.boardBottom - board.boardTop, footprint);
  }
});

test("layout rejects coordinates outside the real board", () => {
  const full = layout(7, 7);
  assert.throws(() => full.cellCenter({ col: -1, row: 0 }), RangeError);
  assert.throws(() => full.cellCenter({ col: 7, row: 0 }), RangeError);
  assert.throws(() => full.cellCenter({ col: 0, row: 7 }), RangeError);
});
