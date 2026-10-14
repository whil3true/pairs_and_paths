import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = async (path) => readFile(new URL(`../src/${path}`, import.meta.url), "utf8");

test("Pause embeds two sliders directly and retains three original actions", async () => {
  const play = await source("game/PlayScene.ts");
  const pause = play.slice(play.indexOf("private showPauseMenu"), play.indexOf("private dismissPauseOverlay"));
  assert.match(pause, /createAudioVolumeSlider/);
  assert.equal((pause.match(/createAudioVolumeSlider\(this/g) ?? []).length, 2);
  assert.match(pause, /onChange: setMusicVolume/);
  assert.match(pause, /onChange: setSfxVolume/);
  for (const key of ["pauseResume", "pauseRestart", "pauseExit"]) assert.ok(pause.includes(key));
  assert.match(pause, /ordinaryPause \? PAUSE_LAYOUT\.audioPanel : PAUSE_LAYOUT\.panel/);
});

test("Main Menu sound access uses the same volume store without moving existing blocks", async () => {
  const menu = await source("game/MainMenuScene.ts");
  assert.match(menu, /MAIN_MENU_LAYOUT\.audioSettingsButton/);
  assert.match(menu, /createSettingsGearButton\(this/);
  assert.match(menu, /SETTINGS_GEAR_PNG_PATH/);
  const gear = await source("game/SettingsGearButton.ts");
  assert.match(gear, /setTintFill\(VISUAL_COLORS\.surface\.elevated\.phaser\)/);
  assert.match(gear, /fillStyle\(VISUAL_COLORS\.accent\.coral\.phaser/);
  assert.match(gear, /settings-gear\.png/);
  assert.match(menu, /private selectLocale\(next: SupportedLocale\)/);
  assert.match(menu, /localeStore\.save\(next\)/);
  assert.match(menu, /private openAudioSettings\(\)/);
  assert.match(menu, /const settings = getAudioSettings\(\)/);
  assert.equal((menu.match(/createAudioVolumeSlider\(this/g) ?? []).length, 2);
});

test("pointer dragging uses logical camera and releases listeners on destroy", async () => {
  const sourceCode = await source("game/AudioVolumeSlider.ts");
  assert.match(sourceCode, /getWorldPoint\(pointer\.x, pointer\.y\)/);
  assert.match(sourceCode, /scene\.input\.on\("pointermove", move\)/);
  assert.match(sourceCode, /scene\.input\.off\("pointermove", move\)/);
  assert.match(sourceCode, /container\.once\(Phaser\.GameObjects\.Events\.DESTROY/);
});

test("UI mixer delegates to persistent scene-independent AudioManager", async () => {
  const runtime = await source("audio/AudioRuntime.ts");
  assert.match(runtime, /activeManager\?\.getSettings\(\)/);
  assert.match(runtime, /activeManager\?\.setMusicVolume\(value\)/);
  assert.match(runtime, /activeManager\?\.setSfxVolume\(value\)/);
});
