import { chromium } from "playwright";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import path from "node:path";

const URL = "https://whil3true.github.io/pairs_and_paths/";
const LAYOUT = process.env.CAPTURE_LAYOUT ?? "mobile";
const LOCALE = process.env.CAPTURE_LOCALE ?? "ru";
const PROFILES = Object.freeze({
  mobile: { width: 480, height: 854, outputWidth: 1080, outputHeight: 1920 },
  desktop: { width: 960, height: 540, outputWidth: 1920, outputHeight: 1080 },
});
if (!Object.hasOwn(PROFILES, LAYOUT) || !["ru", "en"].includes(LOCALE)) {
  throw Error("Invalid capture profile or locale");
}
const PROFILE = PROFILES[LAYOUT];
const WIDTH = PROFILE.width;
const HEIGHT = PROFILE.height;
const OUTPUT_WIDTH = PROFILE.outputWidth;
const OUTPUT_HEIGHT = PROFILE.outputHeight;
const FPS = 60;
const LABEL = LAYOUT + "-" + LOCALE;
const OUTPUT = path.resolve("capture-output");
const RAW_VIDEO = path.join(OUTPUT, "gameplay-source-" + LABEL + "-" + WIDTH + "x" + HEIGHT + ".mp4");
const FINAL_VIDEO = path.join(OUTPUT, "cozy-gallery-" + LABEL + "-" + OUTPUT_WIDTH + "x" + OUTPUT_HEIGHT + "-60fps.mp4");
const REPORT_PATH = path.join(OUTPUT, "capture-report-" + LABEL + ".json");



await mkdir(OUTPUT, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ["--start-fullscreen", "--kiosk", "--window-position=0,0", "--window-size=" + WIDTH + "," + HEIGHT,
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist",
    "--no-first-run", "--disable-infobars", "--autoplay-policy=no-user-gesture-required",
    // Browser UI must never cover the recorded game. Disable Chromium's
    // automatic translation bubble and match the game's Russian locale.
    "--disable-translate", "--disable-features=Translate,TranslateUI",
    "--lang=" + (LOCALE === "en" ? "en-US" : "ru-RU"), "--no-default-browser-check"],
});
const context = await browser.newContext({
  // This affects only the isolated recording browser, not player settings.
  locale: LOCALE === "en" ? "en-US" : "ru-RU",
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  hasTouch: LAYOUT === "mobile",
  isMobile: LAYOUT === "mobile",
  // Real desktop classification exercises the game's production 2x desktop policy.
  ...(LAYOUT === "mobile" ? {
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  } : {}),

});
// The shipped HTML declares lang="en" even when the UI is Russian. Chromium
// may therefore offer to translate it despite the launch flags. Mark the
// document as untranslatable before any page script executes. This only runs
// in the isolated recording browser and is never committed to the game.
await context.addInitScript((locale) => {
  // The game reads this persisted manual locale on boot, before creating scenes.
  // Fresh Playwright context isolates it; no real player's preferences change.
  try { window.localStorage.setItem("pairs-and-paths:ui-locale", locale); }
  catch { /* about:blank has no accessible origin; the game origin will. */ }
  const protect = () => {
    const html = document.documentElement;
    if (html) {
      if (html.getAttribute("translate") !== "no") html.setAttribute("translate", "no");
      if (html.getAttribute("lang") !== locale) html.setAttribute("lang", locale);
      if (!html.classList.contains("notranslate")) html.classList.add("notranslate");
    }
    const head = document.head;
    if (head && !head.querySelector('meta[name="google"][content="notranslate"]')) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "google");
      meta.setAttribute("content", "notranslate");
      head.appendChild(meta);
    }
    const body = document.body;
    if (body) {
      if (body.getAttribute("translate") !== "no") body.setAttribute("translate", "no");
      if (!body.classList.contains("notranslate")) body.classList.add("notranslate");
    }
  };
  protect();
  document.addEventListener("DOMContentLoaded", protect, { once: true });
  new MutationObserver(protect).observe(document, { childList: true, subtree: true });
}, LOCALE);

async function enforceNoTranslate() {
  return page.evaluate((locale) => {
    const html = document.documentElement;
    html.setAttribute("translate", "no");
    html.setAttribute("lang", locale);
    html.classList.add("notranslate");
    document.body?.setAttribute("translate", "no");
    document.body?.classList.add("notranslate");
    let meta = document.head.querySelector('meta[name="google"][content="notranslate"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "google");
      meta.setAttribute("content", "notranslate");
      document.head.appendChild(meta);
    }
    return {
      htmlTranslate: html.getAttribute("translate"),
      htmlLang: html.getAttribute("lang"),
      metaNoTranslate: Boolean(document.head.querySelector('meta[name="google"][content="notranslate"]')),
      bodyTranslate: document.body?.getAttribute("translate"),
      storedLocale: localStorage.getItem("pairs-and-paths:ui-locale"),
    };
  }, LOCALE);
}

