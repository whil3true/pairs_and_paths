import assert from "node:assert/strict";
import test from "node:test";
import { isGameplayActive } from "../.test-dist/game/GameplayStatePolicy.js";
test("GameplayAPI is active only during playable board", () => {
  const s = { sceneActive:true, uiReady:true, presentation:"gameplay",
    sdkPaused:false, browserPaused:false, manualPauseOpen:false };
  assert.equal(isGameplayActive(s),true);
  for(const delta of [{sceneActive:false},{uiReady:false},{presentation:"loading"},
    {presentation:"reward"},{presentation:"complete"},{sdkPaused:true},
    {browserPaused:true},{manualPauseOpen:true}])
    assert.equal(isGameplayActive({...s,...delta}),false);
});

import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";

test("initial GameplayAPI state is synchronized on first RUNNING frame, not only create()", async () => {
  const source = await readFile(new URL("../src/game/PlayScene.ts", import.meta.url), "utf8");
  assert.match(source, /this\.events\.once\(Phaser\.Scenes\.Events\.UPDATE, this\.handleFirstRunningFrame\)/);
  assert.match(source, /this\.events\.off\(Phaser\.Scenes\.Events\.UPDATE, this\.handleFirstRunningFrame\)/);
  const emitter = new EventEmitter();
  const calls = [];
  let active = false;
  const platform = {
    setGameplayActive(state) { if (calls.at(-1) !== state) calls.push(state); },
  };
  const sync = () => platform.setGameplayActive(isGameplayActive({
    sceneActive: active, uiReady: true, presentation: "gameplay",
    sdkPaused: false, browserPaused: false, manualPauseOpen: false,
  }));
  sync();
  emitter.once("update", sync);
  active = true;
  emitter.emit("update");
  emitter.emit("update");
  assert.deepEqual(calls, [false, true], "first running frame starts once");
});
