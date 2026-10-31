import assert from "node:assert/strict";
import test from "node:test";

import { getChapterLevelRange, getDefaultChapter, getLevelState, getPrimaryMenuAction, isLevelSelectable } from "../.test-dist/game/CampaignNavigation.js";
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

test("campaign navigation derives menu actions and all level states", () => {
  const progress = (completedThroughLevel) => ({ version: 1, completedThroughLevel });
  assert.deepEqual(getPrimaryMenuAction(progress(0)), { label: "Play", levelNumber: 1 });
  assert.equal(getLevelState(progress(0), 1), "available");
  assert.equal(getLevelState(progress(0), 2), "locked");
  assert.deepEqual(getPrimaryMenuAction(progress(20)), { label: "Continue", levelNumber: 21 });
  for (let level = 1; level <= 20; level += 1) assert.equal(getLevelState(progress(20), level), "completed");
  assert.equal(getLevelState(progress(20), 21), "available");
  assert.equal(getLevelState(progress(20), 22), "locked");
  assert.deepEqual(getPrimaryMenuAction(progress(99)), { label: "Continue", levelNumber: 100 });
  assert.deepEqual(getPrimaryMenuAction(progress(100)), { label: "Play again", levelNumber: 1 });
  for (let level = 1; level <= 100; level += 1) {
    assert.equal(getLevelState(progress(100), level), "completed");
    assert.equal(isLevelSelectable(progress(100), level), true);
  }
});

test("chapter ranges and frontier chapters are exact", () => {
  const progress = (completedThroughLevel) => ({ version: 1, completedThroughLevel });
  assert.deepEqual(getChapterLevelRange(1), [1, 10]);
  assert.deepEqual(getChapterLevelRange(2), [11, 20]);
  assert.deepEqual(getChapterLevelRange(10), [91, 100]);
  for (const invalid of [0, 11, 1.5]) assert.throws(() => getChapterLevelRange(invalid), RangeError);
  for (const [completed, chapter] of [[0, 1], [9, 1], [10, 2], [20, 3], [99, 10], [100, 10]]) {
    assert.equal(getDefaultChapter(progress(completed)), chapter);
  }
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

