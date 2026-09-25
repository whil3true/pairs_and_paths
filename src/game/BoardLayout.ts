import type { GridPoint } from "../domain/index.js";

export interface WorldPoint {
  readonly x: number;
  readonly y: number;
}

export interface BoardLayoutOptions {
  readonly sceneWidth: number;
  readonly sceneHeight: number;
  readonly boardWidth: number;
  readonly boardHeight: number;
}

/** Pure coordinate mapping for real board cells. */
export class BoardLayout {
  static readonly CELL_PITCH = 72;
  static readonly TILE_SIZE = 64;
  static readonly BOARD_AREA_CENTER_Y = 420;

  readonly pitch = BoardLayout.CELL_PITCH;
  readonly tileSize = BoardLayout.TILE_SIZE;
  readonly boardLeft: number;
  readonly boardTop: number;
  readonly boardRight: number;
  readonly boardBottom: number;

  constructor(readonly options: BoardLayoutOptions) {
    const { sceneWidth, boardWidth, boardHeight } = options;
    if (boardWidth < 1 || boardWidth > 6 || boardHeight < 1 || boardHeight > 8) {
      throw new RangeError("BoardLayout supports boards from 1x1 through 6x8");
    }
    this.boardLeft = (sceneWidth - boardWidth * this.pitch) / 2;
    this.boardTop = BoardLayout.BOARD_AREA_CENTER_Y - boardHeight * this.pitch / 2;
    this.boardRight = this.boardLeft + boardWidth * this.pitch;
    this.boardBottom = this.boardTop + boardHeight * this.pitch;
  }

  cellCenter(point: GridPoint): WorldPoint {
    if (point.col < 0 || point.col >= this.options.boardWidth
      || point.row < 0 || point.row >= this.options.boardHeight) {
      throw new RangeError("Cell is outside the real board");
    }
    return { x: this.boardLeft + (point.col + 0.5) * this.pitch,
      y: this.boardTop + (point.row + 0.5) * this.pitch };
  }
}
