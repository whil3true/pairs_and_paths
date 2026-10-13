import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (name) => readFile(new URL(`../src/audio/${name}`, import.meta.url), "utf8");

test("short SFX use predecoded buffers and play immediately on a valid tap", async () => {
  const output = await read("HtmlAudioOutput.ts");
  assert.match(output, /context\.decodeAudioData\(bytes\)/);
  assert.match(output, /context\.createBufferSource\(\)/);
  assert.match(output, /source\.start\(0\)/);
  assert.match(output, /this\.buffers\.set\(path, buffer\)/);
  assert.match(output, /if \(this\.fallbackPools\.has\(path\)\) this\.playFallback/);
});

test("music starts from a preloaded first track and failed play can be retried", async () => {
  const output = await read("HtmlAudioOutput.ts");
  assert.match(output, /music\.preload = "auto"/);
  assert.match(output, /this\.preparedFirstTrack = music/);
  assert.match(output, /path === AUDIO_MUSIC\[0\]!\.path \? prepared : new Audio\(path\)/);
  assert.match(output, /this\.musicNeedsRetry = true/);
  assert.match(output, /this\.musicPlayPending/);
  assert.match(output, /if \(!this\.music\.paused && !this\.musicNeedsRetry\) return/);
  assert.doesNotMatch(output, /if \(this\.music !== player \|\| this\.musicPlayPending\) return/);
});

test("pagehide, blur and hidden document suspend both playback channels", async () => {
  const browser = await read("BrowserAudioLifecycle.ts");
  const manager = await read("AudioManager.ts");
  assert.match(browser, /const pagehide = \(\): void => \{ pageGone = true; focused = false; sync\(\); \}/);
  assert.match(browser, /const sync = \(\): void => manager\.setPageVisible\(!pageGone && !doc\.hidden && focused\)/);
  assert.match(manager, /this\.output\.setEffectsActive\?\.\(/);
  assert.match(manager, /this\.output\.pauseMusic\(\)/);
  const output = await read("HtmlAudioOutput.ts");
  assert.match(output, /context\.suspend\(\)/);
});
