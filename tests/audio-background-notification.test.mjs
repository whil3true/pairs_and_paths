import assert from "node:assert/strict";
import test from "node:test";
import { HtmlAudioOutput } from "../.test-dist/audio/HtmlAudioOutput.js";
import { AudioManager } from "../.test-dist/audio/AudioManager.js";
import { createAudioSettings } from "../.test-dist/audio/AudioSettings.js";

const createBrowser = () => {
  const instances = [];
  const mediaSession = { playbackState: "none", metadata: null };
  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.currentTime = 0;
      this.paused = true;
      this.readyState = 1;
      this.listeners = new Map();
      this.playCount = 0;
      this.loadCount = 0;
      instances.push(this);
    }
    load() { this.loadCount++; }
    play() { this.playCount++; this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute(attribute) {
      if (attribute === "src") this.src = "";
    }
    addEventListener(type, cb) {
      this.listeners.set(type, [...(this.listeners.get(type) ?? []), cb]);
    }
    emit(type) { for (const cb of this.listeners.get(type) ?? []) cb(); }
  }
  const original = { Audio: globalThis.Audio, window: globalThis.window, navigator: globalThis.navigator };
  globalThis.Audio = FakeAudio;
  globalThis.window = {};
  Object.defineProperty(globalThis, "navigator", { value: { mediaSession }, configurable: true });
  return {
    instances, mediaSession,
    restore() {
      if (original.Audio === undefined) delete globalThis.Audio;
      else globalThis.Audio = original.Audio;
      if (original.window === undefined) delete globalThis.window;
      else globalThis.window = original.window;
      if (original.navigator === undefined) delete globalThis.navigator;
      else Object.defineProperty(globalThis, "navigator", { value: original.navigator, configurable: true });
    },
  };
};

test("backgrounding releases Android music source and resumes same track at saved position", () => {
  const browser = createBrowser();
  try {
    const output = new HtmlAudioOutput();
    const repo = { load: () => createAudioSettings(0.4, 0.65), save() {} };
    const manager = new AudioManager(output, repo);
    manager.unlock();
    const originalTrack = browser.instances.find((item) => item.src.includes("forget_me_not") && item.playCount > 0);
    assert.ok(originalTrack, "first track plays after initial gesture");
    originalTrack.currentTime = 32.25;
    browser.mediaSession.playbackState = "playing";
    browser.mediaSession.metadata = { title: "Previous track" };

    manager.setPageVisible(false);
    assert.equal(originalTrack.paused, true);
    assert.equal(originalTrack.src, "", "clearing src releases Android media notification");
    assert.ok(originalTrack.loadCount >= 2, "load() resets media element after teardown");
    assert.equal(browser.mediaSession.playbackState, "none");
    assert.equal(browser.mediaSession.metadata, null);

    originalTrack.emit("ended");
    manager.setPageVisible(true);
    const currentTrack = browser.instances.find((item) => item !== originalTrack && item.src.includes("forget_me_not"));
    assert.ok(currentTrack, "resume creates a fresh element instead of reviving detached media");
    assert.equal(currentTrack.currentTime, 32.25);
    assert.equal(currentTrack.playCount, 1);
    assert.equal(originalTrack.playCount, 1);
  } finally {
    browser.restore();
  }
});

test("muting and advertising release the media source without losing playback position", () => {
  const browser = createBrowser();
  try {
    const output = new HtmlAudioOutput();
    const repo = { load: () => createAudioSettings(0.4, 0.65), save() {} };
    const manager = new AudioManager(output, repo);
    manager.unlock();
    const first = browser.instances.find((item) => item.src.includes("forget_me_not") && item.playCount > 0);
    first.currentTime = 17;
    manager.setAdActive(true);
    assert.equal(first.src, "");
    manager.setPageVisible(false);
    manager.setAdActive(false);
    assert.equal(browser.instances.filter((item) => item.src.includes("forget_me_not") && item.playCount > 0).length, 0);
    manager.setPageVisible(true);
    const resumed = browser.instances.find((item) => item !== first && item.src.includes("forget_me_not"));
    assert.equal(resumed.currentTime, 17);
    resumed.currentTime = 51;
    manager.setMusicVolume(0);
    assert.equal(resumed.src, "");
    manager.setMusicVolume(0.3);
    const afterMute = browser.instances.find((item) => item !== resumed && item !== first && item.src.includes("forget_me_not"));
    assert.equal(afterMute.currentTime, 51);
    assert.equal(afterMute.volume, 0.3);
  } finally {
    browser.restore();
  }
});
