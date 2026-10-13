import assert from "node:assert/strict";
import test from "node:test";
import { attachBrowserAudioLifecycle } from "../.test-dist/audio/BrowserAudioLifecycle.js";

const eventTarget = () => {
  const handlers = new Map();
  return {
    addEventListener(name, cb) { const items = handlers.get(name) ?? new Set(); items.add(cb); handlers.set(name, items); },
    removeEventListener(name, cb) { handlers.get(name)?.delete(cb); },
    dispatch(name) { for (const cb of handlers.get(name) ?? []) cb(); },
    count(name) { return handlers.get(name)?.size ?? 0; },
  };
};

test("first tap invokes unlock on down and music retry on same tap release", () => {
  const win = eventTarget(); const doc = Object.assign(eventTarget(), { hidden: false });
  const calls = [];
  const manager = {
    setPageVisible: (v) => calls.push(["visible", v]),
    unlock: () => calls.push(["unlock"]),
    retryPlaybackFromGesture: () => calls.push(["retry"]),
  };
  const detach = attachBrowserAudioLifecycle(manager, win, doc);
  win.dispatch("pointerdown");
  win.dispatch("pointerup");
  assert.equal(calls.filter(([event]) => event === "unlock").length, 1);
  assert.equal(calls.filter(([event]) => event === "retry").length, 1);
  detach();
  assert.equal(win.count("pointerup"), 0);
});

test("hidden or blurred page never retries playback from pointerup", () => {
  const win = eventTarget(); const doc = Object.assign(eventTarget(), { hidden: false });
  const calls = [];
  const manager = {
    setPageVisible: (v) => calls.push(["visible", v]),
    unlock: () => calls.push(["unlock"]),
    retryPlaybackFromGesture: () => calls.push(["retry"]),
  };
  attachBrowserAudioLifecycle(manager, win, doc);
  win.dispatch("blur");
  win.dispatch("pointerup");
  doc.hidden = true;
  doc.dispatch("visibilitychange");
  win.dispatch("pointerdown");
  win.dispatch("pointerup");
  assert.equal(calls.filter(([event]) => event === "retry").length, 0);
  assert.equal(calls.filter(([event]) => event === "unlock").length, 0);
  assert.deepEqual(calls.at(-1), ["visible", false]);
});
