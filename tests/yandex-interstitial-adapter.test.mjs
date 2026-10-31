import assert from "node:assert/strict";
import test from "node:test";
import { YandexPlatform } from "../.test-dist/platform/YandexPlatform.js";

const create = (handler) => {
  const ads = [];
  const sdk = {
    environment: { i18n: { lang: "ru" } },
    features: {},
    on() {}, off() {},
    adv: { showFullscreenAdv(callbacks) {
      ads.push(callbacks);
      handler?.(callbacks);
    } },
  };
  return { adapter: new YandexPlatform(sdk), ads };
};

test("fullscreen callbacks are passed directly to Yandex SDK (no nested callbacks)", async () => {
  const { adapter, ads } = create(callbacks => {
    assert.equal(typeof callbacks.onOpen, "function");
    assert.equal(typeof callbacks.onClose, "function");
    assert.equal(typeof callbacks.onError, "function");
    assert.equal("callbacks" in callbacks, false);
    callbacks.onOpen();
    callbacks.onClose(true);
  });
  assert.equal(await adapter.showInterstitial(), true);
  assert.equal(ads.length, 1);
  adapter.destroy();
});

test("onClose(false) skips safely, onError and onClose settle only once", async () => {
  const noAd = create(callbacks => callbacks.onClose(false));
  assert.equal(await noAd.adapter.showInterstitial(), false);
  noAd.adapter.destroy();

  const bad = create(callbacks => {
    callbacks.onError({ code: "NO_FILL" });
    callbacks.onClose(false);
  });
  assert.equal(await bad.adapter.showInterstitial(), false);
  bad.adapter.destroy();
});

test("missing adv or throwing SDK cannot stall navigation", async () => {
  const noAdv = new YandexPlatform({ on(){}, off(){} });
  assert.equal(await noAdv.showInterstitial(), false);
  noAdv.destroy();
  const bad = create(() => { throw Error("sdk failed"); });
  assert.equal(await bad.adapter.showInterstitial(), false);
  bad.adapter.destroy();
});

test("ad close commits navigation immediately without overriding an SDK pause", async () => {
  const handlers = new Map();
  let callbacks;
  const sdk = {
    on(name, fn) { handlers.set(name, fn); },
    off(name) { handlers.delete(name); },
    adv: { showFullscreenAdv(value) { callbacks = value; } },
  };
  const platform = new YandexPlatform(sdk);
  callbacks = undefined;
  const pending = platform.showInterstitial();
  callbacks.onOpen();
  handlers.get("game_api_pause")();
  callbacks.onClose(true);
  assert.equal(await pending, true, "the chosen action can navigate at ad close");
  assert.equal(platform.isPaused, true, "navigation never fabricates SDK resume");
  handlers.get("game_api_resume")();
  assert.equal(platform.isPaused, false);
  platform.destroy();
});

test("close before delayed resume settles only once and removes no SDK pause listeners", async () => {
  const handlers = new Map();
  let callbacks;
  const sdk = {
    on(name, fn) { handlers.set(name, fn); },
    off(name) { handlers.delete(name); },
    adv: { showFullscreenAdv(value) { callbacks = value; } },
  };
  const platform = new YandexPlatform(sdk);
  const pending = platform.showInterstitial();
  callbacks.onOpen();
  handlers.get("game_api_pause")();
  callbacks.onClose(true);
  callbacks.onClose(false);
  callbacks.onError({ code: "LATE" });
  assert.equal(await pending, true);
  assert.equal(platform.isPaused, true);
  handlers.get("game_api_resume")();
  platform.destroy();
});

test("SDK resume before onClose is also safe, and a skipped ad completes without pause", async () => {
  const handlers = new Map();
  let callbacks;
  const sdk = {
    on(name, fn) { handlers.set(name, fn); },
    off(name) { handlers.delete(name); },
    adv: { showFullscreenAdv(value) { callbacks = value; } },
  };
  const platform = new YandexPlatform(sdk);
  const first = platform.showInterstitial();
  callbacks.onOpen();
  handlers.get("game_api_pause")();
  handlers.get("game_api_resume")();
  callbacks.onClose(true);
  assert.equal(await first, true);

  const second = platform.showInterstitial();
  callbacks.onClose(false);
  assert.equal(await second, false);
  platform.destroy();
});
