import { applyMove, findPath, type Board, type GridPoint, type LegalMove } from "../domain/index.js";
import type { PlatformService } from "../platform/PlatformService.js";
import { BoardLayout } from "./BoardLayout.js";
import { createDemoLevel, DEV_DEMO_CONFIG } from "./DemoLevel.js";

interface TileVisual {
  readonly card: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

const keyOf = ({ col, row }: GridPoint): string => `${col},${row}`;
const samePoint = (left: GridPoint, right: GridPoint): boolean =>
  left.col === right.col && left.row === right.row;

export class PlayScene extends Phaser.Scene {
  private board!: Board;
  private layout!: BoardLayout;
  private selected: GridPoint | null = null;
  private inputLocked = false;
  private readonly tiles = new Map<string, TileVisual>();
  private route!: Phaser.GameObjects.Graphics;
  private remainingText!: Phaser.GameObjects.Text;
  private completeOverlay: Phaser.GameObjects.Container | null = null;

  constructor(private readonly platform: PlatformService) {
    super({ key: "PlayScene" });
  }

  create(): void {
    this.add.text(240, 30, "Pairs & Paths", {
      color: "#f7fbff", fontFamily: "Arial, sans-serif", fontSize: "32px", fontStyle: "bold",
    }).setOrigin(0.5);
    this.remainingText = this.add.text(240, 76, "", {
      color: "#bcd1ec", fontFamily: "Arial, sans-serif", fontSize: "20px",
    }).setOrigin(0.5);
    this.add.text(240, 766, `Prototype · ${this.platform.displayName} · seed ${DEV_DEMO_CONFIG.seed}`, {
      color: "#6f86a5", fontFamily: "Arial, sans-serif", fontSize: "13px",
    }).setOrigin(0.5);
    this.route = this.add.graphics().setDepth(20);
    this.startLevel();
  }

  private startLevel(): void {
    this.completeOverlay?.destroy(true);
    this.completeOverlay = null;
    this.route.clear();
    this.selected = null;
    this.inputLocked = false;
    for (const visual of this.tiles.values()) {
      visual.card.destroy();
      visual.label.destroy();
    }
    this.tiles.clear();
    this.children.list.filter((child) => child.name === "board-cell").forEach((child) => child.destroy());

    const level = createDemoLevel();
    this.board = level.board;
    this.layout = new BoardLayout({
      sceneWidth: Number(this.scale.width), sceneHeight: Number(this.scale.height),
      boardWidth: this.board.width, boardHeight: this.board.height,
    });
    this.renderBoard();
    this.updateRemaining();
  }

  private renderBoard(): void {
    for (let row = 0; row < this.board.height; row += 1) for (let col = 0; col < this.board.width; col += 1) {
      const point = { col, row };
      const { x, y } = this.layout.cellCenter(point);
      this.add.rectangle(x, y, 64, 64, 0x1a2941, 0.52)
        .setStrokeStyle(1, 0x324663, 0.65).setName("board-cell");
      this.add.zone(x, y, this.layout.pitch - 2, this.layout.pitch - 2)
        .setName("board-cell").setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.onCellTapped(point));
      const tileId = this.board.tileAt(point);
      if (tileId !== null) this.createTile(point, tileId);
    }
  }

  private createTile(point: GridPoint, tileId: number): void {
    const { x, y } = this.layout.cellCenter(point);
    const hue = (tileId * 47) % 360;
    const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.55, 0.48).color;
    const card = this.add.rectangle(x, y, this.layout.tileSize, this.layout.tileSize, color)
      .setStrokeStyle(3, 0xe8f3ff).setDepth(5).setName("board-cell");
    const label = this.add.text(x, y, String(tileId).padStart(2, "0"), {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "25px", fontStyle: "bold",
      stroke: "#152238", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6).setName("board-cell");
    this.tiles.set(keyOf(point), { card, label });
  }

