import { BoardLayout } from "./BoardLayout.js";
import { BORDERS, COMPONENT_RADII, VISUAL_COLORS } from "./VisualTokens.js";

export const BOARD_FRAME_PADDING = 8;
export const BOARD_SHEET_OFFSET = 7;

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

export const BOARD_VISUAL_STYLE = Object.freeze({
  framePadding: BOARD_FRAME_PADDING,
  sheetOffset: BOARD_SHEET_OFFSET,
  outerRadius: COMPONENT_RADII.boardOuter,
  innerRadius: COMPONENT_RADII.boardInner,
  borderWidth: BORDERS.structural,
  frameFill: VISUAL_COLORS.border.strong.phaser,
  interiorFill: VISUAL_COLORS.surface.board.phaser,
  backingFill: VISUAL_COLORS.surface.elevated.phaser,
  backingBorder: VISUAL_COLORS.border.soft.phaser,
});
