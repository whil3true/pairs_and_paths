import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const hudRoot = new URL("../public/assets/ui/compact-hud-v1/", import.meta.url);
const assets = [
  ["ui-button-base.png", 128, 128],
  ["ui-stat-chip-base.png", 256, 112],
  ["ui-stage-pill-base.png", 224, 88],
  ["ui-stage-dot-active.png", 32, 32],
  ["ui-stage-dot-inactive.png", 32, 32],
];

test("compact gameplay HUD ships the five production PNGs at their approved paths and dimensions", async () => {
  for (const [name, expectedWidth, expectedHeight] of assets) {
    const url = new URL(name, hudRoot);
    assert.ok((await stat(url)).size > 0, `${name} must not be empty`);
    const bytes = await readFile(url);
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(bytes.toString("ascii", 12, 16), "IHDR");
    assert.equal(bytes.readUInt32BE(16), expectedWidth);
    assert.equal(bytes.readUInt32BE(20), expectedHeight);
  }
});

test("counter refreshes do not queue or create HUD textures", async () => {
  const source = await readFile(new URL("../src/game/CompactGameplayHud.ts", import.meta.url), "utf8");
  const updateBody = source.slice(source.indexOf("  update("), source.indexOf("  setVisible("));
  assert.doesNotMatch(updateBody, /load\.image|textures\.add|generateTexture|createCanvas/);
  assert.match(source, /if \(!scene\.textures\.exists\(asset\.key\)\) scene\.load\.image/);
});

test("PlayScene routes Pause, Hint and presentation visibility through one compact HUD", async () => {
  const source = await readFile(new URL("../src/game/PlayScene.ts", import.meta.url), "utf8");
  assert.match(source, /new CompactGameplayHud\([\s\S]*\(\) => this\.showPause\(\)[\s\S]*\(\) => this\.showHint\(\)/);
  assert.match(source, /private updateRemaining\(\): void \{\s*this\.gameplayHud\.setRemainingPairs/);
  assert.match(source, /private setGameplayHudVisible\(visible: boolean\): void \{\s*this\.gameplayHud\.setVisible\(visible\)/);
  assert.ok((source.match(/this\.setGameplayHudVisible\(false\)/g) ?? []).length >= 2,
    "Reward and Complete presentations must both hide the HUD");
});
