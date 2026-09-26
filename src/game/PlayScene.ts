import { applyMove, findPath, type Board, type GridPoint, type LegalMove } from "../domain/index.js";
import type { PlatformService } from "../platform/PlatformService.js";
import { BoardLayout, getVisibleBackingCount } from "./BoardLayout.js";
import { createLevelStage, getStageClearOutcome, getStageCount, hasNextLevel } from "./LevelSequence.js";

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
  private stageStackVisual: Phaser.GameObjects.Container | null = null;
  private currentBoardVisual: Phaser.GameObjects.Container | null = null;
  private frontSheet: Phaser.GameObjects.Rectangle | null = null;
  private nextSheet: Phaser.GameObjects.Rectangle | null = null;
  private levelText!: Phaser.GameObjects.Text;
  private remainingText!: Phaser.GameObjects.Text;
  private seedText!: Phaser.GameObjects.Text;
  private completeOverlay: Phaser.GameObjects.Container | null = null;
  private currentLevelNumber = 1;
  private currentStageIndex = 0;

  constructor(private readonly platform: PlatformService) {
    super({ key: "PlayScene" });
  }

  create(): void {
    this.add.text(240, 30, "Pairs & Paths", {
      color: "#f7fbff", fontFamily: "Arial, sans-serif", fontSize: "32px", fontStyle: "bold",
    }).setOrigin(0.5);
    this.levelText = this.add.text(240, 70, "", {
      color: "#dceaff", fontFamily: "Arial, sans-serif", fontSize: "20px", fontStyle: "bold",
    }).setOrigin(0.5);
    this.remainingText = this.add.text(240, 98, "", {
      color: "#bcd1ec", fontFamily: "Arial, sans-serif", fontSize: "20px",
    }).setOrigin(0.5);
    this.seedText = this.add.text(240, 766, "", {
      color: "#6f86a5", fontFamily: "Arial, sans-serif", fontSize: "13px",
    }).setOrigin(0.5);
    this.startLevel();
  }

  private startLevel(): void {
    this.currentStageIndex = 0;
    this.loadStage();
  }

  private loadStage(animateIn = false): void {
    this.completeOverlay?.destroy(true);
    this.completeOverlay = null;
    this.destroyBoardVisuals();
    this.selected = null;
    this.inputLocked = animateIn;

    const level = createLevelStage(this.currentLevelNumber, this.currentStageIndex);
    this.board = level.board;
    const stageCount = getStageCount(this.currentLevelNumber);
    this.levelText.setText(stageCount === 1 ? `Level ${this.currentLevelNumber}`
      : `Level ${this.currentLevelNumber} · Stage ${this.currentStageIndex + 1}/${stageCount}`);
    this.seedText.setText(`Prototype · ${this.platform.displayName} · seed ${level.config.seed}`);
    this.layout = new BoardLayout({
      sceneWidth: Number(this.scale.width), sceneHeight: Number(this.scale.height),
      boardWidth: this.board.width, boardHeight: this.board.height,
    });
    this.renderStageStack(stageCount);
    this.currentBoardVisual = this.add.container(0, 0).setDepth(10);
    this.renderBoard();
    this.route = this.add.graphics().setDepth(20);
    this.currentBoardVisual.add(this.route);
    this.currentBoardVisual.sort("depth");
    this.updateRemaining();
    if (animateIn) {
      this.stageStackVisual!.setAlpha(0).setPosition(7, 7);
      this.currentBoardVisual.setAlpha(0).setPosition(7, 7);
      this.tweens.add({
        targets: [this.stageStackVisual, this.currentBoardVisual], x: 0, y: 0, alpha: 1,
        duration: 140, ease: "Quad.Out", onComplete: () => { this.inputLocked = false; },
      });
    }
  }

  private destroyBoardVisuals(): void {
    if (this.frontSheet !== null) this.tweens.killTweensOf(this.frontSheet);
    if (this.nextSheet !== null) this.tweens.killTweensOf(this.nextSheet);
    if (this.stageStackVisual !== null) this.tweens.killTweensOf(this.stageStackVisual);
    if (this.currentBoardVisual !== null) this.tweens.killTweensOf(this.currentBoardVisual);
    this.stageStackVisual?.destroy(true);
    this.currentBoardVisual?.destroy(true);
    this.stageStackVisual = null;
    this.currentBoardVisual = null;
    this.frontSheet = null;
    this.nextSheet = null;
    this.tiles.clear();
  }

  private renderStageStack(stageCount: number): void {
    const padding = 8;
    const offset = 7;
    const width = this.layout.boardRight - this.layout.boardLeft + padding * 2;
    const height = this.layout.boardBottom - this.layout.boardTop + padding * 2;
    const centerX = (this.layout.boardLeft + this.layout.boardRight) / 2;
    const centerY = (this.layout.boardTop + this.layout.boardBottom) / 2;
    const backingCount = getVisibleBackingCount(this.currentStageIndex, stageCount);
    const sheets: Phaser.GameObjects.Rectangle[] = [];
    for (let depth = backingCount; depth >= 1; depth -= 1) {
      const sheet = this.add.rectangle(centerX + depth * offset, centerY + depth * offset,
        width, height, depth === 1 ? 0x263b58 : 0x1f314a, 1)
        .setStrokeStyle(2, depth === 1 ? 0x6684a8 : 0x526b8b, 0.9);
      sheets.push(sheet);
      if (depth === 1) this.nextSheet = sheet;
    }
    this.frontSheet = this.add.rectangle(centerX, centerY, width, height, 0x14243a, 1)
      .setStrokeStyle(2, 0x7694b8, 0.9);
    sheets.push(this.frontSheet);
    this.stageStackVisual = this.add.container(0, 0, sheets).setDepth(1);
  }

  private renderBoard(): void {
    for (let row = 0; row < this.board.height; row += 1) for (let col = 0; col < this.board.width; col += 1) {
      const point = { col, row };
      const { x, y } = this.layout.cellCenter(point);
      const cell = this.add.rectangle(x, y, 64, 64, 0x1a2941, 0.52)
        .setStrokeStyle(1, 0x324663, 0.65);
      this.currentBoardVisual!.add(cell);
      if (this.board.isBlocked(point)) {
        const blocker = this.add.rectangle(x, y, 58, 58, 0x26303d, 1)
          .setStrokeStyle(3, 0x59687a, 1);
        this.currentBoardVisual!.add(blocker);
        continue;
      }
      const zone = this.add.zone(x, y, this.layout.pitch - 2, this.layout.pitch - 2)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.onCellTapped(point));
      this.currentBoardVisual!.add(zone);
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
    }).setOrigin(0.5).setDepth(6);
    this.currentBoardVisual!.add([card, label]);
    this.tiles.set(keyOf(point), { card, label });
  }

  private onCellTapped(point: GridPoint): void {
    if (this.inputLocked || this.board.isBlocked(point)) return;
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
      if (this.tiles.size === 0) this.finishStage();
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

  private finishStage(): void {
    const outcome = getStageClearOutcome(this.currentLevelNumber, this.currentStageIndex);
    if (outcome.kind === "level-complete") {
      this.showComplete();
      return;
    }
    this.tweens.add({
      targets: [this.frontSheet, this.currentBoardVisual], x: -14, y: -18, alpha: 0,
      duration: 220, ease: "Quad.In", onComplete: () => {
        this.currentStageIndex = outcome.stageIndex;
        this.loadStage(true);
      },
    });
    if (this.nextSheet !== null) {
      this.tweens.add({ targets: this.nextSheet, x: "-=7", y: "-=7", duration: 220, ease: "Quad.InOut" });
    }
  }

  private showComplete(): void {
    const shade = this.add.rectangle(240, 420, 440, 260, 0x0b1220, 0.96).setStrokeStyle(2, 0x7fa8d8);
    const campaignComplete = !hasNextLevel(this.currentLevelNumber);
    const title = this.add.text(240, 342, campaignComplete ? "Campaign complete" : "Complete", {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "36px", fontStyle: "bold",
    }).setOrigin(0.5);
    const nextButton = this.add.rectangle(240, 418, 210, 58, 0x3976b9).setStrokeStyle(2, 0xd6eaff)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        this.currentLevelNumber = campaignComplete ? 1 : this.currentLevelNumber + 1;
        this.startLevel();
      });
    const nextText = this.add.text(240, 418, campaignComplete ? "Restart from Level 1" : "Next level", {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "22px", fontStyle: "bold",
    }).setOrigin(0.5);
    const replayButton = this.add.rectangle(240, 489, 180, 46, 0x243c5c).setStrokeStyle(1, 0x91acce)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => this.startLevel());
    const replayText = this.add.text(240, 489, "Replay level", {
      color: "#dceaff", fontFamily: "Arial, sans-serif", fontSize: "18px",
    }).setOrigin(0.5);
    this.completeOverlay = this.add.container(
      0, 0, [shade, title, nextButton, nextText, replayButton, replayText],
    ).setDepth(40);
  }
}
