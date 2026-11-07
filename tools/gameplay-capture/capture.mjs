import { chromium } from "playwright";
import { mkdir, copyFile, writeFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import path from "node:path";

const URL = "https://whil3true.github.io/pairs_and_paths/";
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const OUTPUT = path.resolve("capture-output");
const RAW_DIR = path.join(OUTPUT, "raw");
const VIDEO = path.join(OUTPUT, "cozy-gallery-mobile-1080x1920.mp4");
const PROGRESS_KEY = "pairs-and-paths:campaign-progress";

await mkdir(RAW_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  recordVideo: { dir: RAW_DIR, size: { width: WIDTH, height: HEIGHT }, fps: FPS },
});
const page = await context.newPage();
const started = performance.now();
const logs = [];
page.on("pageerror", (err) => logs.push("pageerror: " + err.message));
page.on("console", (entry) => {
  if (entry.type() === "error") logs.push("console error: " + entry.text());
});
const canvas = page.locator("#game canvas");
let gameplayStarted = null;
let completedThroughLevel = 0;
let failure = null;

async function tapWorld(x, y) {
  const r = await canvas.boundingBox();
  if (!r || r.width <= 0 || r.height <= 0) throw Error("Game canvas is missing or has zero size");
  // Production game keeps its 480x800 scene centered inside the expanding canvas.
  const scale = r.width / 480;
  const px = r.x + r.width / 2 + (x - 240) * scale;
  const py = r.y + r.height / 2 + (y - 400) * scale;
  if (px < r.x || py < r.y || px >= r.x + r.width || py >= r.y + r.height) {
    throw Error("Logical tap falls outside canvas");
  }
  await page.touchscreen.tap(px, py);
}

async function witnessForLevel(levelNumber) {
  // Read only the game's published deterministic domain module. No debug routes,
  // injected gameplay hooks or modifications to the running game.
  return page.evaluate(async (number) => {
    const moduleUrl = new globalThis.URL("./js/game/LevelSequence.js", document.baseURI).href;
    const { createLevelStage, getStageCount } = await import(moduleUrl);
    if (getStageCount(number) !== 1) throw Error("Pilot supports single-stage levels only");
    const generated = createLevelStage(number, 0);
    return generated.witness.map((move) => ({ start: move.start, end: move.end }));
  }, levelNumber);
}

try {
  const response = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (!response || !response.ok()) throw Error("GitHub Pages response was not successful");
  await canvas.waitFor({ state: "visible", timeout: 45000 });
  await page.waitForTimeout(2600); // Initial non-interactive intro precedes Main Menu.
  await tapWorld(240, 482); // Main Menu Play, using approved production layout.
  await page.waitForTimeout(2200); // Level-1 artwork/symbol loading and settling.
  gameplayStarted = performance.now();

  for (const levelNumber of [1, 2]) {
    const moves = await witnessForLevel(levelNumber);
    if (moves.length < 3) throw Error("Unexpectedly short level witness");
    for (const move of moves) {
      await tapWorld(240 - (4 * 64) / 2 + (move.start.col + 0.5) * 64,
        420 - (4 * 64) / 2 + (move.start.row + 0.5) * 64);
      await page.waitForTimeout(250);
      await tapWorld(240 - (4 * 64) / 2 + (move.end.col + 0.5) * 64,
        420 - (4 * 64) / 2 + (move.end.row + 0.5) * 64);
      await page.waitForTimeout(1050); // Route + removal animation must finish.
    }
    await page.waitForFunction((expected) => {
      try {
        const raw = localStorage.getItem("pairs-and-paths:campaign-progress");
        return raw !== null && JSON.parse(raw).completedThroughLevel >= expected;
      } catch {
        return false;
      }
    }, levelNumber, { timeout: 10000 });
    completedThroughLevel = levelNumber;
    await page.waitForTimeout(1500); // Display collectible artwork/reward.
    if (levelNumber === 1) {
      await tapWorld(240, 648); // Reward Continue
      await page.waitForTimeout(500);
      await tapWorld(240, 382); // Complete: Next level (web has no interstitial)
      await page.waitForTimeout(2200);
    }
  }
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(OUTPUT, "last-frame.png") });
} catch (err) {
  failure = err;
  try {
    await page.screenshot({ path: path.join(OUTPUT, "failure.png") });
  } catch { /* The browser may already be gone. */ }
} finally {
  await context.close(); // Playwright saves its WebM video only when the context closes.
  const video = page.video();
  if (video) {
    try { await copyFile(await video.path(), path.join(OUTPUT, "uncut.webm")); }
    catch (err) { logs.push("raw video unavailable: " + String(err)); }
  }
  await browser.close();
}

if (failure !== null) {
  await writeFile(path.join(OUTPUT, "failure.json"), JSON.stringify({
    error: String(failure), completedThroughLevel, console: logs,
  }, null, 2));
  throw failure;
}

// Trim the boot/menu lead-in; retain actual unedited in-game frames.
// FFmpeg never reconstructs gameplay, it only encodes the recorded browser pixels.
const trimSeconds = Math.max(0, (gameplayStarted - started) / 1000 - 0.5);
execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-ss", trimSeconds.toFixed(2), "-i", path.join(OUTPUT, "uncut.webm"),
  "-t", "20", "-vf", "fps=30", "-c:v", "libx264",
  "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-an", VIDEO,
], { stdio: "inherit", timeout: 120000 });
const probe = JSON.parse(execFileSync("ffprobe", [
  "-v", "error", "-select_streams", "v:0",
  "-show_entries", "stream=codec_name,width,height,avg_frame_rate",
  "-show_entries", "format=duration",
  "-of", "json", VIDEO,
], { encoding: "utf8" }));
const stream = probe.streams?.[0];
const duration = Number(probe.format?.duration);
if (stream?.width !== WIDTH || stream?.height !== HEIGHT
  || stream?.codec_name !== "h264" || !Number.isFinite(duration) || duration < 12) {
  throw Error("Video QA failed: wrong frame size, codec or duration");
}
const report = {
  source: URL,
  method: "GitHub Actions Chromium + Playwright recorded WebM, FFmpeg H.264",
  width: stream.width, height: stream.height,
  fps: stream.avg_frame_rate, durationSeconds: duration,
  audio: "not captured (Playwright video is video-only)",
  completedThroughLevel,
  sourceVersion: "GitHub Pages deployment of dev (not PR branch)",
  recordedFrames: "real browser frames; no artificial game rendering",
  warning: "Encoded FPS does not prove that every frame is unique or perfectly smooth.",
  fileBytes: (await stat(VIDEO)).size,
  console: logs,
};
await writeFile(path.join(OUTPUT, "capture-report.json"), JSON.stringify(report, null, 2));
console.log("CAPTURE_RESULT " + JSON.stringify(report));
