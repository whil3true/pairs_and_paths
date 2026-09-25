import assert from "node:assert/strict";
import test from "node:test";
import { WebPlatform, normalizeLocale } from "../.test-dist/platform/WebPlatform.js";

test("normalizes browser locale separators", () => {
  assert.equal(normalizeLocale("ru_RU"), "ru-RU");
  assert.equal(normalizeLocale(undefined), "en");
});

test("web platform exposes the bootstrap identity", () => {
  const platform = new WebPlatform("en-GB");
  assert.deepEqual(
    { id: platform.id, name: platform.displayName, locale: platform.locale },
    { id: "web", name: "Web", locale: "en-GB" },
  );
});
