import assert from "node:assert/strict";
import test from "node:test";
import { WebLocaleStore, resolveStartupLocale, UI_LOCALE_STORAGE_KEY } from "../.test-dist/platform/WebLocaleStore.js";
import { UI_STRINGS } from "../.test-dist/game/Localization.js";

test("language preferences persist independently of audio and progress", () => {
  const map = new Map();
  const storage = {getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v)};
  const store = new WebLocaleStore(() => storage);
  assert.equal(store.load(), null);
  assert.equal(store.save("en"), true);
  assert.equal(store.load(), "en");
  assert.equal(map.get(UI_LOCALE_STORAGE_KEY), "en");
  assert.equal(resolveStartupLocale("",store.load()), "en");
  assert.equal(resolveStartupLocale("?debug=1&locale=ru",store.load()), "ru");
  assert.equal(resolveStartupLocale("?locale=ru",store.load()), "en");
  assert.equal(resolveStartupLocale("",null), "ru");
  assert.equal(resolveStartupLocale("",null,"en"), "en");
  assert.equal(resolveStartupLocale("",null,"ru-RU"), "ru");
  assert.equal(resolveStartupLocale("",null,"tr"), "en");
  assert.equal(resolveStartupLocale("", "ru", "en"), "ru");
  assert.equal(resolveStartupLocale("?debug=1&locale=en", "ru", "ru"), "en");
});
test("storage failures do not cause a false persisted locale", () => {
  const store = new WebLocaleStore(() => ({getItem(){throw Error("denied");},setItem(){throw Error("denied");}}));
  assert.equal(store.load(), null);
  assert.equal(store.save("en"), false);
});
test("settings modal localization contains RU/EN labels", () => {
  assert.equal(UI_STRINGS.ru.settingsTitle,"Настройки");
  assert.equal(UI_STRINGS.en.settingsTitle,"Settings");
  assert.equal(UI_STRINGS.ru.settingsLanguage,"Язык");
  assert.equal(UI_STRINGS.en.settingsLanguage,"Language");
});
