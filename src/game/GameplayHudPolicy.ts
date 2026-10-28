export const COMPACT_HUD_ASSET_ROOT = "assets/ui/compact-hud-v1";

export const COMPACT_HUD_ASSETS = Object.freeze({
  button: Object.freeze({ key: "compact-hud-button-base", path: `${COMPACT_HUD_ASSET_ROOT}/ui-button-base.png` }),
  statChip: Object.freeze({ key: "compact-hud-stat-chip-base", path: `${COMPACT_HUD_ASSET_ROOT}/ui-stat-chip-base.png` }),
  stagePill: Object.freeze({ key: "compact-hud-stage-pill-base", path: `${COMPACT_HUD_ASSET_ROOT}/ui-stage-pill-base.png` }),
  stageDotActive: Object.freeze({ key: "compact-hud-stage-dot-active", path: `${COMPACT_HUD_ASSET_ROOT}/ui-stage-dot-active.png` }),
  stageDotInactive: Object.freeze({ key: "compact-hud-stage-dot-inactive", path: `${COMPACT_HUD_ASSET_ROOT}/ui-stage-dot-inactive.png` }),
});

export interface GameplayHudBounds {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
}

const bounds = (left: number, top: number, width: number, height: number): GameplayHudBounds => Object.freeze({
  left, top, width, height, centerX: left + width / 2, centerY: top + height / 2,
});

const MULTI_STAGE_LAYOUT = Object.freeze({
  pause: bounds(24, 20, 48, 48),
  level: bounds(78, 16, 104, 56),
  stage: bounds(188, 16, 104, 56),
  remaining: bounds(298, 16, 104, 56),
  hint: bounds(408, 20, 48, 48),
});

const SINGLE_STAGE_LAYOUT = Object.freeze({
  pause: bounds(24, 20, 48, 48),
  level: bounds(115, 16, 104, 56),
  stage: bounds(188, 16, 104, 56),
  remaining: bounds(261, 16, 104, 56),
  hint: bounds(408, 20, 48, 48),
});

export type GameplayHudLayout = typeof MULTI_STAGE_LAYOUT;

/** Deterministic 480x800 layout. The hidden stage slot is closed symmetrically for single-stage levels. */
export const getGameplayHudLayout = (stageCount: number): GameplayHudLayout =>
  stageCount > 1 ? MULTI_STAGE_LAYOUT : SINGLE_STAGE_LAYOUT;

export const shouldShowStageIndicator = (stageCount: number): boolean => stageCount > 1;

export const getStageDotStates = (stageIndex: number, stageCount: number): readonly boolean[] => {
  if (!Number.isSafeInteger(stageCount) || stageCount < 1) {
    throw new RangeError("stageCount must be a positive integer");
  }
  if (!Number.isSafeInteger(stageIndex) || stageIndex < 0 || stageIndex >= stageCount) {
    throw new RangeError("stageIndex must identify a stage");
  }
  return Object.freeze(Array.from({ length: stageCount }, (_, index) => index <= stageIndex));
};

export const GAMEPLAY_HUD = Object.freeze({
  multiStage: MULTI_STAGE_LAYOUT,
  singleStage: SINGLE_STAGE_LAYOUT,
  statNineSlice: Object.freeze({
    sourceWidth: 256, sourceHeight: 112, leftWidth: 56, rightWidth: 56,
    topHeight: 40, bottomHeight: 40, objectWidth: 208, objectHeight: 112, scale: 0.5,
  }),
  stageNineSlice: Object.freeze({
    sourceWidth: 224, sourceHeight: 88, leftWidth: 44, rightWidth: 44,
    topHeight: 32, bottomHeight: 32, objectWidth: 208, objectHeight: 112, scale: 0.5,
  }),
  statLabelY: -9,
  statValueY: 7,
  stageLabelY: -8,
  stageDotsY: 8,
  buttonSize: 48,
  stageDotSize: 8,
  stageDotGap: 4,
});
