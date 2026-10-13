/** Approved sound-plan filenames. Assets will be committed in the dedicated binary-asset PR. */
export const AUDIO_EFFECTS = Object.freeze({
  uiClick: "assets/audio/click_003.ogg",
  tileFirst: "assets/audio/drop_003.ogg",
  tileSecond: "assets/audio/drop_002.ogg",
  pairSuccess: "assets/audio/drop_004.ogg",
  pairInvalid: "assets/audio/bong_001.ogg",
  levelComplete: "assets/audio/jingles_PIZZI10.ogg",
});

export type AudioEffect = keyof typeof AUDIO_EFFECTS;

export const AUDIO_MUSIC = Object.freeze([
  Object.freeze({ id: "forget-me-not", path: "assets/audio/forget_me_not_in_f_major_looped.ogg" }),
  Object.freeze({ id: "porcelain-hours", path: "assets/audio/porcelain_hours.mp3" }),
] as const);

export const AUDIO_EFFECT_GAIN: Readonly<Record<AudioEffect, number>> = Object.freeze({
  uiClick: 0.9,
  tileFirst: 0.8,
  tileSecond: 0.8,
  pairSuccess: 0.8,
  pairInvalid: 0.65,
  levelComplete: 0.85,
});
