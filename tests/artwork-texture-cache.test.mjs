import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FULL_ARTWORK_CACHE_LIMIT, FullArtworkTextureCache, shouldLoadFullArtwork,
} from "../.test-dist/game/ArtworkTextureCache.js";

class FakeTextureStore {
  textures = new Set();
  removed = [];

  exists(key) { return this.textures.has(key); }
  add(key) { this.textures.add(key); }
  remove(key) {
    this.removed.push(key);
    this.textures.delete(key);
  }
}

const visit = (cache, store, key) => {
  cache.retain(key, store);
  if (!store.exists(key)) store.add(key);
  cache.markLoaded(key, store);
  cache.release(key, store);
};

test("full artwork loading is requested only when the texture is absent", () => {
  const store = new FakeTextureStore();
  assert.equal(shouldLoadFullArtwork("level-001", store), true);
  store.add("level-001");
  assert.equal(shouldLoadFullArtwork("level-001", store), false);
});

test("full artwork cache prevents unbounded growth across a 100-level session", () => {
  const store = new FakeTextureStore();
  const cache = new FullArtworkTextureCache();
  for (let level = 1; level <= 100; level += 1) {
    visit(cache, store, `level-${level}`);
    assert.ok(store.textures.size <= FULL_ARTWORK_CACHE_LIMIT);
  }
  assert.deepEqual([...store.textures], ["level-98", "level-99", "level-100"]);
  assert.equal(store.removed.length, 97);
});

test("active artwork survives eviction until every scene lease is released", () => {
  const store = new FakeTextureStore();
  const cache = new FullArtworkTextureCache(2);
  cache.retain("shared", store);
  store.add("shared");
  cache.markLoaded("shared", store);
  cache.retain("shared", store);

  visit(cache, store, "two");
  visit(cache, store, "three");
  assert.equal(store.exists("shared"), true);
  cache.release("shared", store);
  visit(cache, store, "four");
  assert.equal(store.exists("shared"), true);

  cache.release("shared", store);
  visit(cache, store, "five");
  assert.equal(store.exists("shared"), true);
  visit(cache, store, "six");
  assert.equal(store.exists("shared"), false);
});

test("revisiting cached artwork avoids reload and refreshes LRU order", () => {
  const store = new FakeTextureStore();
  const cache = new FullArtworkTextureCache(3);
  for (const key of ["one", "two", "three"]) visit(cache, store, key);

  let loadCount = 0;
  cache.retain("one", store);
  if (!store.exists("one")) {
    loadCount += 1;
    store.add("one");
  }
  cache.markLoaded("one", store);
  cache.release("one", store);
  visit(cache, store, "four");

  assert.equal(loadCount, 0);
  assert.deepEqual([...store.textures].sort(), ["four", "one", "three"]);
  assert.equal(store.exists("two"), false);
});

test("failed artwork load leaves no resident texture and later visits still evict safely", () => {
  const store = new FakeTextureStore();
  const cache = new FullArtworkTextureCache(2);
  cache.retain("broken", store);
  cache.markLoadFailed("broken");
  cache.release("broken", store);
  assert.equal(store.textures.size, 0);
  assert.deepEqual(store.removed, []);

  for (const key of ["one", "two", "three"]) visit(cache, store, key);
  assert.deepEqual([...store.textures], ["two", "three"]);
});

test("scene wiring loads on demand, reuses textures, handles failure, and cleans loader callbacks", async () => {
  const [play, fullView, gallery] = await Promise.all([
    readFile(new URL("../src/game/PlayScene.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/game/ArtworkFullViewScene.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/game/ArtworkGalleryScene.ts", import.meta.url), "utf8"),
  ]);
  assert.match(play, /shouldLoadFullArtwork\(artwork\.fullAssetKey, this\.textures\)/);
  assert.match(play, /filecomplete-image-/);
  assert.match(play, /FILE_LOAD_ERROR/);
  assert.match(play, /cancelArtworkLoad\(true\)/);
  assert.match(play, /releaseRetainedArtwork\(\)/);
  assert.match(fullView, /artworkTextures\.retain/);
  assert.match(fullView, /Events\.SHUTDOWN[\s\S]*releaseArtwork/);
  assert.match(gallery, /cancelThumbnailLoads\(true\)/);
  assert.match(gallery, /FILE_LOAD_ERROR/);
});
