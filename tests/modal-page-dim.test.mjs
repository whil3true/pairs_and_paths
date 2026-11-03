import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resetPageDim, setPageDim } from "../.test-dist/platform/PageBackdrop.js";

const source = async (path) => readFile(new URL(path, import.meta.url), "utf8");
const section = (text, start, end) => {
  const first = text.indexOf(start);
  const last = text.indexOf(end, first + start.length);
  assert.ok(first >= 0 && last > first, `Expected method boundaries: ${start} ... ${end}`);
  return text.slice(first, last);
};

test("outer page dim writes and resets CSS variables without swallowing invalid input", () => {
  const previousDocument = globalThis.document;
  const properties = new Map();
  globalThis.document = {
    documentElement: {
      style: { setProperty(name, value) { properties.set(name, value); } },
    },
  };
  try {
    setPageDim(0.72, 0);
    assert.equal(properties.get("--page-dim-opacity"), "0.72");
    assert.equal(properties.get("--page-dim-transition"), "0ms");
    resetPageDim();
    assert.equal(properties.get("--page-dim-opacity"), "0");
    assert.throws(() => setPageDim(1.01, 0), RangeError);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test("main menu settings open, close, scene shutdown and language change own page dim", async () => {
  const src = await source("../src/game/MainMenuScene.ts");
  const open = section(src, "private openAudioSettings(): void", "private closeAudioSettings(): void");
  const close = section(src, "private closeAudioSettings(): void", "private async selectLocale(");
  const select = src.slice(src.indexOf("private async selectLocale("));
  assert.match(open, /if \(this\.audioSettingsOverlay !== null\) return;/);
  assert.match(open, /this\.audioSettingsOverlay = this\.add\.container[\s\S]*?setPageDim\(VISUAL_COLORS\.overlay\.modal\.alpha, 0\);/);
  assert.match(open, /onActivate: \(\) => this\.closeAudioSettings\(\)/);
  assert.match(close, /if \(this\.audioSettingsOverlay === null\) return;/);
  assert.match(close, /this\.audioSettingsOverlay\.destroy\(true\);[\s\S]*?resetPageDim\(\);/);
  assert.match(src, /this\.events\.once\(Phaser\.Scenes\.Events\.SHUTDOWN, \(\) => \{\s*this\.closeAudioSettings\(\);/);
  assert.match(select, /this\.closeAudioSettings\(\);\s*this\.scene\.restart\(\);/);
  assert.doesNotMatch(src, /searchParams\.get\("debug"\)|history\.replaceState/);
});

test("rewarded hint dialog dims entire page and resets on cancel, ad, background and shutdown", async () => {
  const src = await source("../src/game/PlayScene.ts");
  const show = section(src, "private showHintDialog(unavailable: boolean): void", "private dismissHintModal(): void");
  const dismiss = section(src, "private dismissHintModal(): void", "private requestRewardedHint(): void");
  const request = section(src, "private requestRewardedHint(): void", "private completeHintReward(");
  const reward = section(src, "private completeHintReward(", "private flushDeferredHintReward(");
  const background = section(src, "private handleBrowserBackground(): void", "private handleBrowserForeground(): void");
  const shutdown = section(src, "private readonly handleSceneShutdown", "constructor(");
  assert.match(show, /this\.dismissHintModal\(\);/);
  assert.match(show, /this\.hintModal = this\.add\.container[\s\S]*?setPageDim\(VISUAL_COLORS\.overlay\.modal\.alpha, 0\);/);
  assert.match(dismiss, /if \(this\.hintModal === null\) return;/);
  assert.match(dismiss, /this\.hintModal\.destroy\(true\);[\s\S]*?resetPageDim\(\);/);
  assert.match(show, /onActivate: \(\) => this\.dismissHintModal\(\)/);
  assert.match(request, /this\.dismissHintModal\(\);\s*const token/);
  assert.match(reward, /else this\.showHintDialog\(true\);/);
  assert.match(background, /this\.browserPauseRequired = true;\s*this\.dismissHintModal\(\)/);
  assert.match(shutdown, /this\.dismissHintModal\(\)/);
});

test("pause and completion retain independent full-page dim ownership", async () => {
  const src = await source("../src/game/PlayScene.ts");
  assert.match(src, /private syncPausePageDim\(overlayAlpha: number\): void \{\s*setPageDim\(VISUAL_COLORS\.overlay\.modal\.alpha \* overlayAlpha, 0\);/);
  assert.match(src, /private showComplete\(\): void \{[\s\S]*?setPageDim\(VISUAL_COLORS\.overlay\.modal\.alpha, 0\);/);
  const modal = await source("../src/game/UiPrimitives.ts");
  assert.doesNotMatch(section(modal, "export const createModalShell =", "};"), /setPageDim|resetPageDim/);
});
