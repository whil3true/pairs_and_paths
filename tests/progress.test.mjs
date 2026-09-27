import assert from "node:assert/strict";
import test from "node:test";

import { resolveCampaignStartup } from "../.test-dist/game/CampaignStartup.js";
import { isProgressResetRequested } from "../.test-dist/game/DebugStart.js";
import {
  getHighestUnlockedLevel, getResumeLevel, initialCampaignProgress, isCampaignCompleted,
  parseCampaignProgress, recordLevelCompletion, recordStageCompletion, serializeCampaignProgress,
} from "../.test-dist/progress/CampaignProgress.js";
import {
  CAMPAIGN_PROGRESS_STORAGE_KEY, WebProgressStore,
} from "../.test-dist/platform/WebProgressStore.js";

test("initial and derived campaign progress values follow the linear campaign", () => {
  const initial = initialCampaignProgress();
  assert.deepEqual(initial, { version: 1, completedThroughLevel: 0 });
  assert.equal(getResumeLevel(initial), 1);
  assert.equal(getHighestUnlockedLevel(initial), 1);
  assert.equal(isCampaignCompleted(initial), false);

  const twenty = { version: 1, completedThroughLevel: 20 };
  assert.equal(getResumeLevel(twenty), 21);
  assert.equal(getHighestUnlockedLevel(twenty), 21);
  assert.equal(isCampaignCompleted(twenty), false);
  assert.equal(getResumeLevel({ version: 1, completedThroughLevel: 99 }), 100);

  const complete = { version: 1, completedThroughLevel: 100 };
  assert.equal(getResumeLevel(complete), 1);
  assert.equal(getHighestUnlockedLevel(complete), 100);
  assert.equal(isCampaignCompleted(complete), true);
});

test("level completion is monotonic", () => {
  const progress = (completedThroughLevel) => ({ version: 1, completedThroughLevel });
  assert.equal(recordLevelCompletion(progress(0), 1).completedThroughLevel, 1);
  assert.equal(recordLevelCompletion(progress(20), 21).completedThroughLevel, 21);
  assert.equal(recordLevelCompletion(progress(40), 20).completedThroughLevel, 40);
  assert.equal(recordLevelCompletion(progress(99), 100).completedThroughLevel, 100);
  assert.equal(recordLevelCompletion(progress(100), 20).completedThroughLevel, 100);
});

test("v1 progress parsing is strict and permits unknown extra properties", () => {
  const valid = { version: 1, completedThroughLevel: 37 };
  assert.deepEqual(parseCampaignProgress(serializeCampaignProgress(valid)), valid);
  assert.deepEqual(parseCampaignProgress('{"version":1,"completedThroughLevel":37,"future":true}'), valid);
  for (const invalid of [
    "not json", "null", "[]", '"save"', "{}", '{"version":2,"completedThroughLevel":20}',
    '{"version":1,"completedThroughLevel":-1}', '{"version":1,"completedThroughLevel":101}',
    '{"version":1,"completedThroughLevel":1.5}', '{"version":1,"completedThroughLevel":"20"}',
    '{"version":1}', '{"version":1,"completedThroughLevel":null}',
  ]) assert.deepEqual(parseCampaignProgress(invalid), initialCampaignProgress(), invalid);
});

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

test("web progress store loads, saves, clears, and falls back for corruption", () => {
  const storage = new MemoryStorage();
  const store = new WebProgressStore(() => storage);
  assert.deepEqual(store.load(), initialCampaignProgress());
  store.save({ version: 1, completedThroughLevel: 12 });
  assert.equal(storage.getItem(CAMPAIGN_PROGRESS_STORAGE_KEY),
    '{"version":1,"completedThroughLevel":12}');
  assert.deepEqual(store.load(), { version: 1, completedThroughLevel: 12 });
  storage.setItem(CAMPAIGN_PROGRESS_STORAGE_KEY, "corrupt");
  assert.deepEqual(store.load(), initialCampaignProgress());
  store.clear();
  assert.equal(storage.getItem(CAMPAIGN_PROGRESS_STORAGE_KEY), null);
});

test("web progress store contains unavailable and throwing storage", () => {
  const unavailable = new WebProgressStore(() => { throw new Error("blocked"); });
  assert.deepEqual(unavailable.load(), initialCampaignProgress());
  assert.doesNotThrow(() => unavailable.save(initialCampaignProgress()));
  assert.doesNotThrow(() => unavailable.clear());

  for (const method of ["getItem", "setItem", "removeItem"]) {
    const storage = new MemoryStorage();
    storage[method] = () => { throw new Error(method); };
    const store = new WebProgressStore(() => storage);
    if (method === "getItem") assert.deepEqual(store.load(), initialCampaignProgress());
    if (method === "setItem") assert.doesNotThrow(() => store.save(initialCampaignProgress()));
    if (method === "removeItem") assert.doesNotThrow(() => store.clear());
  }
});

test("campaign startup resumes normal progress but isolates debug campaign jumps", () => {
  const progress = (completedThroughLevel) => ({ version: 1, completedThroughLevel });
  assert.deepEqual(resolveCampaignStartup(progress(0), null), {
    position: { levelNumber: 1, stageIndex: 0 }, persistenceEnabled: true,
  });
  assert.equal(resolveCampaignStartup(progress(20), null).position.levelNumber, 21);
  assert.equal(resolveCampaignStartup(progress(99), null).position.levelNumber, 100);
  assert.equal(resolveCampaignStartup(progress(100), null).position.levelNumber, 1);
  assert.deepEqual(resolveCampaignStartup(progress(20), { levelNumber: 80, stageIndex: 1 }), {
    position: { levelNumber: 80, stageIndex: 1 }, persistenceEnabled: false,
  });
  assert.equal(resolveCampaignStartup(progress(20), null).persistenceEnabled, true);
});

test("only final stages cross the campaign persistence boundary", () => {
  const cases = [[21, 2], [30, 3], [100, 2]];
  for (const [level, stageCount] of cases) {
    let progress = { version: 1, completedThroughLevel: level - 1 };
    for (let stage = 0; stage < stageCount - 1; stage += 1) {
      const intermediate = recordStageCompletion(progress, level, stage, stageCount);
      assert.equal(intermediate.shouldSave, false);
      assert.strictEqual(intermediate.progress, progress);
    }
    const final = recordStageCompletion(progress, level, stageCount - 1, stageCount);
    assert.equal(final.shouldSave, true);
    assert.equal(final.progress.completedThroughLevel, level);
  }
});

test("developer progress reset requires debug=1", () => {
  assert.equal(isProgressResetRequested("?debug=1&resetProgress=1"), true);
  assert.equal(isProgressResetRequested("?debug=1&resetProgress=1&symbols=1"), true);
  for (const search of ["?resetProgress=1", "?debug=0&resetProgress=1", "?debug=1&resetProgress=0"]) {
    assert.equal(isProgressResetRequested(search), false);
  }
});
