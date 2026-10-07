import type { LevelState } from "./CampaignNavigation.js";
import { VISUAL_COLORS } from "./VisualTokens.js";

export const LEVEL_SELECT_LAYOUT = Object.freeze({
  header: Object.freeze({
    chapterLabelTop: 22, chapterTitleTop: 46, progressTop: 82,
    chapterLabelLineHeight: 20, chapterTitleLineHeight: 30, progressLineHeight: 24,
  }),
  banner: Object.freeze({ x: 24, y: 116, width: 432, height: 164 }),
  previous: Object.freeze({ centerX: 48, centerY: 316, width: 48, height: 48 }),
  next: Object.freeze({ centerX: 432, centerY: 316, width: 48, height: 48 }),
  grid: Object.freeze({ x: 24, y: 352, columns: 5, rows: 2, cardSize: 72, columnGap: 18, rowGap: 24 }),
  back: Object.freeze({ x: 24, y: 708, width: 432, height: 56 }),
});

export const getLevelCardBounds = (index: number) => {
  if (!Number.isSafeInteger(index) || index < 0 || index >= 10) throw new RangeError("index must be 0 through 9");
  const { x, y, columns, cardSize, columnGap, rowGap } = LEVEL_SELECT_LAYOUT.grid;
  const column = index % columns, row = Math.floor(index / columns);
  return Object.freeze({ x: x + column * (cardSize + columnGap), y: y + row * (cardSize + rowGap), width: cardSize, height: cardSize });
};

export interface LevelCardGeometry {
  readonly centerX: number;
  readonly centerY: number;
  readonly interactiveWidth: number;
  readonly interactiveHeight: number;
}

/** Matches Phaser's centered display-origin mapping for a sized Container. */
export const getLevelCardGeometry = (bounds: Readonly<{ x: number; y: number; width: number; height: number }>): LevelCardGeometry =>
  Object.freeze({
    centerX: bounds.x + bounds.width / 2,
    centerY: bounds.y + bounds.height / 2,
    interactiveWidth: bounds.width,
    interactiveHeight: bounds.height,
  });

export interface LevelCardVisual {
  readonly fill: number; readonly border: number; readonly borderWidth: number;
  readonly affordance: "check" | "tab" | "lock"; readonly selectable: boolean; readonly numberSize: 20 | 22;
}

export const resolveLevelCardVisual = (state: LevelState): LevelCardVisual => state === "completed" ? {
  fill: VISUAL_COLORS.state.selectedFill.phaser, border: VISUAL_COLORS.state.success.phaser,
  borderWidth: 0, affordance: "check", selectable: true, numberSize: 22,
} : state === "available" ? {
  fill: VISUAL_COLORS.state.hintFill.phaser, border: VISUAL_COLORS.accent.gold.phaser,
  borderWidth: 0, affordance: "tab", selectable: true, numberSize: 22,
} : {
  fill: VISUAL_COLORS.state.lockedFill.phaser, border: VISUAL_COLORS.state.locked.phaser,
  borderWidth: 0, affordance: "lock", selectable: false, numberSize: 20,
};

export const canNavigateChapter = (chapter: number) => Object.freeze({ previous: chapter > 1, next: chapter < 10 });
