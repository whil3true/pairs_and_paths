import assert from "node:assert/strict";
import test from "node:test";
import { AudioManager } from "../.test-dist/audio/AudioManager.js";
import { AUDIO_EFFECTS, AUDIO_EFFECT_GAIN, AUDIO_MUSIC } from "../.test-dist/audio/AudioAssetManifest.js";
import { createAudioSettings } from "../.test-dist/audio/AudioSettings.js";

const setup = () => {
  let now = 1000;
  const calls = [];
  const ended = [];
  const output = {
    playEffect: (...args) => calls.push(["effect", ...args]),
    startMusic: (path, volume, onEnded) => { calls.push(["music", path, volume]); ended.push(onEnded); },
    setMusicVolume: (v) => calls.push(["volume", v]),
    pauseMusic: () => calls.push(["pause"]),
    resumeMusic: () => calls.push(["resume"]),
    stopMusic: () => calls.push(["stop"]),
  };
  const saved = [];
  const repo = { load: () => createAudioSettings(0.4, 0.65), save: (s) => saved.push(s) };
  const manager = new AudioManager(output, repo, () => now);
  return { manager, calls, saved, ended, advance: (delta) => { now += delta; } };
};

test("manifest contains exactly user-approved sounds and two lazy-loaded tracks", () => {
  assert.deepEqual(Object.keys(AUDIO_EFFECTS).sort(), [
    "levelComplete", "pairInvalid", "pairSuccess", "tileFirst", "tileSecond", "uiClick",
  ]);
  assert.deepEqual(Object.values(AUDIO_EFFECTS).map((p) => p.split("/").at(-1)), [
    "click_003.ogg", "drop_003.ogg", "drop_002.ogg", "drop_004.ogg", "bong_001.ogg", "jingles_PIZZI10.ogg",
  ]);
  assert.deepEqual(AUDIO_MUSIC.map((p) => p.path.split("/").at(-1)), [
    "forget_me_not_in_f_major_looped.ogg", "porcelain_hours.mp3",
  ]);
});

test("no autoplay before gesture, one music track at a time, sequential playback", () => {
  const s = setup();
  assert.deepEqual(s.calls, []);
  s.manager.playEffect("uiClick");
  assert.deepEqual(s.calls, []);
  s.manager.unlock();
  assert.deepEqual(s.calls, [["music", AUDIO_MUSIC[0].path, 0.4]]);
  s.ended[0]();
  assert.deepEqual(s.calls.at(-1), ["music", AUDIO_MUSIC[1].path, 0.4]);
  s.ended[0](); // stale callback cannot restart track 0
  assert.equal(s.calls.filter((x) => x[0] === "music").length, 2);
  s.ended[1]();
  assert.deepEqual(s.calls.at(-1), ["music", AUDIO_MUSIC[0].path, 0.4]);
});

test("zero volume, independent controls and persistence work without restarting the track", () => {
  const s = setup(); s.manager.unlock();
  s.manager.setSfxVolume(0);
  s.manager.playEffect("tileFirst");
  assert.equal(s.calls.some((x) => x[0] === "effect"), false);
  s.manager.setMusicVolume(0);
  assert.deepEqual(s.calls.at(-1), ["pause"]);
  s.manager.setMusicVolume(0.75);
  assert.deepEqual(s.calls.slice(-2), [["volume", 0.75], ["resume"]]);
  assert.equal(s.calls.filter((x) => x[0] === "music").length, 1);
  assert.deepEqual(s.manager.getSettings(), { version: 1, musicVolume: 0.75, sfxVolume: 0 });
  assert.equal(s.saved.length, 3);
});

test("visibility and ad suspension prevent both music and effects, and never double-resume", () => {
  const s = setup(); s.manager.unlock();
  s.manager.setPageVisible(false);
  assert.deepEqual(s.calls.at(-1), ["pause"]);
  s.manager.playEffect("uiClick");
  assert.equal(s.calls.some((x) => x[0] === "effect"), false);
  s.manager.setAdActive(true);
  s.manager.setPageVisible(true);
  assert.equal(s.calls.some((x) => x[0] === "resume"), false);
  s.manager.setAdActive(false);
  assert.deepEqual(s.calls.at(-1), ["resume"]);
  s.manager.setPageVisible(true);
  assert.equal(s.calls.filter((x) => x[0] === "resume").length, 1);
});

test("throttling is local per event, respects effective gain, and does not block other events", () => {
  const s = setup(); s.manager.unlock();
  s.manager.playEffect("tileFirst");
  s.manager.playEffect("tileFirst");
  s.manager.playEffect("pairSuccess");
  const effects = s.calls.filter((x) => x[0] === "effect");
  assert.equal(effects.length, 2);
  assert.deepEqual(effects[0], ["effect", AUDIO_EFFECTS.tileFirst, 0.65 * AUDIO_EFFECT_GAIN.tileFirst]);
  s.advance(50);
  s.manager.playEffect("tileFirst");
  assert.equal(s.calls.filter((x) => x[0] === "effect").length, 3);
});

test("muted start defers playback; dispose invalidates old completion callbacks", () => {
  let now = 1000;
  const calls = []; const ended = [];
  const repo = { load: () => createAudioSettings(0, 0), save: () => {} };
  const output = {
    playEffect: () => calls.push("effect"),
    startMusic: (_path, _volume, cb) => { calls.push("music"); ended.push(cb); },
    setMusicVolume: () => {}, pauseMusic: () => calls.push("pause"),
    resumeMusic: () => calls.push("resume"), stopMusic: () => calls.push("stop"),
  };
  const manager = new AudioManager(output, repo, () => now);
  manager.unlock();
  assert.deepEqual(calls, []);
  manager.setMusicVolume(0.5);
  assert.deepEqual(calls, ["music"]);
  manager.dispose();
  assert.deepEqual(calls, ["music", "stop"]);
  ended[0]();
  assert.deepEqual(calls, ["music", "stop"]);
  manager.unlock();
  assert.deepEqual(calls, ["music", "stop"]);
});

test("fresh gesture retries music without changing track or restarting after stale blur", () => {
  const s = setup();
  s.manager.unlock();
  s.manager.retryPlaybackFromGesture();
  assert.deepEqual(s.calls.at(-1), ["resume"]);
  assert.equal(s.calls.filter((x) => x[0] === "music").length, 1);
  s.manager.setPageVisible(false);
  s.manager.retryPlaybackFromGesture();
  assert.equal(s.calls.filter((x) => x[0] === "resume").length, 1);
  s.manager.setPageVisible(true);
  assert.equal(s.calls.filter((x) => x[0] === "resume").length, 2);
});