const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const { windowId } = await cdp.send("Browser.getWindowForTarget");
await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "fullscreen" } });
await page.waitForTimeout(900);

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
let frameTiming = null;
let screenPsnrDb = null;
let topPsnrDb = null;
let fullscreenInfo = null;
let failure = null;
let activeGameLocale = null;

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
  if (LAYOUT === "mobile") await page.touchscreen.tap(px, py);
  else await page.mouse.click(px, py, { delay: 35 });
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
  const translationDomState = await enforceNoTranslate();
  if (translationDomState.htmlTranslate !== "no" || !translationDomState.metaNoTranslate
      || translationDomState.storedLocale !== LOCALE) {
    throw Error("Capture document must be marked notranslate before recording");
  }
  await canvas.waitFor({ state: "visible", timeout: 45000 });
  await page.waitForTimeout(2600); // Initial non-interactive intro precedes Main Menu.
  activeGameLocale = await page.evaluate(async () => {
    const runtimeUrl = new globalThis.URL("./js/game/UiLocaleRuntime.js", document.baseURI).href;
    const { getActiveUiLocale } = await import(runtimeUrl);
    return getActiveUiLocale("ru");
  });
  if (activeGameLocale !== LOCALE) {
    throw Error("Game localization mismatch: expected " + LOCALE + " but got " + activeGameLocale);
  }
  await tapWorld(240, 482); // Main Menu Play, using approved production layout.
  await page.waitForTimeout(2200); // Level-1 artwork/symbol loading and settling.
  // Capture the selected fullscreen Chromium profile while PulseAudio
  // monitors the sink used by both HTMLAudioElement music and Web Audio SFX.
  const dimensions = await page.evaluate(() => [window.innerWidth, window.innerHeight]);
  if (dimensions[0] !== WIDTH || dimensions[1] !== HEIGHT) {
    throw Error("Unexpected Chromium viewport size: " + JSON.stringify(dimensions));
  }
  fullscreenInfo = {
    ...(await cdp.send("Browser.getWindowBounds", { windowId })).bounds,
    ...await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      canvasBounds: (() => { const r = document.querySelector("#game canvas").getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height }; })(),
    })),
  };
  if (fullscreenInfo.windowState !== "fullscreen") {
    throw Error("Chromium is not fullscreen: " + JSON.stringify(fullscreenInfo));
  }
  // Explicit QA: compare a real screenshot of the X11 display against the
  // browser viewport. A tab strip or address bar shifts them and fails PSNR.
  await page.screenshot({ path: path.join(OUTPUT, "capture-viewport-" + LABEL + ".png") });
  const screenShot = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "x11grab", "-draw_mouse", "0",
    "-video_size", WIDTH + "x" + HEIGHT,
    "-i", process.env.DISPLAY + "+0,0",
    "-frames:v", "1", path.join(OUTPUT, "capture-screen-" + LABEL + ".png"),
  ], { encoding: "utf8", timeout: 15000 });
  if (screenShot.status !== 0) throw Error("Could not inspect X11 display: " + screenShot.stderr);
  const diff = spawnSync("ffmpeg", [
    "-hide_banner", "-i", path.join(OUTPUT, "capture-screen-" + LABEL + ".png"),
    "-i", path.join(OUTPUT, "capture-viewport-" + LABEL + ".png"),
    "-filter_complex", "[0:v][1:v]psnr",
    "-f", "null", "-",
  ], { encoding: "utf8", timeout: 15000 });
  if (diff.status !== 0) throw Error("Viewport/screen QA failed: " + diff.stderr);
  const psnrLabel = /average:([\d.]+|inf)/.exec(diff.stderr)?.[1];
  screenPsnrDb = psnrLabel === "inf" ? 99 : Number(psnrLabel);
  if (!Number.isFinite(screenPsnrDb) || screenPsnrDb < 18) {
    throw Error("Browser chrome or wrong capture region detected. PSNR="
      + screenPsnrDb + "; fullscreen=" + JSON.stringify(fullscreenInfo));
  }
  // The existing full-frame PSNR can miss an overlay occupying only a thin
  // strip at the top. Inspect that region independently for Chrome Translate.
  const topDiff = spawnSync("ffmpeg", [
    "-hide_banner",
    "-i", path.join(OUTPUT, "capture-screen-" + LABEL + ".png"),
    "-i", path.join(OUTPUT, "capture-viewport-" + LABEL + ".png"),
    "-filter_complex", "[0:v]crop=iw:90:0:0[topScreen];[1:v]crop=iw:90:0:0[topViewport];[topScreen][topViewport]psnr",
    "-f", "null", "-",
  ], { encoding: "utf8", timeout: 15000 });
  if (topDiff.status !== 0) throw Error("Browser overlay QA could not run: " + topDiff.stderr);
  const topLabel = /average:([\d.]+|inf)/.exec(topDiff.stderr)?.[1];
  topPsnrDb = topLabel === "inf" ? 99 : Number(topLabel);
  if (!Number.isFinite(topPsnrDb) || topPsnrDb < 26) {
    throw Error("Top-of-screen browser UI suspected: PSNR=" + topPsnrDb
      + "; inspect capture-screen-" + LABEL + ".png and capture-viewport-" + LABEL + ".png");
  }
  await page.evaluate(() => {
    const samples = [];
    let previous = 0;
    window.__captureFrameTiming = { samples };
    const tick = (now) => {
      if (!window.__captureFrameTiming) return;
      if (previous > 0) samples.push(now - previous);
      previous = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  ffmpeg = spawn("ffmpeg", [
    "-hide_banner", "-loglevel", "warning", "-y",
    "-thread_queue_size", "1024", "-f", "x11grab",
    "-draw_mouse", "0", "-framerate", String(FPS), "-video_size", WIDTH + "x" + HEIGHT,
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
  await page.screenshot({ path: path.join(OUTPUT, "last-frame-" + LABEL + ".png") });
  frameTiming = await page.evaluate(() => { const intervals = window.__captureFrameTiming?.samples || [];
    window.__captureFrameTiming = null;
    const sorted = [...intervals].sort((a,b)=>a-b);
    return { samples: intervals.length, over25ms: intervals.filter(x=>x>25).length,
      over40ms: intervals.filter(x=>x>40).length,
      p95ms: sorted[Math.floor(sorted.length*0.95)] || null,
      maxMs: sorted[sorted.length-1] || null }; });
} catch (err) {
  failure = err;
  try {
    await page.screenshot({ path: path.join(OUTPUT, "failure-" + LABEL + ".png") });
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
  await writeFile(path.join(OUTPUT, "failure-" + LABEL + ".json"), JSON.stringify({
    error: String(failure), completedThroughLevel, ffmpeg: ffmpegMessages.slice(-5000), fullscreenInfo, screenPsnrDb, topPsnrDb, console: logs,
  }, null, 2));
  throw failure;
}

// Retain source timestamps and original audio. Upscale in a separate offline
// pass to 1080x1920 so the real-time capture never pays the scaling cost.
execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", RAW_VIDEO,
  "-vf", "scale=" + OUTPUT_WIDTH + ":" + OUTPUT_HEIGHT + ":flags=lanczos,setsar=1",
  "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
  "-fps_mode", "passthrough", "-c:a", "copy", "-movflags", "+faststart", FINAL_VIDEO,
], { stdio: "inherit", timeout: 180000 });
const captureBytes = (await stat(FINAL_VIDEO)).size;
const probe = JSON.parse(execFileSync("ffprobe", [
  "-v", "error", "-count_frames",
  "-show_entries", "stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames",
  "-show_entries", "format=duration", "-of", "json", FINAL_VIDEO,
], { encoding: "utf8" }));
const video = probe.streams?.find((x) => x.codec_type === "video");
const audio = probe.streams?.find((x) => x.codec_type === "audio");
const duration = Number(probe.format?.duration);
const frames = Number(video?.nb_read_frames);
const videoRate = frames / duration;

const audioCheck = spawnSync("ffmpeg", [
  "-hide_banner", "-i", FINAL_VIDEO, "-vn", "-af", "volumedetect",
  "-f", "null", "-",
], { encoding: "utf8", timeout: 30000 });
const maxVolumeDb = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(audioCheck.stderr)?.[1]);
const audible = Number.isFinite(maxVolumeDb) && maxVolumeDb > -55;
const report = {
  method: "fullscreen Chromium in Openbox/Xvfb, FFmpeg x11grab 60fps without cursor + PulseAudio",
  layout: LAYOUT, requestedLocale: LOCALE, verifiedGameLocale: activeGameLocale,
  captureResolution: [WIDTH, HEIGHT], outputResolution: [OUTPUT_WIDTH, OUTPUT_HEIGHT],
  fullscreenInfo, screenPsnrDb, topPsnrDb, frameTiming,
  translationDomState: "notranslate applied at document start and after navigation",
  browserTranslationPolicy: "disabled via Chromium flags; locale " + LOCALE,
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
await writeFile(REPORT_PATH, JSON.stringify(report, null, 2));
console.log("CAPTURE_RESULT " + JSON.stringify(report));
if (video?.width !== OUTPUT_WIDTH || video?.height !== OUTPUT_HEIGHT
 || Math.abs(Number(video?.avg_frame_rate?.split("/")[0]) / Number(video?.avg_frame_rate?.split("/")[1]) - 60) > 0.5
 || audio?.codec_name !== "aac" || !audible
 || !Number.isFinite(duration) || duration < 12) {
  throw Error("X11 capture quality gate failed; inspect report and recording");
}
