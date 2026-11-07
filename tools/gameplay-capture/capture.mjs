import { chromium } from "playwright";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { execFileSync, spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import path from "node:path";

const URL = "https://whil3true.github.io/pairs_and_paths/";
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 60;
const OUTPUT = path.resolve("capture-output");
const RAW_VIDEO = path.join(OUTPUT, "cozy-gallery-mobile-1080x1920-60fps-audio.mp4");



await mkdir(OUTPUT, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ["--start-fullscreen", "--kiosk", "--window-position=0,0",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist",
    "--no-first-run", "--disable-infobars", "--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",

});
const page = await context.newPage();

const logs = [];
page.on("pageerror", (err) => logs.push("pageerror: " + err.message));
page.on("console", (entry) => {
  if (entry.type() === "error") logs.push("console error: " + entry.text());
});
const canvas = page.locator("#game canvas");
let ffmpeg = null;
let ffmpegMessages = "";
let captureStartTime = null;
let captureEndTime = null;
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
  // Capture the actual 1080x1920 X11 display at 60 FPS while PulseAudio
  // monitors the sink used by both HTMLAudioElement music and Web Audio SFX.
  const dimensions = await page.evaluate(() => [window.innerWidth, window.innerHeight]);
  if (dimensions[0] !== WIDTH || dimensions[1] !== HEIGHT) {
    throw Error("Unexpected Chromium viewport size: " + JSON.stringify(dimensions));
  }
  await page.screenshot({ path: path.join(OUTPUT, "capture-start.png") });
  ffmpeg = spawn("ffmpeg", [
    "-hide_banner", "-loglevel", "warning", "-y",
    "-thread_queue_size", "1024", "-f", "x11grab",
    "-framerate", "60", "-video_size", "1080x1920",
    "-i", process.env.DISPLAY + "+0,0",
    "-thread_queue_size", "1024", "-f", "pulse",
    "-i", "cozy_capture.monitor",
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "19", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
    "-movflags", "+faststart", RAW_VIDEO,
  ], { stdio: ["pipe", "ignore", "pipe"] });
  ffmpeg.stderr.setEncoding("utf8");
  ffmpeg.stderr.on("data", (chunk) => { ffmpegMessages += chunk; });
  captureStartTime = performance.now();
  await page.waitForTimeout(1000);

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
  captureEndTime = performance.now();
  if (ffmpeg) {
    const exit = new Promise((resolve) => ffmpeg.once("close", resolve));
    ffmpeg.stdin.write("q\n");
    ffmpeg.stdin.end();
    const code = await exit;
    if (code !== 0 && failure === null) {
      failure = Error("FFmpeg screen/audio capture failed with exit code " + code + ": " + ffmpegMessages.slice(-5000));
    }
  }
  await context.close();
  await browser.close();
}

if (failure !== null) {
  await writeFile(path.join(OUTPUT, "failure.json"), JSON.stringify({
    error: String(failure), completedThroughLevel, ffmpeg: ffmpegMessages.slice(-5000), console: logs,
  }, null, 2));
  throw failure;
}

// X11 capture is already cropped to gameplay only. Do not manufacture frames
// with FPS conversion: keep the 60fps source as the deliverable.
const captureBytes = (await stat(RAW_VIDEO)).size;
const probe = JSON.parse(execFileSync("ffprobe", [
  "-v", "error", "-count_frames",
  "-show_entries", "stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames",
  "-show_entries", "format=duration", "-of", "json", RAW_VIDEO,
], { encoding: "utf8" }));
const video = probe.streams?.find((x) => x.codec_type === "video");
const audio = probe.streams?.find((x) => x.codec_type === "audio");
const duration = Number(probe.format?.duration);
const frames = Number(video?.nb_read_frames);
const videoRate = frames / duration;
const { spawnSync } = await import("node:child_process");
const audioCheck = spawnSync("ffmpeg", [
  "-hide_banner", "-i", RAW_VIDEO, "-vn", "-af", "volumedetect",
  "-f", "null", "-",
], { encoding: "utf8", timeout: 30000 });
const maxVolumeDb = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(audioCheck.stderr)?.[1]);
const audible = Number.isFinite(maxVolumeDb) && maxVolumeDb > -55;
const report = {
  method: "headed Chromium in Xvfb, FFmpeg x11grab 60fps + PulseAudio monitor",
  source: URL, width: video?.width, height: video?.height,
  fps: video?.avg_frame_rate, actualFrames: frames,
  durationSeconds: duration, frameCountPerSecond: videoRate,
  audioCodec: audio?.codec_name, audioMaxDb: maxVolumeDb,
  audible, completedThroughLevel, fileBytes: captureBytes,
  wallCaptureSeconds: captureEndTime && captureStartTime
    ? (captureEndTime - captureStartTime) / 1000 : null,
  warning: "A nominal 60fps frame stream can contain duplicates if WebGL or the runner cannot render every frame.",
  console: logs, ffmpegWarnings: ffmpegMessages.slice(-4000),
};
await writeFile(path.join(OUTPUT, "capture-report.json"), JSON.stringify(report, null, 2));
console.log("CAPTURE_RESULT " + JSON.stringify(report));
if (video?.width !== WIDTH || video?.height !== HEIGHT
 || !String(video?.avg_frame_rate).includes("60")
 || audio?.codec_name !== "aac" || !audible
 || !Number.isFinite(duration) || duration < 12) {
  throw Error("X11 capture quality gate failed; inspect report and recording");
}
