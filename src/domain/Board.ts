export interface GridPoint {
  readonly col: number;
  readonly row: number;
}

export type TileId = number;
export type Cell = TileId | null;

export const MAX_BOARD_WIDTH = 6;
export const MAX_BOARD_HEIGHT = 8;

const isTileId = (value: unknown): value is TileId =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

/** An immutable, row-major board. */
export class Board {
  readonly width: number;
  readonly height: number;
  readonly #cells: readonly Cell[];

  private constructor(width: number, height: number, cells: readonly Cell[]) {
    this.width = width;
    this.height = height;
    this.#cells = cells;
  }

  static fromRows(rows: readonly (readonly Cell[])[]): Board {
    if (rows.length < 1 || rows.length > MAX_BOARD_HEIGHT) {
      throw new RangeError(`Board height must be between 1 and ${MAX_BOARD_HEIGHT}`);
    }

    const firstRow = rows[0];
    if (firstRow === undefined || firstRow.length < 1 || firstRow.length > MAX_BOARD_WIDTH) {
      throw new RangeError(`Board width must be between 1 and ${MAX_BOARD_WIDTH}`);
    }

    const width = firstRow.length;
    const cells: Cell[] = [];
    for (const row of rows) {
      if (row.length !== width) throw new TypeError("Board rows must have equal lengths");
      for (const cell of row) {
        if (cell !== null && !isTileId(cell)) {
          throw new TypeError("Board cells must be null or positive integer tile IDs");
        }
        cells.push(cell);
      }
    }

    return new Board(width, rows.length, cells);
  }

  contains(point: GridPoint): boolean {
    return Number.isInteger(point.col) && Number.isInteger(point.row)
      && point.col >= 0 && point.col < this.width
      && point.row >= 0 && point.row < this.height;
  }

  tileAt(point: GridPoint): Cell {
    if (!this.contains(point)) throw new RangeError("Point is outside the board");
    return this.#cells[point.row * this.width + point.col] ?? null;
  }

  isEmpty(point: GridPoint): boolean {
    return this.tileAt(point) === null;
  }

  isOccupied(point: GridPoint): boolean {
    return this.tileAt(point) !== null;
  }

  withTile(point: GridPoint, tile: Cell): Board {
    if (!this.contains(point)) throw new RangeError("Point is outside the board");
    if (tile !== null && !isTileId(tile)) {
      throw new TypeError("A tile ID must be a positive integer");
    }
    const cells = [...this.#cells];
    cells[point.row * this.width + point.col] = tile;
    return new Board(this.width, this.height, cells);
  }
}
