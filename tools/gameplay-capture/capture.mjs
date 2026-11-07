import { chromium } from "playwright";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";

const URL = "https://whil3true.github.io/pairs_and_paths/";
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 60;
const OUTPUT = path.resolve("capture-output");
const RAW_VIDEO = path.join(OUTPUT, "gameplay-source.webm");
const VIDEO = path.join(OUTPUT, "cozy-gallery-mobile-1080x1920-60fps-audio.mp4");
await mkdir(OUTPUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist",
    "--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
});

// Capture-only instrumentation, evaluated before existing game JS. No game code
// or persistent host state is changed. Mirror Web Audio SFX plus HTML music
// into ONE MediaStream destination, while retaining normal speaker output.
await context.addInitScript(() => {
  const NativeAudio = window.Audio;
  const NativeAudioContext = window.AudioContext;
  const nativeConnect = AudioNode.prototype.connect;
  const mediaElements = [];
  let audioTap = null;
  const attach = (element) => {
    if (!audioTap || audioTap.attached.has(element)) return;
    try {
      const source = audioTap.context.createMediaElementSource(element);
      // Our connect hook mirrors the sound into the capture destination.
      source.connect(audioTap.context.destination);
      audioTap.attached.add(element);
    } catch (error) {
      audioTap.attachFailures.push(String(error));
    }
  };
  AudioNode.prototype.connect = function (...args) {
    const result = nativeConnect.apply(this, args);
    if (audioTap && this.context === audioTap.context &&
      args[0] === audioTap.context.destination) {
      nativeConnect.call(this, audioTap.captureDestination);
      audioTap.mirroredConnections++;
    }
    return result;
  };
  window.Audio = new Proxy(NativeAudio, {
    construct(target, args) {
      const audio = Reflect.construct(target, args);
      mediaElements.push(audio);
      attach(audio);
      return audio;
    },
  });
  window.AudioContext = new Proxy(NativeAudioContext, {
    construct(target, args) {
      const context = Reflect.construct(target, args);
      if (!audioTap) {
        audioTap = {
          context,
          captureDestination: context.createMediaStreamDestination(),
          attached: new WeakSet(),
          attachedCount: 0,
          attachFailures: [],
          mirroredConnections: 0,
        };
        for (const element of mediaElements) attach(element);
      }
      return context;
    },
  });
  // The game creates the AudioContext only once at bootstrap.
  Object.defineProperty(window, "__cozyCaptureAudio", {
    get: () => audioTap,
    configurable: false,
  });
});

const page = await context.newPage();
const logs = [];
page.on("pageerror", (err) => logs.push("pageerror: " + err.message));
page.on("console", (entry) => {
  if (entry.type() === "error") logs.push("console error: " + entry.text());
});
const canvas = page.locator("#game canvas");
let completedThroughLevel = 0;
let failure = null;
let captured = false;
let recorderInfo = null;
let rafStats = null;

async function tapWorld(x, y) {
  const r = await canvas.boundingBox();
  if (!r || r.width <= 0 || r.height <= 0) throw Error("Game canvas is missing or has zero size");
  // Production scene 480x800 is centered in an expanding Phaser canvas.
  const scale = r.width / 480;
  const px = r.x + r.width / 2 + (x - 240) * scale;
  const py = r.y + r.height / 2 + (y - 400) * scale;
  if (px < r.x || py < r.y || px >= r.x + r.width || py >= r.y + r.height) {
    throw Error("Logical tap falls outside the canvas");
  }
  await page.touchscreen.tap(px, py);
}

async function witnessForLevel(levelNumber) {
  // Existing shipped deterministic witness chooses legal moves; the browser
  // still receives real touchscreen gestures for each actual pair.
  return page.evaluate(async (number) => {
    const moduleUrl = new globalThis.URL("./js/game/LevelSequence.js", document.baseURI).href;
    const { createLevelStage, getStageCount } = await import(moduleUrl);
    if (getStageCount(number) !== 1) throw Error("Pilot supports single-stage levels only");
    const generated = createLevelStage(number, 0);
    return generated.witness.map((move) => ({ start: move.start, end: move.end }));
  }, levelNumber);
}

