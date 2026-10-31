import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = async (path) => readFile(new URL(path, import.meta.url), "utf8");

test("navigation cover shields previous screen before the ad request", async () => {
  const play = await source("../src/game/PlayScene.ts");
  const gallery = await source("../src/game/ArtworkGalleryScene.ts");
  for (const code of [play, gallery]) {
    assert.ok(code.indexOf("showNavigationCover()") < code.indexOf("interstitials.tryShow()"));
    assert.match(code, /armNavigationCoverFallback\(\)/);
    assert.match(code, /hideNavigationCover\(\)/);
  }
});

test("cover stays until a rendered destination exists, not until the ad closes", async () => {
  const [play, menu, cover, css] = await Promise.all([
    source("../src/game/PlayScene.ts"),
    source("../src/game/MainMenuScene.ts"),
    source("../src/platform/NavigationCover.ts"),
    source("../public/styles.css"),
  ]);
  assert.match(play, /loadStage\(animateIn = false\)[\s\S]*?releaseNavigationCoverAfterRender\(this\.game\)/);
  assert.match(menu, /releaseNavigationCoverAfterRender\(this\.game\)/);
  assert.match(cover, /Phaser\.Core\.Events\.POST_RENDER/);
  assert.match(cover, /navigation_cover_render_timeout/);
  assert.match(css, /#navigation-cover\s*\{/);
  assert.match(css, /#navigation-cover\[hidden\]/);
});
