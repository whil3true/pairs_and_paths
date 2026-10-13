import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { open, stat } from "node:fs/promises";
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

test("every approved audio manifest file is present in public with valid nonempty media", async () => {
  const paths = [...Object.values(AUDIO_EFFECTS), ...AUDIO_MUSIC.map((track) => track.path)];
  assert.equal(paths.length, 8);
  assert.equal(new Set(paths).size, paths.length);
  for (const path of paths) {
    assert.match(path, /^assets\/audio\/[\w.-]+\.(ogg|mp3)$/);
    const url = new URL(`../public/${path}`, import.meta.url);
    const metadata = await stat(url);
    assert.ok(metadata.isFile(), `${path}: expected a file`);
    assert.ok(metadata.size > 100, `${path}: missing or empty sound data`);
    const handle = await open(url, "r");
    try {
      const header = Buffer.alloc(4);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      assert.equal(bytesRead, 4, `${path}: missing media header`);
      if (path.endsWith(".ogg")) assert.equal(header.toString("ascii"), "OggS", `${path}: invalid Ogg container`);
      else assert.ok(header.toString("ascii", 0, 3) === "ID3" || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0),
        `${path}: invalid MP3 header`);
    } finally {
      await handle.close();
    }
  }
});
