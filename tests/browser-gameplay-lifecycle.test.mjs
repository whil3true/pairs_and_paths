import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { attachBrowserGameplayLifecycle } from "../.test-dist/game/BrowserGameplayLifecycle.js";

class FakeEventTarget {
  listeners = new Map();

  addEventListener(type, listener) {
    this.listeners.set(type, new Set([...(this.listeners.get(type) ?? []), listener]));
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener();
  }

  listenerCount(type) { return this.listeners.get(type)?.size ?? 0; }
}

class FakeDocument extends FakeEventTarget {
  hidden = false;
  documentElement = { style: { setProperty() {} } };
}

test("visibility lifecycle is primary, idempotent, and ignores harmless focus changes", () => {
  const win = new FakeEventTarget();
  const doc = new FakeDocument();
  const events = [];
  const cleanup = attachBrowserGameplayLifecycle({
    onBackground: () => events.push("background"),
    onForeground: () => events.push("foreground"),
  }, win, doc);

  win.emit("blur");
  win.emit("focus");
  assert.deepEqual(events, []);
  doc.hidden = true;
  doc.emit("visibilitychange");
  doc.emit("visibilitychange");
  win.emit("pagehide");
  assert.deepEqual(events, ["background"]);
  doc.hidden = false;
  doc.emit("visibilitychange");
  win.emit("pageshow");
  assert.deepEqual(events, ["background", "foreground"]);

  cleanup();
  cleanup();
  assert.equal(doc.listenerCount("visibilitychange"), 0);
  assert.equal(win.listenerCount("pagehide"), 0);
  assert.equal(win.listenerCount("pageshow"), 0);
});

test("pagehide/pageshow provide an idempotent fallback", () => {
  const win = new FakeEventTarget();
  const doc = new FakeDocument();
  const events = [];
  const cleanup = attachBrowserGameplayLifecycle({
    onBackground: () => events.push("background"),
    onForeground: () => events.push("foreground"),
  }, win, doc);
  win.emit("pagehide");
  win.emit("pagehide");
  win.emit("pageshow");
  assert.deepEqual(events, ["background", "foreground"]);
  cleanup();
});

test("Menu, Gallery, Full View, and audio do not acquire gameplay-pause subscriptions", async () => {
  const [menu, gallery, fullView, audio] = await Promise.all([
    readFile(new URL("../src/game/MainMenuScene.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/game/ArtworkGalleryScene.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/game/ArtworkFullViewScene.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/audio/BrowserAudioLifecycle.ts", import.meta.url), "utf8"),
  ]);
  for (const source of [menu, gallery, fullView]) {
    assert.doesNotMatch(source, /attachBrowserGameplayLifecycle/);
  }
  assert.match(audio, /visibilitychange/);
  assert.match(audio, /pagehide/);
  assert.doesNotMatch(audio, /BrowserGameplayLifecycle/,
    "gameplay lifecycle remains independent from the existing audio lifecycle");
});