async function startRecording() {
  return page.evaluate(() => {
    const canvas = document.querySelector("#game canvas");
    const audio = window.__cozyCaptureAudio;
    if (!(canvas instanceof HTMLCanvasElement)) throw Error("Game canvas not found");
    if (!audio || audio.captureDestination.stream.getAudioTracks().length !== 1) {
      throw Error("Browser audio tap was not initialized");
    }
    const video = canvas.captureStream(60);
    const stream = new MediaStream([
      ...video.getVideoTracks(), ...audio.captureDestination.stream.getAudioTracks(),
    ]);
    if (stream.getVideoTracks().length !== 1 || stream.getAudioTracks().length !== 1) {
      throw Error("Expected exactly one real video and one real audio track");
    }
    const mime = ["video/webm;codecs=vp8,opus", "video/webm"].find(
      (candidate) => MediaRecorder.isTypeSupported(candidate),
    );
    if (!mime) throw Error("Chromium MediaRecorder has no WebM/Opus support");
    const chunks = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: mime, videoBitsPerSecond: 9_000_000, audioBitsPerSecond: 160_000,
    });
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = (event) => {
      window.__cozyRecorderError = String(event.error ?? "MediaRecorder error");
    };
    let lastRaf = 0;
    let frames = 0;
    let gapsOver25ms = 0;
    let gapsOver40ms = 0;
    let largestGapMs = 0;
    const sample = (now) => {
      if (!window.__cozyRecord) return;
      if (lastRaf > 0) {
        const gap = now - lastRaf;
        if (gap > 25) gapsOver25ms++;
        if (gap > 40) gapsOver40ms++;
        largestGapMs = Math.max(largestGapMs, gap);
      }
      lastRaf = now;
      frames++;
      requestAnimationFrame(sample);
    };
    window.__cozyRecord = { recorder, chunks, stream, audio, getRaf: () => ({
      frames, gapsOver25ms, gapsOver40ms, largestGapMs: Math.round(largestGapMs * 10) / 10,
    }) };
    recorder.start(1000);
    requestAnimationFrame(sample);
    return {
      sourceCanvasWidth: canvas.width, sourceCanvasHeight: canvas.height,
      videoTrack: stream.getVideoTracks()[0].getSettings(),
      audioTrack: stream.getAudioTracks()[0].getSettings(),
      audioContextState: audio.context.state,
      musicElementsAttached: audio.attached.size === undefined ? "tracked via WeakSet" : audio.attached.size,
      mirroredConnectionsAtStart: audio.mirroredConnections,
      musicAttachFailures: audio.attachFailures,
      mime,
    };
  });
}

async function finishRecording() {
  const result = await page.evaluate(async () => {
    const state = window.__cozyRecord;
    if (!state) throw Error("Capture was never started");
    const { recorder, chunks, stream, getRaf, audio } = state;
    const resultPromise = new Promise((resolve, reject) => {
      recorder.addEventListener("stop", resolve, { once: true });
      recorder.addEventListener("error", () => reject(Error("MediaRecorder failed")), { once: true });
    });
    if (recorder.state !== "inactive") recorder.stop();
    await resultPromise;
    window.__cozyRecord = null;
    stream.getVideoTracks().forEach((t) => t.stop());
    const data = new Uint8Array(await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer());
    let base64 = "";
    for (let i = 0; i < data.length; i += 32768) {
      base64 += btoa(String.fromCharCode(...data.subarray(i, i + 32768)));
    }
    return {
      base64,
      bytes: data.byteLength,
      raf: getRaf(),
      mirroredConnections: audio.mirroredConnections,
      attachedMusicElements: audio.attachedCount,
      attachFailures: audio.attachFailures,
      contextState: audio.context.state,
      error: window.__cozyRecorderError || null,
    };
  });
  if (!result.bytes || result.error) throw Error("MediaRecorder empty or failed: " + result.error);
  await writeFile(RAW_VIDEO, Buffer.from(result.base64, "base64"));
  const { base64, ...metadata } = result;
  return metadata;
}

try {
  const response = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (!response || !response.ok()) throw Error("GitHub Pages did not respond successfully");
  await canvas.waitFor({ state: "visible", timeout: 45000 });
  await page.waitForTimeout(2600);
  await tapWorld(240, 482); // Main Menu → Play.
  await page.waitForTimeout(2200);
  recorderInfo = await startRecording();

  for (const levelNumber of [1, 2]) {
    const moves = await witnessForLevel(levelNumber);
    if (moves.length < 3) throw Error("Unexpected level witness");
    for (const move of moves) {
      await tapWorld(240 - 2 * 64 + (move.start.col + 0.5) * 64,
        420 - 2 * 64 + (move.start.row + 0.5) * 64);
      await page.waitForTimeout(250);
      await tapWorld(240 - 2 * 64 + (move.end.col + 0.5) * 64,
        420 - 2 * 64 + (move.end.row + 0.5) * 64);
      await page.waitForTimeout(1050);
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
    await page.waitForTimeout(1500);
    if (levelNumber === 1) {
      await tapWorld(240, 648); // Reward Continue.
      await page.waitForTimeout(500);
      await tapWorld(240, 382); // Complete → Next. Standalone web needs no ad.
      await page.waitForTimeout(2200);
    }
  }
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(OUTPUT, "last-frame.png") });
  rafStats = await finishRecording();
  captured = true;
} catch (err) {
  failure = err;
  try { await page.screenshot({ path: path.join(OUTPUT, "failure.png") }); }
  catch { /* Browser may be gone. */ }
  // Salvage a partial real recording for diagnosis.
  if (!captured) {
    try { rafStats = await finishRecording(); } catch (error) {
      logs.push("salvage failed: " + String(error));
    }
  }
} finally {
  await context.close();
  await browser.close();
}

