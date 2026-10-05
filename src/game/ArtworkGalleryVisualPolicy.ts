export interface VisualBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const ARTWORK_GALLERY_LAYOUT = Object.freeze({
  header: Object.freeze({ titleX: 24, top: 28, countX: 456 }),
  previous: Object.freeze({ centerX: 48, centerY: 116, width: 48, height: 48 }),
  next: Object.freeze({ centerX: 432, centerY: 116, width: 48, height: 48 }),
  grid: Object.freeze({ columns: 5, rows: 2, cardSize: 72, firstCenterX: 60, columnStep: 90,
    rowTops: Object.freeze([176, 292] as const), labelOffset: 86 }),
  progress: Object.freeze({ x: 24, y: 432, width: 432, height: 104 }),
  back: Object.freeze({ x: 24, y: 708, width: 432, height: 56 }),
});

export const ARTWORK_FULL_VIEW_LAYOUT = Object.freeze({
  back: Object.freeze({ x: 24, y: 20, width: 48, height: 48 }),
  artwork: Object.freeze({ x: 40, y: 156, width: 400, height: 400 }),
});

export const getArtworkGallerySlotBounds = (index: number): VisualBounds => {
  const { columns, rows, cardSize, firstCenterX, columnStep, rowTops } = ARTWORK_GALLERY_LAYOUT.grid;
  if (!Number.isSafeInteger(index) || index < 0 || index >= columns * rows) {
    throw new RangeError("Gallery slot index must be an integer from 0 through 9");
  }
  const column = index % columns;
  const row = Math.floor(index / columns);
  return { x: firstCenterX + column * columnStep - cardSize / 2, y: rowTops[row]!, width: cardSize, height: cardSize };
};
