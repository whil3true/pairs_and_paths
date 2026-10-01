import { BoardLayout } from "./BoardLayout.js";
import { BORDERS, COMPONENT_RADII, VISUAL_COLORS } from "./VisualTokens.js";

export const BOARD_FRAME_PADDING = 8;
export const BOARD_ARTWORK_APERTURE_INSET = 2;
export const BOARD_ARTWORK_APERTURE_RADIUS = 20;
export const BOARD_SHEET_OFFSET_X = 0;
export const BOARD_SHEET_OFFSET_Y = 7;
export const BOARD_SHEET_SHADE_ALPHA = Object.freeze([0, 0.10, 0.18] as const);

export const getBackingSheetShadeAlpha = (depth: number): number => {
  if (!Number.isInteger(depth) || depth < 0 || depth >= BOARD_SHEET_SHADE_ALPHA.length) {
    throw new RangeError(`Board sheet depth must be 0..${BOARD_SHEET_SHADE_ALPHA.length - 1}`);
  }
  return BOARD_SHEET_SHADE_ALPHA[depth]!;
};

export interface VisualBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly centerY: number;
}

const bounds = (left: number, top: number, right: number, bottom: number): VisualBounds => Object.freeze({
  left, top, right, bottom,
  width: right - left,
  height: bottom - top,
  centerX: (left + right) / 2,
  centerY: (top + bottom) / 2,
});

export const getBoardContentBounds = (layout: BoardLayout): VisualBounds =>
  bounds(layout.boardLeft, layout.boardTop, layout.boardRight, layout.boardBottom);

export const getBoardFrameBounds = (layout: BoardLayout): VisualBounds => {
  const content = getBoardContentBounds(layout);
  return bounds(
    content.left - BOARD_FRAME_PADDING,
    content.top - BOARD_FRAME_PADDING,
    content.right + BOARD_FRAME_PADDING,
    content.bottom + BOARD_FRAME_PADDING,
  );
};

export const getBoardArtworkApertureBounds = (layout: BoardLayout): VisualBounds => {
  const content = getBoardContentBounds(layout);
  return bounds(
    content.left + BOARD_ARTWORK_APERTURE_INSET,
    content.top + BOARD_ARTWORK_APERTURE_INSET,
    content.right - BOARD_ARTWORK_APERTURE_INSET,
    content.bottom - BOARD_ARTWORK_APERTURE_INSET,
  );
};

export const BOARD_VISUAL_STYLE = Object.freeze({
  framePadding: BOARD_FRAME_PADDING,
  sheetOffsetX: BOARD_SHEET_OFFSET_X,
  sheetOffsetY: BOARD_SHEET_OFFSET_Y,
  outerRadius: COMPONENT_RADII.boardOuter,
  innerRadius: COMPONENT_RADII.boardInner,
  borderWidth: BORDERS.structural,
  outlineInset: BORDERS.structural / 2,
  outlineRadius: COMPONENT_RADII.boardOuter - BORDERS.structural / 2,
  frameFill: VISUAL_COLORS.surface.elevated.phaser,
  frameBorder: VISUAL_COLORS.border.strong.phaser,
  interiorFill: VISUAL_COLORS.surface.board.phaser,
  backingFill: VISUAL_COLORS.surface.elevated.phaser,
  sheetShade: VISUAL_COLORS.border.strong.phaser,
});
