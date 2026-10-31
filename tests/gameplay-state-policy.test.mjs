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