if (failure) {
  await writeFile(path.join(OUTPUT, "failure.json"), JSON.stringify({
    error: String(failure), completedThroughLevel, capture: recorderInfo,
    recorder: rafStats, console: logs,
  }, null, 2));
  throw failure;
}

// Preserve real browser frames and browser-mixed audio. FFmpeg only encodes,
// scales, and makes the output constant 60 FPS. It cannot create missing motion.
execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", RAW_VIDEO, "-vf", "scale=1080:1920:flags=lanczos,setsar=1",
  "-fps_mode", "cfr", "-r", "60", "-c:v", "libx264",
  "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "160k", VIDEO,
], { stdio: "inherit", timeout: 180000 });

const probeVideo = (file) => JSON.parse(execFileSync("ffprobe", [
  "-v", "error", "-count_frames",
  "-show_entries", "stream=index,codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames",
  "-show_entries", "format=duration", "-of", "json", file,
], { encoding: "utf8" }));
const srcProbe = probeVideo(RAW_VIDEO);
const probe = probeVideo(VIDEO);
const stream = probe.streams?.find((s) => s.codec_type === "video");
const audioStream = probe.streams?.find((s) => s.codec_type === "audio");
const srcStream = srcProbe.streams?.find((s) => s.codec_type === "video");
const duration = Number(probe.format?.duration);
const sourceDuration = Number(srcProbe.format?.duration);
const sourceFrameCount = Number(srcStream?.nb_read_frames);
const sourceFpsEffective = Number.isFinite(sourceFrameCount) && sourceDuration > 0
  ? sourceFrameCount / sourceDuration : null;

const audioCheck = spawnSync("ffmpeg", [
  "-hide_banner", "-i", VIDEO, "-vn", "-af", "volumedetect", "-f", "null", "-",
], { encoding: "utf8", timeout: 30000 });
const maxVolume = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(audioCheck.stderr)?.[1]);
const audioAudible = audioCheck.status === 0 && Number.isFinite(maxVolume) && maxVolume > -55;
const encodingPass = stream?.width === WIDTH && stream?.height === HEIGHT
  && stream?.codec_name === "h264" && stream?.avg_frame_rate === "60/1"
  && audioStream?.codec_name === "aac" && duration >= 12;
const report = {
  source: URL,
  method: "Chromium canvas.captureStream(60) + real HTMLAudio/WebAudio capture, MediaRecorder, FFmpeg",
  output: { width: stream?.width, height: stream?.height, fps: stream?.avg_frame_rate,
    durationSeconds: duration, audioCodec: audioStream?.codec_name,
    audioMaxDb: maxVolume, fileBytes: (await stat(VIDEO)).size },
  sourceVideo: { width: recorderInfo.sourceCanvasWidth, height: recorderInfo.sourceCanvasHeight,
    frames: sourceFrameCount, durationSeconds: sourceDuration, effectiveFps: sourceFpsEffective },
  audio: { contextStateAtStart: recorderInfo.audioContextState,
    musicAttachFailures: rafStats?.attachFailures,
    mirroredConnections: rafStats?.mirroredConnections,
    maxDb: maxVolume, nonSilent: audioAudible },
  animation: rafStats?.raf,
  completedThroughLevel, sourceVersion: "deployed dev GitHub Pages",
  caveat: "Constant-60 export may duplicate browser frames; source effective FPS and RAF gaps show performance.",
  console: logs,
};
await writeFile(path.join(OUTPUT, "capture-report.json"), JSON.stringify(report, null, 2));
console.log("CAPTURE_RESULT " + JSON.stringify(report));
if (!encodingPass || !audioAudible) {
  throw Error("Capture quality gate failed: invalid 60 FPS H.264/AAC export or silent audio");
}
