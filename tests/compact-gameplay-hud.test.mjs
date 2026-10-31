import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const hudRoot = new URL("../public/assets/ui/compact-hud-v1/", import.meta.url);
const assets = [
  ["ui-button-base.png", 128, 128],
  ["ui-stage-pill-base.png", 224, 88],
  ["ui-stage-dot-active.png", 32, 32],
  ["ui-stage-dot-inactive.png", 32, 32],
];

test("compact gameplay HUD ships the four loaded production PNGs at their approved paths and dimensions", async () => {
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


test("multi-stage HUD uses equal 104x56 chips with six-pixel gaps", async () => {
  const { GAMEPLAY_HUD, getGameplayHudLayout } =
    await import("../.test-dist/game/GameplayHudPolicy.js");
  const layout = getGameplayHudLayout(3);
  assert.deepEqual(
    [layout.pause, layout.level, layout.stage, layout.remaining, layout.hint]
      .map(({ left, top, width, height }) => [left, top, width, height]),
    [
      [24, 20, 48, 48],
      [78, 16, 104, 56],
      [188, 16, 104, 56],
      [298, 16, 104, 56],
      [408, 20, 48, 48],
    ],
  );
  for (const chip of [layout.level, layout.stage, layout.remaining]) {
    assert.equal(chip.width, 104);
    assert.equal(chip.height, 56);
    assert.equal(chip.centerY, 44);
  }
  const elements = [layout.pause, layout.level, layout.stage, layout.remaining, layout.hint];
  for (let index = 1; index < elements.length; index += 1) {
    const previous = elements[index - 1];
    const current = elements[index];
    assert.equal(current.left - (previous.left + previous.width), 6);
  }
  assert.equal(layout.pause.left, 24);
  assert.equal(480 - (layout.hint.left + layout.hint.width), 24);
  assert.equal(GAMEPLAY_HUD.buttonSize, 48);
});

test("single-stage HUD closes the hidden stage slot symmetrically", async () => {
  const { getGameplayHudLayout, shouldShowStageIndicator } =
    await import("../.test-dist/game/GameplayHudPolicy.js");
  const layout = getGameplayHudLayout(1);
  assert.equal(shouldShowStageIndicator(1), false);
  assert.equal(shouldShowStageIndicator(3), true);
  assert.deepEqual(
    [layout.level, layout.remaining].map(({ left, top, width, height }) => [left, top, width, height]),
    [[115, 16, 104, 56], [261, 16, 104, 56]],
  );
  assert.equal(240 - layout.level.centerX, layout.remaining.centerX - 240);
  assert.deepEqual(
    [layout.pause.left, layout.pause.top, layout.hint.left, layout.hint.top],
    [24, 20, 408, 20],
  );
});

test("all three chips share the stage-pill texture and NineSlice configuration", async () => {
  const { GAMEPLAY_HUD } = await import("../.test-dist/game/GameplayHudPolicy.js");
  assert.equal(GAMEPLAY_HUD.stageNineSlice.objectWidth * GAMEPLAY_HUD.stageNineSlice.scale, 104);
  assert.equal(GAMEPLAY_HUD.stageNineSlice.objectHeight * GAMEPLAY_HUD.stageNineSlice.scale, 56);
  assert.deepEqual(
    [
      GAMEPLAY_HUD.stageNineSlice.sourceWidth,
      GAMEPLAY_HUD.stageNineSlice.sourceHeight,
      GAMEPLAY_HUD.stageNineSlice.leftWidth,
      GAMEPLAY_HUD.stageNineSlice.rightWidth,
      GAMEPLAY_HUD.stageNineSlice.topHeight,
      GAMEPLAY_HUD.stageNineSlice.bottomHeight,
    ],
    [224, 88, 44, 44, 32, 32],
  );

  const source = await readFile(new URL("../src/game/CompactGameplayHud.ts", import.meta.url), "utf8");
  const calls = [...source.matchAll(/createNineSlice\(scene, ([^,]+), ([^)]+)\)/g)]
    .map(([, texture, policy]) => [texture, policy]);
  assert.deepEqual(calls, [
    ["COMPACT_HUD_ASSETS.stagePill.key", "GAMEPLAY_HUD.stageNineSlice"],
    ["COMPACT_HUD_ASSETS.stagePill.key", "GAMEPLAY_HUD.stageNineSlice"],
  ]);
  assert.equal(source.includes("COMPACT_HUD_ASSETS.statChip"), false);
});

test("HUD content offsets retain safe vertical padding at render scales 1 and 2", async () => {
  const { GAMEPLAY_HUD } = await import("../.test-dist/game/GameplayHudPolicy.js");
  for (const renderScale of [1, 2]) {
    assert.ok(renderScale === 1 || renderScale === 2);
    const statTopPadding = 28 + GAMEPLAY_HUD.statLabelY - 10 / 2;
    const statBottomPadding = 28 - GAMEPLAY_HUD.statValueY - 16 / 2;
    const stageTopPadding = 28 + GAMEPLAY_HUD.stageLabelY - 11 / 2;
    const stageBottomPadding = 28 - GAMEPLAY_HUD.stageDotsY - GAMEPLAY_HUD.stageDotSize / 2;
    const labelToDotsGap = GAMEPLAY_HUD.stageDotsY - GAMEPLAY_HUD.stageDotSize / 2
      - (GAMEPLAY_HUD.stageLabelY + 11 / 2);
    assert.ok(statTopPadding >= 12);
    assert.ok(statBottomPadding >= 12);
    assert.ok(stageTopPadding >= 12);
    assert.ok(stageBottomPadding >= 12);
    assert.ok(labelToDotsGap >= 6);
  }
});

test("RU and EN HUD strings cover boundary levels, pair counts and all three stages", async () => {
  const { getUiStrings } = await import("../.test-dist/game/Localization.js");
  for (const locale of ["ru", "en"]) {
    const strings = getUiStrings(locale);
    assert.ok(strings.gameplayLevelCaption.length > 0);
    assert.ok(strings.gameplayRemainingCaption.length > 0);
    for (const level of [1, 100]) assert.ok(String(level).length <= 3);
    for (const count of [1, 4, 15, 22]) {
      assert.match(strings.gameplayPairCount(count), new RegExp(`^${count} `));
    }
    for (const stage of [1, 2, 3]) {
      assert.match(strings.stageLabel(stage, 3), new RegExp(`${stage}/3$`));
    }
  }
});
