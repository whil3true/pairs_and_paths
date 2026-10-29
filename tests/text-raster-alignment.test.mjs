import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  alignTextQuadInPlace, hasNativePhysicalCanvas, isNativeTextQuad,
} from "../.test-dist/game/TextRasterAlignmentPolicy.js";

test("physical canvas gate admits native desktop presentation and rejects resampling", () => {
  assert.equal(hasNativePhysicalCanvas(648, 1080, 648, 1080, 636, 0, 1), true);
  assert.equal(hasNativePhysicalCanvas(864, 1440, 864, 1440, 848, 0, 1), true);
  assert.equal(hasNativePhysicalCanvas(
    648, 1080, 518.390625, 864, 508.8046875, 0, 1.25,
  ), true, "browser CSS quantization at Windows 125% remains inside tolerance");

  assert.equal(hasNativePhysicalCanvas(480, 800, 460.796875, 768, 452.6015625, 0, 1), false);
  assert.equal(hasNativePhysicalCanvas(960, 2077, 390, 844, 0, 0, 2), false);
  assert.equal(hasNativePhysicalCanvas(960, 2077, 390, 844, 0, 0, 3), false);
  assert.equal(hasNativePhysicalCanvas(648, 1080, 648, 1080, 636.25, 0, 1), false);
  assert.equal(hasNativePhysicalCanvas(648, 1080, 648, 1080, 636, 0.25, 1), false);
});

test("native text quad gate accepts only the unchanged axis-aligned Phaser transform", () => {
  const baseline = new Float32Array([
    436.7250061, 739.7999878,
    436.7250061, 766.7999878,
    513.6749878, 766.7999878,
    513.6749878, 739.7999878,
  ]);
  assert.equal(isNativeTextQuad(baseline, 76.95, 27), true);

  const rotated = new Float32Array([10, 10, 9, 30, 29, 31, 30, 11]);
  const scaled = new Float32Array([10, 10, 10, 40, 110, 40, 110, 10]);
  const flipped = new Float32Array([110, 10, 110, 30, 10, 30, 10, 10]);
  assert.equal(isNativeTextQuad(rotated, 20, 20), false);
  assert.equal(isNativeTextQuad(scaled, 20, 20), false);
  assert.equal(isNativeTextQuad(flipped, 100, 20), false);
});

test("quad correction snaps once and preserves current integer texture dimensions", () => {
  const quad = new Float32Array([
    436.7250061, 739.7999878,
    436.7250061, 766.7999878,
    513.6749878, 766.7999878,
    513.6749878, 739.7999878,
  ]);
  alignTextQuadInPlace(quad, 76, 27);
  assert.deepEqual([...quad], [437, 740, 437, 767, 513, 767, 513, 740]);

  // A later setText/font-size/padding update supplies its latest canvas size;
  // no geometry captured at object creation survives into the next render.
  alignTextQuadInPlace(quad, 195, 31);
  assert.deepEqual([...quad], [437, 740, 437, 771, 632, 771, 632, 740]);
});

test("adapter remains per-object, WebGL-only and does not rebuild text textures", async () => {
  const source = await readFile(new URL("../src/game/TextRasterAlignment.ts", import.meta.url), "utf8");
  assert.match(source, /renderer\.type !== Phaser\.WEBGL/);
  assert.match(source, /text\.setRenderNodeRole\("Transformer", node\)/);
  assert.match(source, /new WeakMap<[\s\S]*RenderNodeManager/);
  assert.match(source, /Phaser\.Scale\.Events\.RESIZE/);
  assert.match(source, /text\.scene\.tweens\.isTweening\(parent\)/);
  assert.match(source, /text\.filters !== null/);
  assert.match(source, /parent\.filters !== null/);
  assert.doesNotMatch(source, /frame\.setSize|source\.updateSize|updateText\(|setResolution\(/);
});

