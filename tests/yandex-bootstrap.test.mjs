import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createPlatform, isStandaloneHost, YANDEX_SDK_PATH } from "../.test-dist/platform/createPlatform.js";
import { YandexPlatform } from "../.test-dist/platform/YandexPlatform.js";
import { hasInteractiveScene } from "../.test-dist/platform/GameReady.js";
import { WebPlatform } from "../.test-dist/platform/WebPlatform.js";

const mock = () => {
  const listeners = new Map();
  let readyCalls = 0;
  const gameplayCalls = [];
  const sdk = {
    environment: { i18n: { lang: "en" } },
    features: { LoadingAPI: { ready: () => { readyCalls++; } }, GameplayAPI: {
      start: () => gameplayCalls.push("start"), stop: () => gameplayCalls.push("stop"),
    } },
    on: (event, fn) => { listeners.set(event, fn); },
    off: (event, fn) => { if (listeners.get(event) === fn) listeners.delete(event); },
  };
  return { sdk, listeners, emit: (event) => listeners.get(event)?.(), readyCalls: () => readyCalls, gameplayCalls };
};

test("Yandex adapter subscribes to lifecycle before gameplay and sends Ready once", async () => {
  const m = mock();
  const platform = await createPlatform({
    isStandalone: false, loadSdk: async () => m.sdk, fallback: () => new WebPlatform("ru"),
  });
  assert.ok(platform instanceof YandexPlatform);
  assert.equal(platform.locale, "en");
  assert.equal(m.listeners.size, 2);
  platform.ready(); platform.ready();
  assert.equal(m.readyCalls(), 1);
  platform.setGameplayActive(true);
  platform.setGameplayActive(true);
  platform.setGameplayActive(false);
  platform.setGameplayActive(false);
  platform.setGameplayActive(true);
  assert.deepEqual(m.gameplayCalls, ["start", "stop", "start"]);
  const seen = [];
  platform.onPause(() => seen.push("pause"));
  platform.onResume(() => seen.push("resume"));
  m.emit("game_api_pause"); m.emit("game_api_pause");
  assert.equal(platform.isPaused, true);
  m.emit("game_api_resume"); m.emit("game_api_resume");
  assert.deepEqual(seen, ["pause", "resume"]);
  platform.destroy();
  assert.deepEqual(m.gameplayCalls, ["start", "stop", "start", "stop"]);
  assert.equal(m.listeners.size, 0);
});

test("GameplayAPI is optional", () => {
  const m = mock();
  delete m.sdk.features.GameplayAPI;
  const platform = new YandexPlatform(m.sdk);
  platform.setGameplayActive(true);
  platform.setGameplayActive(false);
  platform.destroy();
  assert.deepEqual(m.gameplayCalls, []);
});

test("late pause subscription receives state once", () => {
  const m = mock();
  const platform = new YandexPlatform(m.sdk);
  m.emit("game_api_pause");
  let calls = 0;
  platform.onPause(() => { calls++; });
  assert.equal(calls, 1);
  platform.destroy();
});

test("GitHub Pages and localhost bypass SDK; deployment hosts require valid SDK", async () => {
  assert.equal(YANDEX_SDK_PATH, "/sdk.js");
  for (const hostname of ["localhost", "127.0.0.1", "whil3true.github.io"]) {
    assert.equal(isStandaloneHost(hostname), true);
  }
  assert.equal(isStandaloneHost("games.s3.yandex.net"), false);
  let requested = 0;
  const web = await createPlatform({
    isStandalone: true,
    loadSdk: async () => { requested++; throw Error("should not request SDK"); },
    fallback: () => new WebPlatform("ru"),
  });
  assert.equal(web.id, "web");
  assert.equal(requested, 0);
  await assert.rejects(createPlatform({
    isStandalone: false, loadSdk: async () => { throw Error("init failed"); },
    fallback: () => new WebPlatform(),
  }), /init failed/);
});

test("Game Ready requires a playable scene, not only BootScene", () => {
  assert.equal(hasInteractiveScene([]), false);
  assert.equal(hasInteractiveScene(["BootScene"]), false);
  assert.equal(hasInteractiveScene(["MainMenuScene"]), true);
  assert.equal(hasInteractiveScene(["BootScene", "PlayScene"]), true);
  assert.equal(hasInteractiveScene(["SymbolGalleryScene"]), true);
});

test("SDK starts before audio and Phaser, no advertising invoked in stage 1", async () => {
  const main = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  assert.ok(main.indexOf("const platform = await createPlatform()") < main.indexOf("new AudioManager"));
  assert.ok(main.indexOf("const platform = await createPlatform()") < main.indexOf("new Phaser.Game"));
  assert.match(main, /attachGameReady\(game, platform\)/);
  assert.match(main, /platform\.onPause\(/);
  assert.doesNotMatch(main, /showFullscreenAdv|showRewardedVideo/);
});
