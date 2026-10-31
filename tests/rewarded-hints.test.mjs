import assert from "node:assert/strict";
import test from "node:test";
import { YandexPlatform } from "../.test-dist/platform/YandexPlatform.js";
import { WebPlatform } from "../.test-dist/platform/WebPlatform.js";
import { readFile } from "node:fs/promises";

const make = () => {
  let callbacks;
  const platform = new YandexPlatform({
    on() {}, off() {},
    adv: { showRewardedVideo(options) { callbacks = options.callbacks; } },
  });
  return { platform, callbacks: () => callbacks };
};

test("rewarded hint grants only after onRewarded and onClose", async () => {
  const { platform, callbacks } = make();
  const result = platform.showRewardedHint();
  callbacks().onOpen();
  callbacks().onRewarded();
  callbacks().onClose();
  assert.equal(await result, true);
  platform.destroy();
});

test("closing without reward and onError never grant a hint", async () => {
  const closed = make();
  const pending = closed.platform.showRewardedHint();
  closed.callbacks().onClose();
  assert.equal(await pending, false);
  closed.platform.destroy();

  const failed = make();
  const errored = failed.platform.showRewardedHint();
  failed.callbacks().onError({ code: "NO_FILL" });
  failed.callbacks().onRewarded(); // late callback is ignored
  assert.equal(await errored, false);
  failed.platform.destroy();
});

test("no rewarded API denies the hint, standalone web grants it", async () => {
  const unavailable = new YandexPlatform({ on() {}, off() {} });
  assert.equal(await unavailable.showRewardedHint(), false);
  unavailable.destroy();
  assert.equal(await new WebPlatform("ru").showRewardedHint(), true);
});

test("hint markers are independent of selected and blocked tile states", async () => {
  const tile = await readFile(new URL("../src/game/TileVisual.ts", import.meta.url), "utf8");
  const play = await readFile(new URL("../src/game/PlayScene.ts", import.meta.url), "utf8");
  assert.match(tile, /setHintVisible\(visible: boolean\)/);
  assert.match(tile, /\[this\.card, this\.symbol, this\.hintMark\]/);
  assert.match(play, /setHintVisible\(true\)/);
  assert.match(play, /setHintVisible\(false\)/);
  assert.doesNotMatch(play, /setState\("hint"\)/);
  assert.match(play, /this\.clearHintFeedback\(\);\s*this\.setSelected\(null\);\s*this\.animateRoute/);
});