  private onCellTapped(point: GridPoint): void {
    if (this.inputLocked) return;
    if (this.board.isEmpty(point)) {
      this.setSelected(null);
      return;
    }
    if (this.selected === null) {
      this.setSelected(point);
      return;
    }
    if (samePoint(this.selected, point)) {
      this.setSelected(null);
      return;
    }
    const start = this.selected;
    const tileId = this.board.tileAt(start);
    const path = tileId === this.board.tileAt(point) ? findPath(this.board, start, point) : null;
    if (tileId !== null && path !== null) {
      this.completeMove({ tileId, start, end: point, path });
    } else if (tileId !== null && tileId === this.board.tileAt(point)) {
      this.showBlockedPair(start, point);
    } else {
      this.setSelected(point);
    }
  }

  private showBlockedPair(first: GridPoint, second: GridPoint): void {
    this.inputLocked = true;
    for (const point of [first, second]) this.tiles.get(keyOf(point))?.card.setStrokeStyle(5, 0xff4d5e);
    this.time.delayedCall(180, () => {
      this.inputLocked = false;
      this.setSelected(null);
      this.setSelected(second);
    });
  }

  private setSelected(point: GridPoint | null): void {
    if (this.selected !== null) this.styleTile(this.selected, false);
    this.selected = point;
    if (point !== null) this.styleTile(point, true);
  }

  private styleTile(point: GridPoint, selected: boolean): void {
    const visual = this.tiles.get(keyOf(point));
    if (visual === undefined) return;
    visual.card.setStrokeStyle(selected ? 5 : 3, selected ? 0xffd34e : 0xe8f3ff);
    visual.card.setScale(selected ? 1.06 : 1);
    visual.label.setScale(selected ? 1.06 : 1);
  }

  private completeMove(move: LegalMove): void {
    this.inputLocked = true;
    this.setSelected(null);
    this.drawRoute(move.path.points);
    this.time.delayedCall(220, () => {
      this.board = applyMove(this.board, move);
      this.removeTile(move.start);
      this.removeTile(move.end);
      this.route.clear();
      this.updateRemaining();
      if (this.tiles.size === 0) this.showComplete();
      else this.inputLocked = false;
    });
  }

  private drawRoute(points: readonly GridPoint[]): void {
    const mapped = points.map((point) => this.layout.cellCenter(point));
    this.route.clear().lineStyle(7, 0x152238, 0.85).beginPath();
    this.route.moveTo(mapped[0]!.x, mapped[0]!.y);
    mapped.slice(1).forEach(({ x, y }) => this.route.lineTo(x, y));
    this.route.strokePath().lineStyle(4, 0xffdf5d, 1).beginPath();
    this.route.moveTo(mapped[0]!.x, mapped[0]!.y);
    mapped.slice(1).forEach(({ x, y }) => this.route.lineTo(x, y));
    this.route.strokePath();
  }

  private removeTile(point: GridPoint): void {
    const visual = this.tiles.get(keyOf(point));
    visual?.card.destroy();
    visual?.label.destroy();
    this.tiles.delete(keyOf(point));
  }

  private updateRemaining(): void {
    this.remainingText.setText(`Pairs remaining: ${this.tiles.size / 2}`);
  }

  private showComplete(): void {
    const shade = this.add.rectangle(240, 420, 440, 230, 0x0b1220, 0.96).setStrokeStyle(2, 0x7fa8d8);
    const title = this.add.text(240, 374, "Complete", {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "36px", fontStyle: "bold",
    }).setOrigin(0.5);
    const button = this.add.rectangle(240, 460, 210, 58, 0x3976b9).setStrokeStyle(2, 0xd6eaff)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => this.startLevel());
    const buttonText = this.add.text(240, 460, "Play again", {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "22px", fontStyle: "bold",
    }).setOrigin(0.5);
    this.completeOverlay = this.add.container(0, 0, [shade, title, button, buttonText]).setDepth(40);
  }
}