test("PlayScene browser pause freezes progress until explicit Continue", async () => {
  const previousPhaser = globalThis.Phaser;

  class MockScene {
    constructor() {
      this.events = new EventEmitter();
      this.sys = { isActive: () => true };
      this.scene = { isActive: () => true };
      this.scale = new EventEmitter();
      this.load = { isLoading: () => false, reset() {} };
      this.textures = { exists: () => false, remove() {} };
      this.time = { paused: false };
      this.tweens = {
        pauseCount: 0,
        resumeCount: 0,
        pauseAll() { this.pauseCount += 1; },
        resumeAll() { this.resumeCount += 1; },
      };
    }
  }
  globalThis.Phaser = {
    Scene: MockScene,
    Scenes: { Events: { SHUTDOWN: "shutdown" } },
    Loader: { Events: { FILE_LOAD_ERROR: "loaderror" } },
    Scale: { Events: { RESIZE: "resize" } },
  };

  try {
    const { PlayScene } = await import("../.test-dist/game/PlayScene.js?browser-pause");
    const progressStore = { load: () => ({ version: 1, completedThroughLevel: 0 }) };
    const makeOverlay = () => ({
      alpha: 1,
      destroyed: false,
      setAlpha(value) { this.alpha = value; return this; },
      destroy() { this.destroyed = true; },
    });
    const makeScene = () => {
      const scene = new PlayScene({}, progressStore);
      scene.gameplayUiReady = true;
      scene.currentLevelNumber = 14;
      scene.currentStageIndex = 2;
      scene.showPauseCount = 0;
      scene.showPauseMenu = () => {
        scene.showPauseCount += 1;
        scene.pauseOverlay = makeOverlay();
        scene.pauseContent = { setAlpha() { return this; }, setY() { return this; } };
      };
      return scene;
    };

    const scene = makeScene();
    const before = { level: scene.currentLevelNumber, stage: scene.currentStageIndex };
    scene.handleBrowserBackground();
    const overlay = scene.pauseOverlay;
    assert.ok(overlay, "backgrounding active gameplay displays the existing Pause presentation");
    assert.equal(scene.time.paused, true);
    assert.equal(scene.inputLocked, true);
    assert.equal(scene.showPauseCount, 1);
    scene.handleBrowserForeground();
    assert.equal(scene.pauseOverlay, overlay, "foregrounding does not replace or dismiss Pause");
    assert.equal(scene.time.paused, true, "foregrounding does not auto-resume gameplay");
    assert.deepEqual(
      { level: scene.currentLevelNumber, stage: scene.currentStageIndex }, before,
      "browser interruption preserves level and stage",
    );

    scene.dismissPauseOverlay();
    assert.equal(scene.pauseOverlay, null);
    assert.equal(scene.time.paused, false);
    assert.equal(scene.inputLocked, false);
    assert.equal(scene.tweens.resumeCount, 1);

    const alreadyPaused = makeScene();
    const manualOverlay = makeOverlay();
    alreadyPaused.pauseOverlay = manualOverlay;
    alreadyPaused.pauseContent = { setAlpha() { return this; }, setY() { return this; } };
    alreadyPaused.handleBrowserBackground();
    alreadyPaused.handleBrowserBackground();
    alreadyPaused.handleBrowserForeground();
    assert.equal(alreadyPaused.pauseOverlay, manualOverlay);
    assert.equal(alreadyPaused.showPauseCount, 0, "manual Pause is neither replaced nor duplicated");
    assert.equal(alreadyPaused.tweens.pauseCount, 1, "repeated background events are idempotent");

    const transition = makeScene();
    transition.inputLocked = true;
    transition.handleBrowserBackground();
    transition.handleBrowserForeground();
    assert.equal(transition.inputLocked, true);
    assert.equal(transition.currentStageIndex, 2);
    transition.dismissPauseOverlay();
    assert.equal(transition.inputLocked, true, "Continue restores the in-flight transition lock");

    const loading = makeScene();
    loading.presentationState = "complete";
    loading.retainCurrentArtwork = () => {};
    let finishLoading;
    loading.loadCurrentArtwork = (onReady) => { finishLoading = onReady; };
    loading.loadStage = () => {
      loading.presentationState = "gameplay";
      loading.ensureBrowserPauseOverlay();
    };
    loading.startLevel();
    assert.equal(loading.presentationState, "loading");
    loading.handleBrowserBackground();
    assert.equal(loading.pauseOverlay, null,
      "loading latches the interruption without covering the previous Complete UI");
    finishLoading();
    loading.handleBrowserForeground();
    assert.ok(loading.pauseOverlay, "loaded gameplay presents Pause after a hidden transition");
    assert.equal(loading.time.paused, true);

    for (const state of ["reward", "complete"]) {
      const presentation = makeScene();
      presentation.presentationState = state;
      presentation.handleBrowserBackground();
      assert.equal(presentation.pauseOverlay, null, `${state} presentation does not get gameplay Pause UI`);
      assert.equal(presentation.tweens.pauseCount, 0);
    }
  } finally {
    if (previousPhaser === undefined) delete globalThis.Phaser;
    else globalThis.Phaser = previousPhaser;
  }
});

