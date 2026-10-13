import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_AUDIO_SETTINGS, createAudioSettings, parseAudioSettings, serializeAudioSettings,
} from "../.test-dist/audio/AudioSettings.js";
import { AUDIO_SETTINGS_STORAGE_KEY, WebAudioSettingsStore } from "../.test-dist/platform/WebAudioSettingsStore.js";
import { CAMPAIGN_PROGRESS_STORAGE_KEY } from "../.test-dist/platform/WebProgressStore.js";

const makeStorage = () => {
  const entries = new Map();
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
  };
};

test("audio defaults are versioned, quiet, and independent of campaign progress", () => {
  assert.deepEqual(DEFAULT_AUDIO_SETTINGS, { version: 1, musicVolume: 0.4, sfxVolume: 0.65 });
  assert.notEqual(AUDIO_SETTINGS_STORAGE_KEY, CAMPAIGN_PROGRESS_STORAGE_KEY);
  assert.equal(new WebAudioSettingsStore(() => makeStorage()).load().musicVolume, 0.4);
});

test("audio settings preserve zero volume and clamp only numeric out-of-range values", () => {
  assert.deepEqual(createAudioSettings(-2, 1.5), { version: 1, musicVolume: 0, sfxVolume: 1 });
  assert.deepEqual(createAudioSettings(0, 0), { version: 1, musicVolume: 0, sfxVolume: 0 });
  assert.deepEqual(createAudioSettings(NaN, Infinity), DEFAULT_AUDIO_SETTINGS);
  assert.deepEqual(parseAudioSettings(serializeAudioSettings(createAudioSettings(0.25, 0))), {
    version: 1, musicVolume: 0.25, sfxVolume: 0,
  });
});

test("audio settings reject malformed, incompatible and non-numeric storage without throwing", () => {
  for (const raw of [
    "", "not-json", "null", "[]", "42", "true", "{}",
    '{"version":2,"musicVolume":0.1,"sfxVolume":0.1}',
    '{"version":1,"musicVolume":"0.5","sfxVolume":0.7}',
    '{"version":1,"musicVolume":0.2,"sfxVolume":null}',
  ]) assert.deepEqual(parseAudioSettings(raw), DEFAULT_AUDIO_SETTINGS, raw);
  assert.deepEqual(parseAudioSettings('{"version":1,"musicVolume":50,"sfxVolume":-2}'), {
    version: 1, musicVolume: 1, sfxVolume: 0,
  });
});

test("audio settings roundtrip without mutating saved campaign progress", () => {
  const storage = makeStorage();
  storage.setItem(CAMPAIGN_PROGRESS_STORAGE_KEY, "do not modify");
  const store = new WebAudioSettingsStore(() => storage);
  store.save(createAudioSettings(0, 0.75));
  assert.deepEqual(store.load(), { version: 1, musicVolume: 0, sfxVolume: 0.75 });
  assert.equal(storage.getItem(CAMPAIGN_PROGRESS_STORAGE_KEY), "do not modify");
});

test("audio settings remain usable with blocked read/write browser storage", () => {
  const store = new WebAudioSettingsStore(() => ({
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  }));
  assert.deepEqual(store.load(), DEFAULT_AUDIO_SETTINGS);
  assert.doesNotThrow(() => store.save(createAudioSettings(0.2, 0.8)));
  const unavailable = new WebAudioSettingsStore(() => { throw new Error("storage denied"); });
  assert.deepEqual(unavailable.load(), DEFAULT_AUDIO_SETTINGS);
  assert.doesNotThrow(() => unavailable.save(createAudioSettings(0, 0)));
});
