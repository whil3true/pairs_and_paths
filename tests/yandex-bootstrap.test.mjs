import assert from "node:assert/strict";
import test from "node:test";
import { createPlatform, YandexSdkUnavailableError, looksLikeYandexHost, YANDEX_SDK_PATH } from "../.test-dist/platform/createPlatform.js";
import { YandexPlatform } from "../.test-dist/platform/YandexPlatform.js";
import { hasInteractiveScene } from "../.test-dist/platform/GameReady.js";
import { WebPlatform } from "../.test-dist/platform/WebPlatform.js";
import { readFile } from "node:fs/promises";

const mock = () => {
  const subscriptions = new Map();
  let ready = 0;
  const sdk = {
    environment: { i18n: { lang: "ru" } },
    features: { LoadingAPI: { ready: () => { ready++; } } },
    on: (event, fn) => { subscriptions.set(event, fn); },
    off: (event, fn) => { if(subscriptions.get(event)===fn) subscriptions.delete(event); },
  };
  return {sdk, subscriptions, fire: e => subscriptions.get(e)?.(), countReady:()=>ready};
};

test("SDK is initialized through YandexPlatform, game ready is once-only", async () => {
  const m=mock();
  const result=await createPlatform({loadSdk:async()=>m.sdk,fallback:()=>new WebPlatform("en"),isYandexEnvironment:true});
  assert.ok(result instanceof YandexPlatform);
  assert.equal(result.id,"yandex");
  assert.equal(result.locale,"ru");
  assert.equal(m.subscriptions.size,2);
  result.ready();result.ready();
  assert.equal(m.countReady(),1);
  const calls=[];
  result.onPause(()=>calls.push("pause"));
  result.onResume(()=>calls.push("resume"));
  m.fire("game_api_pause");m.fire("game_api_pause");
  assert.equal(result.isPaused,true);
  m.fire("game_api_resume");m.fire("game_api_resume");
  assert.deepEqual(calls,["pause","resume"]);
  result.destroy();
  assert.equal(m.subscriptions.size,0);
});

test("late pause subscribers receive current paused state", () => {
  const m=mock(); const platform=new YandexPlatform(m.sdk);
  m.fire("game_api_pause");
  let called=0;
  platform.onPause(()=>called++);
  assert.equal(called,1);
  platform.destroy();
});

test("plain web falls back only if SDK script is absent, real Yandex failures remain visible", async () => {
  assert.equal(YANDEX_SDK_PATH,"/sdk.js");
  const missing=()=>Promise.reject(new YandexSdkUnavailableError("404"));
  const web=await createPlatform({loadSdk:missing,fallback:()=>new WebPlatform("en"),isYandexEnvironment:false});
  assert.equal(web.id,"web");
  await assert.rejects(createPlatform({loadSdk:missing,fallback:()=>new WebPlatform(),isYandexEnvironment:true}),/404/);
  await assert.rejects(createPlatform({loadSdk:()=>Promise.reject(Error("init failed")),fallback:()=>new WebPlatform(),isYandexEnvironment:false}),/init failed/);
  assert.equal(looksLikeYandexHost("yandex.ru"),true);
  assert.equal(looksLikeYandexHost("github.io"),false);
});

test("ready waits for interactive first scene, never BootScene alone", () => {
  assert.equal(hasInteractiveScene(["BootScene"]),false);
  assert.equal(hasInteractiveScene([]),false);
  assert.equal(hasInteractiveScene(["MainMenuScene"]),true);
  assert.equal(hasInteractiveScene(["BootScene","PlayScene"]),true);
  assert.equal(hasInteractiveScene(["SymbolGalleryScene"]),true);
});

test("bootstrap does not start scenes before platform init and does not invent advertising", async () => {
  const main=await readFile(new URL("../src/main.ts",import.meta.url),"utf8");
  assert.match(main,/const platform = await createPlatform\(\)/);
  assert.ok(main.indexOf("const platform = await createPlatform()")<main.indexOf("new AudioManager"));
  assert.ok(main.indexOf("const platform = await createPlatform()")<main.indexOf("new Phaser.Game"));
  assert.match(main,/attachGameReady\(game, platform\)/);
  assert.doesNotMatch(main,/showFullscreenAdv|showRewardedVideo/);
});