test("backgrounding resolves interrupted Pause opening and dismissal animations", async () => {
  const previousPhaser = globalThis.Phaser;

  class FakeTween {
    stopped = false;

    constructor(config) { this.config = config; }
    stop() { this.stopped = true; }
    complete() { this.config.onComplete?.(); }
  }

  class MockScene {
    constructor() {
      this.events = new EventEmitter();
      this.sys = { isActive: () => true };
      this.scene = { isActive: () => true };
      this.scale = new EventEmitter();
      this.load = { isLoading: () => false, reset() {} };
      this.textures = { exists: () => false, remove() {} };
      this.time = { paused: false };
      this.tweens = {
        created: [],
        pauseCount: 0,
        resumeCount: 0,
        add(config) {
          const tween = new FakeTween(config);
          this.created.push(tween);
          return tween;
        },
        pauseAll() { this.pauseCount += 1; },
        resumeAll() { this.resumeCount += 1; },
      };
    }
  }
  globalThis.Phaser = {
    Scene: MockScene,
    Scenes: { Events: { SHUTDOWN: "shutdown" } },
    Loader: { Events: { FILE_LOAD_ERROR: "loaderror" } },
    Scale: { Events: { RESIZE: "resize" } },
  };

  try {
    const { PlayScene } = await import("../.test-dist/game/PlayScene.js?browser-dismissal");
    const progressStore = { load: () => ({ version: 1, completedThroughLevel: 0 }) };
    const makeOverlay = () => ({
      alpha: 1,
      destroyed: false,
      setAlpha(value) { this.alpha = value; return this; },
      destroy() { this.destroyed = true; },
    });
    const makeContent = () => ({
      alpha: 1,
      y: 0,
      setAlpha(value) { this.alpha = value; return this; },
      setY(value) { this.y = value; return this; },
    });
    const makeScene = () => {
      const scene = new PlayScene({}, progressStore);
      scene.gameplayUiReady = true;
      scene.showPauseMenu = () => {
        scene.pauseOverlay = makeOverlay();
        scene.pauseContent = makeContent();
      };
      scene.showPauseMenu();
      return scene;
    };

    // Pause -> Continue starts the exit tween. Backgrounding cancels that
    // dismissal and restores the same interactive Pause menu.
    const continuing = makeScene();
    let continueCount = 0;
    continuing.dismissPauseOverlay(() => { continueCount += 1; });
    const staleContinueTween = continuing.pauseTween;
    assert.equal(continuing.pauseClosing, true);
    continuing.pauseOverlay.alpha = 0.35;
    continuing.handleBrowserBackground();
    continuing.handleBrowserForeground();
    assert.equal(staleContinueTween.stopped, true);
    assert.equal(continuing.pauseClosing, false, "canceled dismissal cannot leave controls disabled");
    assert.equal(continuing.pauseOverlay.alpha, 1);
    staleContinueTween.complete();
    assert.equal(continueCount, 0, "stale dismissal completion is ignored");
    continuing.dismissPauseOverlay(() => { continueCount += 1; });
    assert.equal(continueCount, 1, "explicit Continue after restore resumes exactly once");
    assert.equal(continuing.pauseOverlay, null);
    assert.equal(continuing.time.paused, false);
    assert.equal(continuing.tweens.resumeCount, 1);

    // An interrupted opening tween is normalized to a fully visible menu.
    const opening = makeScene();
    opening.pauseOverlay.alpha = 0;
    opening.pauseContent.alpha = 0;
    opening.pauseContent.y = -12;
    const openingShellTween = new FakeTween({});
    const openingContentTween = new FakeTween({});
    opening.pauseTween = openingShellTween;
    opening.pauseContentTween = openingContentTween;
    opening.handleBrowserBackground();
    opening.handleBrowserForeground();
    assert.equal(openingShellTween.stopped, true);
    assert.equal(openingContentTween.stopped, true);
    assert.equal(opening.pauseClosing, false);
    assert.equal(opening.pauseOverlay.alpha, 1);
    assert.equal(opening.pauseContent.alpha, 1);
    assert.equal(opening.pauseContent.y, 0);

    // Restart and Exit confirmations use the same dismissal path. Canceled
    // callbacks stay stale, and the restored confirmation executes once only.
    for (const actionName of ["restart", "exit"]) {
      const confirmation = makeScene();
      let actionCount = 0;
      const action = () => { actionCount += 1; };
      confirmation.dismissPauseOverlay(action);
      const staleActionTween = confirmation.pauseTween;
      confirmation.handleBrowserBackground();
      confirmation.handleBrowserForeground();
      staleActionTween.complete();
      assert.equal(actionCount, 0, `${actionName} does not run from a stale completion`);
      assert.equal(confirmation.pauseClosing, false);
      confirmation.dismissPauseOverlay(action);
      assert.equal(actionCount, 1, `${actionName} runs once after explicit reactivation`);
      staleActionTween.complete();
      assert.equal(actionCount, 1, `${actionName} cannot run twice`);
    }

    const repeated = makeScene();
    for (let cycle = 0; cycle < 3; cycle += 1) {
      repeated.handleBrowserBackground();
      repeated.handleBrowserForeground();
      assert.equal(repeated.pauseClosing, false);
      repeated.dismissPauseOverlay();
      assert.equal(repeated.time.paused, false);
    }
    assert.equal(repeated.tweens.pauseCount, 3);
    assert.equal(repeated.tweens.resumeCount, 3);
  } finally {
    if (previousPhaser === undefined) delete globalThis.Phaser;
    else globalThis.Phaser = previousPhaser;
  }
});

