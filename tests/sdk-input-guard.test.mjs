import assert from "node:assert/strict";
import test from "node:test";
import { SdkInputGuard } from "../.test-dist/platform/SdkInputGuard.js";

const setup = (paused = false) => {
  let isPaused = paused;
  const onPause = new Set(), onResume = new Set();
  const platform = {
    isPaused, onPause(fn) { onPause.add(fn); if (isPaused) fn(); return () => onPause.delete(fn); },
    onResume(fn) { onResume.add(fn); return () => onResume.delete(fn); },
  };
  const menu = { key: "MainMenuScene", input: { enabled: true } };
  const play = { key: "PlayScene", input: { enabled: true } };
  const scenes = [menu, play];
  const guard = new SdkInputGuard(platform, () => scenes);
  const emit = (next) => {
    isPaused = next;
    for (const fn of next ? onPause : onResume) fn();
  };
  return { guard, menu, play, scenes, emit, onPause, onResume };
};
test("SDK pause disables all non-gameplay screens, never touching PlayScene", () => {
  const { guard, menu, play, scenes, emit } = setup();
  emit(true);
  assert.equal(menu.input.enabled, false);
  assert.equal(play.input.enabled, true);
  const gallery = { key: "ArtworkGalleryScene", input: { enabled: true } };
  scenes.push(gallery);
  guard.sync();
  assert.equal(gallery.input.enabled, false);
  emit(false);
  assert.equal(menu.input.enabled, true);
  assert.equal(gallery.input.enabled, true);
  guard.dispose();
});
test("pre-existing disabled input is restored, pause from startup and cleanup are safe", () => {
  const { guard, menu, play, emit, onPause, onResume } = setup(true);
  assert.equal(menu.input.enabled, false);
  assert.equal(play.input.enabled, true);
  emit(false);
  menu.input.enabled = false;
  emit(true);
  emit(false);
  assert.equal(menu.input.enabled, false);
  guard.dispose();
  assert.equal(onPause.size, 0);
  assert.equal(onResume.size, 0);
});
