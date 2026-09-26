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
  readonly #blocked: ReadonlySet<number>;

  private constructor(width: number, height: number, cells: readonly Cell[], blocked: ReadonlySet<number>) {
    this.width = width;
    this.height = height;
    this.#cells = cells;
    this.#blocked = blocked;
  }

  static fromRows(rows: readonly (readonly Cell[])[], blockedCells: readonly GridPoint[] = []): Board {
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

    const blocked = new Set<number>();
    for (const point of blockedCells) {
      if (!Number.isInteger(point.col) || !Number.isInteger(point.row)
          || point.col < 0 || point.col >= width || point.row < 0 || point.row >= rows.length) {
        throw new RangeError("Blocked point is outside the board");
      }
      const index = point.row * width + point.col;
      if (blocked.has(index)) throw new TypeError("Blocked points must be unique");
      if (cells[index] !== null) throw new TypeError("A blocked cell cannot contain a tile");
      blocked.add(index);
    }
    return new Board(width, rows.length, cells, blocked);
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
    return !this.isBlocked(point) && this.tileAt(point) === null;
  }

  isOccupied(point: GridPoint): boolean {
    return this.tileAt(point) !== null;
  }

  isBlocked(point: GridPoint): boolean {
    if (!this.contains(point)) throw new RangeError("Point is outside the board");
    return this.#blocked.has(point.row * this.width + point.col);
  }

  blockedCells(): GridPoint[] {
    return [...this.#blocked].sort((a, b) => a - b)
      .map((index) => ({ col: index % this.width, row: Math.floor(index / this.width) }));
  }

  hasTiles(): boolean {
    return this.#cells.some((cell) => cell !== null);
  }

  /** Returns a detached row-major snapshot. */
  toRows(): Cell[][] {
    return Array.from({ length: this.height }, (_, row) =>
      Array.from({ length: this.width }, (_, col) => this.#cells[row * this.width + col] ?? null));
  }

  withTile(point: GridPoint, tile: Cell): Board {
    if (!this.contains(point)) throw new RangeError("Point is outside the board");
    if (tile !== null && !isTileId(tile)) {
      throw new TypeError("A tile ID must be a positive integer");
    }
    if (tile !== null && this.isBlocked(point)) throw new Error("A blocked cell cannot contain a tile");
    const cells = [...this.#cells];
    cells[point.row * this.width + point.col] = tile;
    return new Board(this.width, this.height, cells, this.#blocked);
  }
}
