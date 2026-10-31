import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const play = () => readFile(new URL("../src/game/PlayScene.ts", import.meta.url), "utf8");

test("unrelated valid move keeps the paid hint and does not unlock another ad", async () => {
  const src = await play();
  const move = src.slice(src.indexOf("private completeMove(move:"), src.indexOf("private animateRoute("));
  assert.match(move, /this\.hintedPoints !== null && \[move\.start, move\.end\]\.some/);
  assert.match(move, /samePoint\(point, hinted\)/);
  assert.doesNotMatch(move, /this\.inputLocked = true;\s*this\.clearHintFeedback\(\)/);
  assert.match(src, /this\.hintActive\) return;/);
});

test("background closes hint dialog and defers rewarded callbacks until Continue", async () => {
  const src = await play();
  assert.match(src, /this\.browserPauseRequired = true;\s*this\.dismissHintModal\(\)/);
  assert.match(src, /if \(this\.browserPauseRequired \|\| this\.sdkPaused\) \{\s*this\.hintRewardDeferred = granted;/);
  assert.match(src, /private flushDeferredHintReward\(\): void/);
  assert.match(src, /this\.pauseOverlay !== null \|\| this\.pauseClosing/);
  assert.match(src, /this\.inputLockedBeforeBrowserPause = false;\s*this\.flushDeferredHintReward\(\)/);
});

test("new stage and scene shutdown invalidate pending ad and deferred reward", async () => {
  const src = await play();
  const stage = src.slice(src.indexOf("private loadStage("), src.indexOf("private clearInitialStageSettle("));
  assert.match(stage, /this\.hintRequestToken\+\+/);
  assert.match(stage, /this\.hintRewardDeferred = null/);
  const shutdown = src.slice(src.indexOf("private readonly handleSceneShutdown"),src.indexOf("constructor("));
  assert.match(shutdown, /this\.hintRequestToken\+\+/);
  assert.match(shutdown, /this\.hintRewardDeferred = null/);
});
