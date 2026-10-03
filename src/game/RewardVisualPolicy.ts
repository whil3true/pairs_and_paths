export const REWARD_LAYOUT = Object.freeze({
  heading: Object.freeze({ centerX: 240, top: 32 }),
  chapter: Object.freeze({ centerX: 240, top: 76 }),
  artwork: Object.freeze({ x: 40, y: 124, width: 400, height: 400, centerX: 240, centerY: 324 }),
  continueButton: Object.freeze({ x: 72, y: 620, width: 336, height: 56, centerX: 240, centerY: 648 }),
});

export const REWARD_TRANSITION_DIM_ALPHA = 0.18;

export const COMPLETE_LAYOUT = Object.freeze({
  panel: Object.freeze({ centerX: 240, centerY: 410, width: 416, height: 360 }),
  titleY: 276,
  primaryY: 382,
  replayY: 450,
  menuY: 518,
  buttonWidth: 360,
  buttonHeight: 56,
});

export interface RewardMotionPolicy {
  readonly holdDuration: number;
  readonly transitionDuration: number;
  readonly spatialTravel: boolean;
}

export const getRewardMotionPolicy = (reducedMotion: boolean): RewardMotionPolicy => Object.freeze(
  reducedMotion
    ? { holdDuration: 250, transitionDuration: 150, spatialTravel: false }
    : { holdDuration: 500, transitionDuration: 320, spatialTravel: true },
);
