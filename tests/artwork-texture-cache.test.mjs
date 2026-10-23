import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
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


test("scene leases survive normal use and release across interrupted Phaser lifecycles", async () => {
  const previousPhaser = globalThis.Phaser;

  class MockLoader extends EventEmitter {
    loading = false;
    resetCount = 0;
    images = [];

    image(key, path) {
      this.images.push({ key, path });
      return this;
    }

    start() {
      this.loading = true;
      return this;
    }

    isLoading() { return this.loading; }

    reset() {
      this.loading = false;
      this.resetCount += 1;
      return this;
    }
  }

  class MockScene {
    constructor() {
      this.events = new EventEmitter();
      this.textures = new FakeTextureStore();
      this.load = new MockLoader();
      this.scale = new EventEmitter();
      this.cameras = {
        main: {
          setBackgroundColor() { return this; },
          setZoom() { return this; },
          centerOn() { return this; },
        },
      };
      this.sys = { isActive: () => true };
      this.scene = { isActive: () => true };
    }
  }

  globalThis.Phaser = {
    Scene: MockScene,
    Scenes: { Events: { SHUTDOWN: "shutdown" } },
    Loader: { Events: { FILE_LOAD_ERROR: "loaderror" } },
    Scale: { Events: { RESIZE: "resize" } },
  };

  try {
    const [{ PlayScene }, { ArtworkFullViewScene }] = await Promise.all([
      import("../.test-dist/game/PlayScene.js?early-shutdown"),
      import("../.test-dist/game/ArtworkFullViewScene.js?early-shutdown"),
    ]);
    const progressStore = { load: () => ({ version: 1, completedThroughLevel: 100 }) };
    const makePlay = (cache, store) => {
      const scene = new PlayScene({}, progressStore, 1, "en", cache);
      scene.textures = store;
      scene.load = new MockLoader();
      return scene;
    };
    const makeFullView = (cache, store, destroyed) => {
      const scene = new ArtworkFullViewScene(progressStore, 1, "en", cache);
      scene.textures = store;
      scene.load = new MockLoader();
      scene.renderPresentation = () => ({
        destroy() { destroyed.count += 1; },
      });
      return scene;
    };
    const playData = (levelNumber) => ({ levelNumber, stageIndex: 0, persistenceEnabled: true });

    // init -> preload -> shutdown, with create never reached.
    {
      const store = new FakeTextureStore();
      const cache = new FullArtworkTextureCache(3);
      const scene = makePlay(cache, store);
      scene.init(playData(1));
      assert.equal(scene.events.listenerCount("shutdown"), 1);
      scene.preload();
      store.add("level-artwork-001-full");
      scene.load.loading = true;
      scene.events.emit("shutdown");
      assert.equal(scene.load.resetCount, 1);
      assert.equal(scene.events.listenerCount("shutdown"), 0);
      for (const key of ["later-1", "later-2", "later-3", "later-4"]) visit(cache, store, key);
      assert.equal(store.exists("level-artwork-001-full"), false);
    }

    // Early shutdown may reopen the same artwork without retaining the old lease.
    {
      const store = new FakeTextureStore();
      const cache = new FullArtworkTextureCache(3);
      const scene = makePlay(cache, store);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        scene.init(playData(1));
        assert.equal(scene.events.listenerCount("shutdown"), 1);
        scene.preload();
        scene.load.loading = true;
        scene.events.emit("shutdown");
        assert.equal(scene.events.listenerCount("shutdown"), 0);
      }
      scene.init(playData(1));
      scene.preload();
      store.add("level-artwork-001-full");
      for (const key of ["recent-a", "recent-b", "recent-c", "recent-d"]) visit(cache, store, key);
      assert.equal(store.exists("level-artwork-001-full"), true,
        "the reopened Play/Reward lease must protect its artwork");
      scene.events.emit("shutdown");
      for (const key of ["recent-e", "recent-f", "recent-g", "recent-h"]) visit(cache, store, key);
      assert.equal(store.exists("level-artwork-001-full"), false);
    }

    // A canceled load cannot rebuild a reopened scene through stale success/error callbacks.
    {
      const store = new FakeTextureStore();
      const cache = new FullArtworkTextureCache(3);
      const scene = makePlay(cache, store);
      scene.init(playData(2));
      scene.retainCurrentArtwork();
      let readyCount = 0;
      scene.loadCurrentArtwork(() => { readyCount += 1; });
      const key = "level-artwork-002-full";
      const complete = scene.load.listeners(`filecomplete-image-${key}`)[0];
      const loadError = scene.load.listeners("loaderror")[0];
      assert.equal(typeof complete, "function");
      assert.equal(typeof loadError, "function");

      scene.events.emit("shutdown");
      scene.init(playData(2));
      scene.preload();
      complete();
      loadError({ key });
      assert.equal(readyCount, 0);
      assert.equal(scene.artworkLoadCleanup, null);
      scene.events.emit("shutdown");
    }

    // init -> preload -> create -> shutdown, plus normal Full View protection.
    {
      const store = new FakeTextureStore();
      const cache = new FullArtworkTextureCache(3);
      const destroyed = { count: 0 };
      const scene = makeFullView(cache, store, destroyed);
      scene.init({ levelNumber: 3, returnChapter: 1 });
      assert.equal(scene.events.listenerCount("shutdown"), 1);
      scene.preload();
      store.add("level-artwork-003-full");
      scene.create();
      for (const key of ["view-a", "view-b", "view-c", "view-d"]) visit(cache, store, key);
      assert.equal(store.exists("level-artwork-003-full"), true);
      scene.events.emit("shutdown");
      assert.equal(scene.retainedArtworkKey, null);
      for (const key of ["view-e", "view-f", "view-g", "view-h"]) visit(cache, store, key);
      assert.equal(store.exists("level-artwork-003-full"), false);
    }

    // Early Full View shutdown clears loading UI, then a different artwork opens normally.
    {
      const store = new FakeTextureStore();
      const cache = new FullArtworkTextureCache(3);
      const destroyed = { count: 0 };
      const scene = makeFullView(cache, store, destroyed);
      scene.init({ levelNumber: 4, returnChapter: 1 });
      scene.preload();
      scene.load.loading = true;
      scene.events.emit("shutdown");
      assert.equal(scene.load.resetCount, 1);
      assert.equal(scene.loadingPresentation, null);
      assert.equal(scene.retainedArtworkKey, null);
      assert.ok(destroyed.count >= 1);

      scene.init({ levelNumber: 5, returnChapter: 1 });
      assert.equal(scene.events.listenerCount("shutdown"), 1);
      scene.preload();
      store.add("level-artwork-005-full");
      scene.create();
      assert.equal(scene.retainedArtworkKey, "level-artwork-005-full");
      scene.events.emit("shutdown");
      assert.equal(scene.retainedArtworkKey, null);
    }
  } finally {
    if (previousPhaser === undefined) delete globalThis.Phaser;
    else globalThis.Phaser = previousPhaser;
  }
});
