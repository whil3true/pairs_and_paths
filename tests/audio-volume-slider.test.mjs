import assert from "node:assert/strict";
import test from "node:test";
import { AUDIO_SLIDER_TOUCH_HEIGHT, AUDIO_SLIDER_TRACK_INSET, audioSliderValueAtX, clampAudioSliderValue } from "../.test-dist/game/AudioVolumeSliderPolicy.js";
import { UI_STRINGS } from "../.test-dist/game/Localization.js";
import { PAUSE_LAYOUT } from "../.test-dist/game/PauseVisualPolicy.js";
import { MAIN_MENU_LAYOUT } from "../.test-dist/game/MainMenuVisualPolicy.js";

test("slider clamp and pointer coordinate mapping preserve 0, 100 and percent quantization", () => {
  assert.equal(clampAudioSliderValue(-10), 0);
  assert.equal(clampAudioSliderValue(2), 1);
  assert.equal(clampAudioSliderValue(Number.NaN), 0);
  assert.equal(AUDIO_SLIDER_TOUCH_HEIGHT, 48);
  const x = 240, width = 336, half = (width - 2 * AUDIO_SLIDER_TRACK_INSET) / 2;
  assert.equal(audioSliderValueAtX(x - half, x, width), 0);
  assert.equal(audioSliderValueAtX(x, x, width), 0.5);
  assert.equal(audioSliderValueAtX(x + half, x, width), 1);
  assert.equal(audioSliderValueAtX(x - 1000, x, width), 0);
  assert.equal(audioSliderValueAtX(x + 1000, x, width), 1);
  assert.equal(audioSliderValueAtX(Number.NaN, x, width), 0);
  assert.equal(audioSliderValueAtX(x, x, 30), 0);
});

test("expanded Pause contains two controls and 3 touch buttons within 480x800", () => {
  const { audioPanel, audioSliderCenters, audioButtonCenters } = PAUSE_LAYOUT;
  const top = audioPanel.centerY - audioPanel.height / 2;
  const bottom = audioPanel.centerY + audioPanel.height / 2;
  assert.equal(audioSliderCenters.length, 2);
  assert.equal(audioButtonCenters.length, 3);
  assert.ok(top > 0 && bottom < 800);
  assert.ok(audioSliderCenters[1] + 36 < audioButtonCenters[0] - 26);
  for (const y of audioButtonCenters) assert.ok(y - 26 > top && y + 26 < bottom);
  assert.ok(audioSliderCenters[0] + 38 < audioSliderCenters[1] - 38);
  assert.equal(PAUSE_LAYOUT.panel.height, 360, "confirmation panel stays unchanged");
});

test("Main Menu sound button fits below the approved progress card", () => {
  const menu = MAIN_MENU_LAYOUT;
  assert.ok(menu.audioSettingsButton.centerY - 24 > menu.progress.y + menu.progress.height);
  assert.ok(menu.audioSettingsButton.centerY + 24 < 800);
  assert.equal(menu.preview.y, 194);
  assert.equal(menu.primary.y, 450);
});

test("audio labels are localized in RU/EN", () => {
  assert.deepEqual(
    [UI_STRINGS.ru.audioSettings, UI_STRINGS.ru.audioMusic, UI_STRINGS.ru.audioEffects, UI_STRINGS.ru.audioClose],
    ["Звук", "Музыка", "Эффекты", "Закрыть"],
  );
  assert.deepEqual(
    [UI_STRINGS.en.audioSettings, UI_STRINGS.en.audioMusic, UI_STRINGS.en.audioEffects, UI_STRINGS.en.audioClose],
    ["Sound", "Music", "Effects", "Close"],
  );
});
