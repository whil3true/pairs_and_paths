import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { AUDIO_EFFECTS, AUDIO_MUSIC } from "../.test-dist/audio/AudioAssetManifest.js";

const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), "utf8");

test("game bootstrap owns exactly one scene-independent audio manager", async () => {
  const source = await read("../src/main.ts");
  assert.match(source, /new AudioManager\(new HtmlAudioOutput\(\), new WebAudioSettingsStore\(\)\)/);
  assert.match(source, /configureAudioRuntime\(audioManager\)/);
  assert.match(source, /attachBrowserAudioLifecycle\(audioManager\)/);
});

test("UI activation plays a single shared click only when a button is released while armed", async () => {
  const source = await read("../src/game/UiPrimitives.ts");
  assert.match(source, /if \(disabled \|\| !armed\) return;[\s\S]*?playAudioEffect\("uiClick"\);[\s\S]*?options\.onActivate\(\)/);
});

test("gameplay attaches the sound-plan to semantic moves without doubled second-tap sound", async () => {
  const source = await read("../src/game/PlayScene.ts");
  assert.match(source, /if \(this\.selected === null\) \{\s*playAudioEffect\("tileFirst"\)/);
  assert.match(source, /if \(samePoint\(this\.selected, point\)\) \{\s*playAudioEffect\("tileSecond"\)/);
  assert.match(source, /if \(tileId !== null && path !== null\) \{[\s\S]*?playAudioEffect\("pairSuccess"\);\s*this\.completeMove/);
  assert.match(source, /if \(tileId !== null && tileId === this\.board\.tileAt\(point\)\) \{[\s\S]*?playAudioEffect\("pairInvalid"\);\s*this\.showBlockedPair/);
  assert.match(source, /if \(outcome\.kind === "level-complete"\) \{[\s\S]*?playAudioEffect\("levelComplete"\);/);
  assert.equal((source.match(/playAudioEffect\("pairSuccess"\)/g) ?? []).length, 1);
  assert.equal((source.match(/playAudioEffect\("levelComplete"\)/g) ?? []).length, 1);
});

test("asset mapping follows supplied filenames without invented hint or artwork jingles", () => {
  assert.deepEqual(Object.values(AUDIO_EFFECTS).map((path) => path.split("/").at(-1)), [
    "click_003.ogg", "drop_003.ogg", "drop_002.ogg", "drop_004.ogg", "bong_001.ogg", "jingles_PIZZI10.ogg",
  ]);
  assert.deepEqual(AUDIO_MUSIC.map((track) => track.path.split("/").at(-1)), [
    "forget_me_not_in_f_major_looped.ogg", "porcelain_hours.mp3",
  ]);
});

test("browser unlock precedes Phaser canvas's first tile tap", async () => {
  const source = await read("../src/audio/BrowserAudioLifecycle.ts");
  assert.match(source, /addEventListener\("pointerdown", unlock, \{ passive: true, capture: true \}\)/);
  assert.match(source, /removeEventListener\("pointerdown", unlock, true\)/);
});
