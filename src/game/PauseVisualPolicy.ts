export const PAUSE_LAYOUT = Object.freeze({
  panel: Object.freeze({ centerX: 240, centerY: 400, width: 416, height: 360 }),
  title: Object.freeze({ centerX: 240, centerY: 278 }),
  body: Object.freeze({ centerX: 240, centerY: 330 }),
  button: Object.freeze({ centerX: 240, width: 368, height: 52, gap: 12 }),
  pauseButtonCenters: Object.freeze([360, 424, 488] as const),
  confirmationButtonCenters: Object.freeze({ safe: 420, danger: 484 }),
});

export interface PauseMotionPolicy {
  readonly enterDuration: number;
  readonly exitDuration: number;
}

export const getPauseMotionPolicy = (reducedMotion: boolean): PauseMotionPolicy => Object.freeze(
  reducedMotion
    ? { enterDuration: 100, exitDuration: 80 }
    : { enterDuration: 200, exitDuration: 160 },
);