test("PlayScene shutdown removes subscriptions and restart leaves no stale callbacks", async () => {
  const original = {
    Phaser: globalThis.Phaser,
    window: globalThis.window,
    document: globalThis.document,
  };
  const win = new FakeEventTarget();
  const doc = new FakeDocument();

  class MockScene {
    constructor() {
      this.events = new EventEmitter();
      this.sys = { isActive: () => true };
      this.scene = { isActive: () => true };
      this.scale = new EventEmitter();
      this.load = { isLoading: () => false, reset() {} };
      this.textures = { exists: () => false, remove() {} };
      this.time = { paused: false };
      this.tweens = { pauseAll() {}, resumeAll() {} };
    }
  }
  globalThis.Phaser = {
    Scene: MockScene,
    Scenes: { Events: { SHUTDOWN: "shutdown" } },
    Loader: { Events: { FILE_LOAD_ERROR: "loaderror" } },
    Scale: { Events: { RESIZE: "resize" } },
  };
  globalThis.window = win;
  globalThis.document = doc;

  try {
    const { PlayScene } = await import("../.test-dist/game/PlayScene.js?browser-cleanup");
    const scene = new PlayScene({}, { load: () => ({ version: 1, completedThroughLevel: 0 }) });
    const data = { levelNumber: 7, stageIndex: 1, persistenceEnabled: true };
    scene.init(data);
    assert.equal(doc.listenerCount("visibilitychange"), 1);
    assert.equal(win.listenerCount("pagehide"), 1);
    scene.events.emit("shutdown");
    assert.equal(doc.listenerCount("visibilitychange"), 0);
    assert.equal(win.listenerCount("pagehide"), 0);

    doc.hidden = true;
    doc.emit("visibilitychange");
    assert.equal(scene.browserPauseRequired, false, "shutdown callbacks cannot mutate the stopped scene");

    doc.hidden = false;
    scene.init(data);
    scene.init(data);
    assert.equal(doc.listenerCount("visibilitychange"), 1, "restart owns exactly one listener set");
    scene.events.emit("shutdown");
  } finally {
    if (original.Phaser === undefined) delete globalThis.Phaser;
    else globalThis.Phaser = original.Phaser;
    if (original.window === undefined) delete globalThis.window;
    else globalThis.window = original.window;
    if (original.document === undefined) delete globalThis.document;
    else globalThis.document = original.document;
  }
});
