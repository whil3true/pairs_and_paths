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
