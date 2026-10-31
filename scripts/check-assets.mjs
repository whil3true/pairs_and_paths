import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { TILE_SYMBOLS } from "../dist/js/game/TileSymbols.js";
import { LEVEL_ARTWORK } from "../dist/js/game/LevelArtwork.js";
import { CHAPTER_BANNER_ASSETS } from "../dist/js/game/ChapterBannerAssets.js";
import { MAIN_MENU_BRAND_ASSETS } from "../dist/js/game/MainMenuBrandAssets.js";
import { COMPACT_HUD_ASSETS } from "../dist/js/game/GameplayHudPolicy.js";
import { AUDIO_EFFECTS, AUDIO_MUSIC } from "../dist/js/audio/AudioAssetManifest.js";

// Run after build. Import pure catalogs only; never construct Phaser or a browser adapter.
const root = new URL("../", import.meta.url);
const publicRoot = new URL("public/", root);
const distRoot = new URL("dist/", root);
const snapshot = JSON.parse(await readFile(new URL("docs/audit/production-assets.sha256.json", root), "utf8"));
const css = await readFile(new URL("styles.css", publicRoot), "utf8");
const cssPaths = [...css.matchAll(/url\(["']?(\.\/assets\/[^)"']+)["']?\)/g)]
  .map(([, path]) => path.slice(2));
// Gear is a literal in a Phaser presentation module; do not evaluate that module in Node.
const gearSource = await readFile(new URL("src/game/SettingsGearButton.ts", root), "utf8");
const gearPath = gearSource.match(/SETTINGS_GEAR_PNG_PATH\s*=\s*"([^"]+)"/)?.[1];
assert.ok(gearPath, "Settings gear path must remain explicitly discoverable");
const runtime = new Set([
  ...TILE_SYMBOLS.map(({ assetPath }) => assetPath),
  ...LEVEL_ARTWORK.flatMap(({ fullPath, thumbnailPath }) => [fullPath, thumbnailPath]),
  ...CHAPTER_BANNER_ASSETS.map(({ path }) => path),
  ...Object.values(MAIN_MENU_BRAND_ASSETS).map(({ path }) => path),
  ...Object.values(COMPACT_HUD_ASSETS).map(({ path }) => path),
  ...Object.values(AUDIO_EFFECTS), ...AUDIO_MUSIC.map(({ path }) => path),
  ...cssPaths, gearPath,
]);
const licenses = ["assets/fonts/licenses/Literata-OFL.txt", "assets/fonts/licenses/Onest-OFL.txt"];
assert.deepEqual([...new Set([...runtime, ...licenses])].sort(), Object.keys(snapshot).sort(),
  "Expanded runtime catalogs/CSS and preserved licenses must exactly match the approved snapshot");
assert.equal(TILE_SYMBOLS.length, 30);
assert.equal(LEVEL_ARTWORK.length, 100);
assert.equal(CHAPTER_BANNER_ASSETS.length, 10);
assert.equal(Object.keys(COMPACT_HUD_ASSETS).length, 4);

for (const [path, expected] of Object.entries(snapshot)) {
  assert.ok(path.startsWith("assets/") && !path.includes(".."), `Unsafe asset path: ${path}`);
  const source = await readFile(new URL(path, publicRoot));
  const deployed = await readFile(new URL(path, distRoot));
  assert.equal(createHash("sha256").update(source).digest("hex"), expected, `Production asset changed: ${path}`);
  assert.deepEqual(deployed, source, `Build altered or failed to copy ${path}`);
}
const walk = async (directory) => {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) paths.push(...await walk(url));
    else paths.push(url);
  }
  return paths;
};
const relative = (url, base) => fileURLToPath(url).slice(fileURLToPath(base).length).replaceAll("\\", "/");
const publicFiles = await walk(publicRoot);
const allowed = new Set([...Object.keys(snapshot), "index.html", "styles.css", "assets/audio/README.md"]);
assert.deepEqual(publicFiles.map((url) => relative(url, publicRoot)).sort(), [...allowed].sort(),
  "Unexpected public file: classify new assets/support files; do not silently ship old exports");
for (const source of publicFiles) {
  const path = relative(source, publicRoot);
  assert.deepEqual(await readFile(new URL(path, distRoot)), await readFile(source), `Static copy differs: ${path}`);
}

// Check emitted module references plus HTML/CSS paths. This is not a general JS reachability analyzer.
const distFiles = await walk(distRoot);
const expectedDist = new Set([...allowed, "vendor/phaser.js"]);
const sourceRoot = new URL("src/", root);
for (const source of await walk(sourceRoot)) {
  const path = relative(source, sourceRoot);
  if (path.endsWith(".ts")) expectedDist.add(`js/${path.slice(0, -3)}.js`);
}
assert.deepEqual(distFiles.map((url) => relative(url, distRoot)).sort(), [...expectedDist].sort(),
  "Unexpected/missing emitted or deployed file");
for (const url of distFiles) {
  const path = relative(url, distRoot);
  assert.ok(path.isWellFormed() && /^[\x21-\x7e]+$/.test(path), `Non-ASCII/whitespace release filename: ${path}`);
  let refs = [];
  if (path.startsWith("js/") && path.endsWith(".js")) {
    const source = await readFile(url, "utf8");
    refs = [...source.matchAll(/\b(?:import|export)\s+(?:[^;]*?\s+from\s*)?["'](\.[^"']+)["']/g)]
      .map(([, ref]) => ref);
  } else if (path === "index.html") {
    const source = await readFile(url, "utf8");
    refs = [...source.matchAll(/(?:src|href)=["'](\.[^"']+)["']/g)].map(([, ref]) => ref);
  } else if (path.endsWith(".css")) {
    const source = await readFile(url, "utf8");
    refs = [...source.matchAll(/url\(["']?(\.[^)"']+)["']?\)/g)].map(([, ref]) => ref);
  }
  for (const ref of refs) assert.ok((await stat(new URL(ref, url))).isFile(), `${path} references missing ${ref}`);
}
console.log(`Assets verified: ${runtime.size} runtime files + ${licenses.length} licenses; ${publicFiles.length} public / ${distFiles.length} dist files; exact hashes, copies and local references PASS.`);
