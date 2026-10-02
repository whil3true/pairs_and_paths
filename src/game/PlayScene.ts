import { applyMove, findPath, type Board, type GridPoint, type LegalMove } from "../domain/index.js";
import type { PlatformService } from "../platform/PlatformService.js";
import { recordStageCompletion, type CampaignProgress } from "../progress/CampaignProgress.js";
import type { ProgressStore } from "../progress/ProgressStore.js";
import { BoardLayout, getVisibleBackingCount } from "./BoardLayout.js";
import {
  BOARD_SHEET_OFFSET_X, BOARD_SHEET_OFFSET_Y, BOARD_VISUAL_STYLE, getBoardContentBounds, getBoardFrameBounds,
  getBackingSheetShadeAlpha, getBoardArtworkApertureCorners, getBoardFrameOpening,
} from "./BoardVisualPolicy.js";
import type { PlayStartData } from "./SceneStart.js";
import { createLevelStage, getStageClearOutcome, getStageCount, hasNextLevel } from "./LevelSequence.js";
import { getTileSymbol, preloadTileSymbols } from "./TileSymbols.js";
import {
  configureLogicalCamera, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH, setHiDpiTextResolution,
} from "./Display.js";
import { getHintMove } from "./Hint.js";
import { computeContainedSquarePlacement, getLevelArtwork, isArtworkRevealStage } from "./LevelArtwork.js";
import { TileVisual } from "./TileVisual.js";
import { createBlockerVisual } from "./BlockerVisual.js";
import { GAMEPLAY_HUD, formatRemainingPairs } from "./GameplayHudPolicy.js";
import {
  createPolylineMetrics, GAMEPLAY_FEEDBACK, partialPolylineFromMetrics,
} from "./GameplayFeedbackPolicy.js";
import { createSecondaryButton, createUiText, type UiButton } from "./UiPrimitives.js";
import { MOTION, VISUAL_COLORS } from "./VisualTokens.js";

const keyOf = ({ col, row }: GridPoint): string => `${col},${row}`;
const samePoint = (left: GridPoint, right: GridPoint): boolean =>
  left.col === right.col && left.row === right.row;

interface BackingSheetVisual {
  readonly root: Phaser.GameObjects.Container;
  readonly shade: Phaser.GameObjects.Graphics;
}

export class PlayScene extends Phaser.Scene {
  private board!: Board;
  private layout!: BoardLayout;
  private selected: GridPoint | null = null;
  private inputLocked = false;
  private hintActive = false;
  private hintedPoints: readonly [GridPoint, GridPoint] | null = null;
  private hintTimer: Phaser.Time.TimerEvent | null = null;
  private hintTween: Phaser.Tweens.Tween | null = null;
  private readonly tiles = new Map<string, TileVisual>();
  private route!: Phaser.GameObjects.Graphics;
  private routeTween: Phaser.Tweens.Tween | null = null;
  private routeHoldTimer: Phaser.Time.TimerEvent | null = null;
  private removalTween: Phaser.Tweens.Tween | null = null;
  private stageStackVisual: Phaser.GameObjects.Container | null = null;
  private currentBoardVisual: Phaser.GameObjects.Container | null = null;
  private frontSheet: Phaser.GameObjects.Graphics | null = null;
  private nextSheet: BackingSheetVisual | null = null;
  private levelText!: Phaser.GameObjects.Text;
  private remainingText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private completeOverlay: Phaser.GameObjects.Container | null = null;
  private artworkPresentation: Phaser.GameObjects.Container | null = null;
  private currentArtworkVisual: Phaser.GameObjects.Image | null = null;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;
  private pauseControl!: UiButton;
  private hintControl!: UiButton;
  private currentLevelNumber = 1;
  private currentStageIndex = 0;
  private persistenceEnabled = true;
  private progress!: CampaignProgress;

  constructor(
    private readonly platform: PlatformService,
    private readonly progressStore: ProgressStore,
    private readonly renderScale = 1,
  ) {
    super({ key: "PlayScene" });
  }

  init(data: PlayStartData): void {
    this.currentLevelNumber = data.levelNumber;
    this.currentStageIndex = data.stageIndex;
    this.persistenceEnabled = data.persistenceEnabled;
    this.progress = this.progressStore.load();
  }

  preload(): void {
    preloadTileSymbols(this);
    const artwork = getLevelArtwork(this.currentLevelNumber);
    if (artwork !== undefined && !this.textures.exists(artwork.fullAssetKey)) {
      this.load.image(artwork.fullAssetKey, artwork.fullPath);
    }
  }

  create(): void {
    configureLogicalCamera(this, this.renderScale);
    this.pauseControl = createSecondaryButton(this, this.renderScale, {
      x: GAMEPLAY_HUD.pause.centerX, y: GAMEPLAY_HUD.pause.centerY,
      width: GAMEPLAY_HUD.pause.width, height: GAMEPLAY_HUD.pause.height,
      label: "Пауза", onActivate: () => this.showPause(),
    });
    this.hintControl = createSecondaryButton(this, this.renderScale, {
      x: GAMEPLAY_HUD.hint.centerX, y: GAMEPLAY_HUD.hint.centerY,
      width: GAMEPLAY_HUD.hint.width, height: GAMEPLAY_HUD.hint.height,
      label: "Подсказка", onActivate: () => this.showHint(),
    });
    this.levelText = createUiText(this, this.renderScale, GAMEPLAY_HUD.statusLeftX, GAMEPLAY_HUD.statusY,
      "", "hudPrimary").setOrigin(0, 0);
    this.remainingText = createUiText(this, this.renderScale, GAMEPLAY_HUD.statusRightX, GAMEPLAY_HUD.statusY,
      "", "hudPrimary", { align: "right" }).setOrigin(1, 0);
    this.stageText = createUiText(this, this.renderScale, GAMEPLAY_HUD.stageCenterX, GAMEPLAY_HUD.stageY,
      "", "hudSecondary", { align: "center" }).setOrigin(0.5, 0);
    for (const object of [this.pauseControl.container, this.hintControl.container,
      this.levelText, this.remainingText, this.stageText]) object.setDepth(30);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearHintFeedback();
      this.hidePause();
      this.artworkPresentation?.destroy(true);
    });
    this.loadStage();
  }

  private startLevel(): void {
    this.currentStageIndex = 0;
    this.loadCurrentArtwork(() => this.loadStage());
  }

  private loadCurrentArtwork(onReady: () => void): void {
    const artwork = getLevelArtwork(this.currentLevelNumber);
    if (artwork === undefined || this.textures.exists(artwork.fullAssetKey)) {
      onReady();
      return;
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      if (!this.textures.exists(artwork.fullAssetKey)) {
        console.warn(`Artwork failed to load for Level ${artwork.levelNumber}: ${artwork.fullPath}`);
      }
      onReady();
    });
    this.load.image(artwork.fullAssetKey, artwork.fullPath);
    this.load.start();
  }

  private loadStage(animateIn = false): void {
    this.hidePause();
    this.completeOverlay?.destroy(true);
    this.completeOverlay = null;
    this.artworkPresentation?.destroy(true);
    this.artworkPresentation = null;
    this.destroyBoardVisuals();
    this.setGameplayHudVisible(true);
    this.selected = null;
    this.inputLocked = animateIn;

    const level = createLevelStage(this.currentLevelNumber, this.currentStageIndex);
    this.board = level.board;
    const stageCount = getStageCount(this.currentLevelNumber);
    this.levelText.setText(`Уровень ${this.currentLevelNumber}`);
    this.stageText.setText(`Этап ${this.currentStageIndex + 1}/${stageCount}`).setVisible(stageCount > 1);
    this.layout = new BoardLayout({
      sceneWidth: LOGICAL_GAME_WIDTH, sceneHeight: LOGICAL_GAME_HEIGHT,
      boardWidth: this.board.width, boardHeight: this.board.height,
    });
    this.renderStageStack(stageCount);
    this.currentBoardVisual = this.add.container(0, 0).setDepth(10);
    this.renderArtwork();
    this.renderFrameOverlay();
    this.route = this.add.graphics().setDepth(2);
    this.currentBoardVisual.add(this.route);
    this.renderBoard();
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
    this.clearHintFeedback();
    this.routeTween?.stop();
    this.routeTween = null;
    this.routeHoldTimer?.remove(false);
    this.routeHoldTimer = null;
    this.removalTween?.stop();
    this.removalTween = null;
    if (this.frontSheet !== null) this.tweens.killTweensOf(this.frontSheet);
    if (this.nextSheet !== null) {
      this.tweens.killTweensOf(this.nextSheet.root);
      this.tweens.killTweensOf(this.nextSheet.shade);
    }
    if (this.stageStackVisual !== null) this.tweens.killTweensOf(this.stageStackVisual);
    if (this.currentBoardVisual !== null) this.tweens.killTweensOf(this.currentBoardVisual);
    this.stageStackVisual?.destroy(true);
    this.currentBoardVisual?.destroy(true);
    this.stageStackVisual = null;
    this.currentBoardVisual = null;
    this.currentArtworkVisual = null;
    this.frontSheet = null;
    this.nextSheet = null;
    this.tiles.clear();
  }

  private renderArtwork(): void {
    const artwork = getLevelArtwork(this.currentLevelNumber);
    if (artwork === undefined
      || !isArtworkRevealStage(this.currentLevelNumber, this.currentStageIndex)
      || !this.textures.exists(artwork.fullAssetKey)) return;
    const width = this.layout.boardRight - this.layout.boardLeft;
    const height = this.layout.boardBottom - this.layout.boardTop;
    const placement = computeContainedSquarePlacement(
      this.layout.boardLeft, this.layout.boardTop, width, height,
    );
    const apertureBacking = this.add.graphics().setDepth(-1)
      .fillStyle(BOARD_VISUAL_STYLE.frameFill, 1)
      .fillRect(placement.x, placement.y, placement.size, placement.size);
    const image = this.add.image(
      placement.x + placement.size / 2,
      placement.y + placement.size / 2,
      artwork.fullAssetKey,
    ).setDisplaySize(placement.size, placement.size).setDepth(0);
    this.currentBoardVisual!.add([apertureBacking, image]);
    this.currentArtworkVisual = image;
  }

  private renderFrameOverlay(): void {
    const frame = getBoardFrameBounds(this.layout);
    const hasArtwork = this.currentArtworkVisual !== null;
    const openingPolicy = getBoardFrameOpening(this.layout, hasArtwork);
    const openingBounds = openingPolicy.bounds;
    const { outlineInset } = BOARD_VISUAL_STYLE;
    if (hasArtwork) {
      const content = getBoardContentBounds(this.layout);
      const corners = getBoardArtworkApertureCorners(this.layout);
      const overlay = this.add.graphics().setDepth(1).fillStyle(BOARD_VISUAL_STYLE.frameFill, 1);
      overlay
        .fillRect(content.left, content.top, content.width, openingBounds.top - content.top)
        .fillRect(content.left, openingBounds.bottom, content.width, content.bottom - openingBounds.bottom)
        .fillRect(content.left, content.top, openingBounds.left - content.left, content.height)
        .fillRect(openingBounds.right, content.top, content.right - openingBounds.right, content.height);

      overlay.beginPath().moveTo(corners.topLeft.corner.x, corners.topLeft.corner.y)
        .lineTo(corners.topLeft.horizontalTangent.x, corners.topLeft.horizontalTangent.y)
        .arc(corners.topLeft.center.x, corners.topLeft.center.y, openingPolicy.radius, -Math.PI / 2, -Math.PI, true)
        .closePath().fillPath();
      overlay.beginPath().moveTo(corners.topRight.corner.x, corners.topRight.corner.y)
        .lineTo(corners.topRight.horizontalTangent.x, corners.topRight.horizontalTangent.y)
        .arc(corners.topRight.center.x, corners.topRight.center.y, openingPolicy.radius, -Math.PI / 2, 0)
        .closePath().fillPath();
      overlay.beginPath().moveTo(corners.bottomRight.corner.x, corners.bottomRight.corner.y)
        .lineTo(corners.bottomRight.verticalTangent.x, corners.bottomRight.verticalTangent.y)
        .arc(corners.bottomRight.center.x, corners.bottomRight.center.y, openingPolicy.radius, 0, Math.PI / 2)
        .closePath().fillPath();
      overlay.beginPath().moveTo(corners.bottomLeft.corner.x, corners.bottomLeft.corner.y)
        .lineTo(corners.bottomLeft.horizontalTangent.x, corners.bottomLeft.horizontalTangent.y)
        .arc(corners.bottomLeft.center.x, corners.bottomLeft.center.y, openingPolicy.radius, Math.PI / 2, Math.PI)
        .closePath().fillPath();
      this.currentBoardVisual!.add(overlay);
      return;
    }
    const ringSource = this.make.graphics(undefined, false)
      .fillStyle(BOARD_VISUAL_STYLE.frameFill, 1)
      .lineStyle(BOARD_VISUAL_STYLE.borderWidth, BOARD_VISUAL_STYLE.frameBorder, 1)
      .fillRoundedRect(
        outlineInset,
        outlineInset,
        frame.width - BOARD_VISUAL_STYLE.borderWidth,
        frame.height - BOARD_VISUAL_STYLE.borderWidth,
        BOARD_VISUAL_STYLE.outlineRadius,
      )
      .strokeRoundedRect(
        outlineInset,
        outlineInset,
        frame.width - BOARD_VISUAL_STYLE.borderWidth,
        frame.height - BOARD_VISUAL_STYLE.borderWidth,
        BOARD_VISUAL_STYLE.outlineRadius,
      );
    const opening = this.make.graphics(undefined, false)
      .fillStyle(0xffffff, 1)
      .fillRoundedRect(
        openingBounds.left - frame.left,
        openingBounds.top - frame.top,
        openingBounds.width,
        openingBounds.height,
        openingPolicy.radius,
      );
    const ring = this.add.renderTexture(
      frame.left,
      frame.top,
      frame.width,
      frame.height,
    ).setOrigin(0).setDepth(1);
    ring.draw(ringSource).erase(opening);
    ringSource.destroy();
    opening.destroy();
    this.currentBoardVisual!.add(ring);
  }

  private renderStageStack(stageCount: number): void {
    const frame = getBoardFrameBounds(this.layout);
    const content = getBoardContentBounds(this.layout);
    const backingCount = getVisibleBackingCount(this.currentStageIndex, stageCount);
    const sheets: Phaser.GameObjects.GameObject[] = [];
    for (let depth = backingCount; depth >= 1; depth -= 1) {
      const base = this.add.graphics()
        .fillStyle(BOARD_VISUAL_STYLE.backingFill, 1)
        .fillRoundedRect(frame.left, frame.top, frame.width, frame.height, BOARD_VISUAL_STYLE.outerRadius);
      const shade = this.add.graphics()
        .fillStyle(BOARD_VISUAL_STYLE.sheetShade, 1)
        .fillRoundedRect(frame.left, frame.top, frame.width, frame.height, BOARD_VISUAL_STYLE.outerRadius)
        .setAlpha(getBackingSheetShadeAlpha(depth));
      const sheet: BackingSheetVisual = {
        root: this.add.container(
          depth * BOARD_SHEET_OFFSET_X, depth * BOARD_SHEET_OFFSET_Y, [base, shade],
        ),
        shade,
      };
      sheets.push(sheet.root);
      if (depth === 1) this.nextSheet = sheet;
    }
    this.frontSheet = this.add.graphics()
      .fillStyle(BOARD_VISUAL_STYLE.frameFill, 1)
      .fillRoundedRect(frame.left, frame.top, frame.width, frame.height, BOARD_VISUAL_STYLE.outerRadius)
      .fillStyle(BOARD_VISUAL_STYLE.interiorFill, 1)
      .fillRoundedRect(content.left, content.top, content.width, content.height, BOARD_VISUAL_STYLE.innerRadius);
    sheets.push(this.frontSheet);
    this.stageStackVisual = this.add.container(0, 0, sheets).setDepth(1);
  }

  private renderBoard(): void {
    for (let row = 0; row < this.board.height; row += 1) for (let col = 0; col < this.board.width; col += 1) {
      const point = { col, row };
      const { x, y } = this.layout.cellCenter(point);
      if (this.board.isBlocked(point)) {
        const blocker = createBlockerVisual(this, x, y);
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
    const definition = getTileSymbol(tileId);
    const visual = new TileVisual(
      this, x, y, this.add.image(0, 0, definition.assetKey), definition.displaySize,
    );
    this.currentBoardVisual!.add(visual.root);
    this.tiles.set(keyOf(point), visual);
  }

  private onCellTapped(point: GridPoint): void {
    if (this.inputLocked || this.hintActive || this.pauseOverlay !== null || this.board.isBlocked(point)) return;
    if (this.board.isEmpty(point)) {
      this.setSelected(null);
      return;
    }
    this.tiles.get(keyOf(point))?.press(this.tweens);
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
    for (const point of [first, second]) {
      this.tiles.get(keyOf(point))?.setState("blocked");
    }
    this.time.delayedCall(GAMEPLAY_FEEDBACK.blockedDuration, () => {
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
    visual.setState(selected ? "selected" : "default");
  }

  private showHint(): void {
    if (this.inputLocked || this.hintActive || this.pauseOverlay !== null || this.completeOverlay !== null) return;
    this.setSelected(null);
    const move = getHintMove(this.board);
    if (move === null) {
      if (this.board.hasTiles()) console.warn("Hint requested, but the current board has no legal moves");
      return;
    }
    this.hintActive = true;
    this.hintedPoints = [move.start, move.end];
    for (const point of this.hintedPoints) {
      this.tiles.get(keyOf(point))?.setState("hint");
    }
    const roots = this.hintedPoints.map((point) => this.tiles.get(keyOf(point))?.root)
      .filter((root): root is Phaser.GameObjects.Container => root !== undefined);
    if (!this.prefersReducedMotion()) {
      this.hintTween = this.tweens.add({
        targets: roots, scaleX: GAMEPLAY_FEEDBACK.hint.scalePeak, scaleY: GAMEPLAY_FEEDBACK.hint.scalePeak,
        duration: GAMEPLAY_FEEDBACK.hint.pulseHalfDuration, yoyo: true,
        repeat: GAMEPLAY_FEEDBACK.hint.pulseRepeats, ease: "Sine.InOut",
      });
    }
    this.hintTimer = this.time.delayedCall(GAMEPLAY_FEEDBACK.hint.duration, () => this.clearHintFeedback());
  }

  private clearHintFeedback(): void {
    this.hintTimer?.remove(false);
    this.hintTimer = null;
    this.hintTween?.stop();
    this.hintTween = null;
    if (this.hintedPoints !== null) for (const point of this.hintedPoints) {
      this.tiles.get(keyOf(point))?.root.setScale(1);
    }
    if (this.hintedPoints !== null) {
      for (const point of this.hintedPoints) this.styleTile(point, false);
    }
    this.hintedPoints = null;
    this.hintActive = false;
  }

  private completeMove(move: LegalMove): void {
    this.inputLocked = true;
    this.setSelected(null);
    this.animateRoute(move.path.points, () => {
      this.board = applyMove(this.board, move);
      this.animateTileRemoval(move.start, move.end, () => {
        this.updateRemaining();
        if (this.tiles.size === 0) this.finishStage();
        else this.inputLocked = false;
      });
    });
  }

  private animateRoute(points: readonly GridPoint[], onComplete: () => void): void {
    const mapped = points.map((point) => this.layout.cellCenter(point));
    const metrics = createPolylineMetrics(mapped);
    const state = { progress: 0 };
    const draw = (): void => this.drawRoute(partialPolylineFromMetrics(metrics, state.progress));
    draw();
    this.routeTween = this.tweens.add({
      targets: state, progress: 1, duration: GAMEPLAY_FEEDBACK.route.entryDuration, ease: "Linear",
      onUpdate: draw,
      onComplete: () => {
        this.routeTween = null;
        this.routeHoldTimer = this.time.delayedCall(GAMEPLAY_FEEDBACK.route.holdDuration, () => {
          this.routeHoldTimer = null;
          this.routeTween = this.tweens.add({
            targets: this.route, alpha: 0, duration: GAMEPLAY_FEEDBACK.route.fadeDuration, ease: "Linear",
            onComplete: () => {
              this.routeTween = null;
              this.route.clear().setAlpha(1);
              onComplete();
            },
          });
        });
      },
    });
  }

  private drawRoute(points: readonly { readonly x: number; readonly y: number }[]): void {
    this.route.clear();
    if (points.length === 0) return;
    const stroke = (width: number, color: number): void => {
      this.route.lineStyle(width, color, 1).beginPath().moveTo(points[0]!.x, points[0]!.y);
      for (let index = 1; index < points.length; index += 1) {
        const point = points[index]!;
        this.route.lineTo(point.x, point.y);
      }
      this.route.strokePath();
      for (const point of points) this.route.fillStyle(color, 1).fillCircle(point.x, point.y, width / 2);
    };
    stroke(GAMEPLAY_FEEDBACK.route.haloWidth, VISUAL_COLORS.route.halo.phaser);
    stroke(GAMEPLAY_FEEDBACK.route.coreWidth, VISUAL_COLORS.route.core.phaser);
  }

  private animateTileRemoval(first: GridPoint, second: GridPoint, onComplete: () => void): void {
    const entries = [first, second].map((point) => [keyOf(point), this.tiles.get(keyOf(point))] as const)
      .filter((entry): entry is readonly [string, TileVisual] => entry[1] !== undefined);
    this.removalTween = this.tweens.add({
      targets: entries.map(([, visual]) => visual.root),
      scaleX: GAMEPLAY_FEEDBACK.removal.scale, scaleY: GAMEPLAY_FEEDBACK.removal.scale, alpha: 0,
      duration: GAMEPLAY_FEEDBACK.removal.duration, ease: "Quad.In",
      onComplete: () => {
        this.removalTween = null;
        for (const [key, visual] of entries) {
          visual.destroy();
          this.tiles.delete(key);
        }
        onComplete();
      },
    });
  }

  private updateRemaining(): void {
    this.remainingText.setText(formatRemainingPairs(this.tiles.size / 2));
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== "undefined" && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  private setGameplayHudVisible(visible: boolean): void {
    this.pauseControl.container.setVisible(visible);
    this.hintControl.container.setVisible(visible);
    this.pauseControl.setDisabled(!visible);
    this.hintControl.setDisabled(!visible);
    this.levelText.setVisible(visible);
    this.remainingText.setVisible(visible);
    this.stageText.setVisible(visible && getStageCount(this.currentLevelNumber) > 1);
  }

  private finishStage(): void {
    const outcome = getStageClearOutcome(this.currentLevelNumber, this.currentStageIndex);
    if (outcome.kind === "level-complete") {
      if (this.persistenceEnabled) {
        const completion = recordStageCompletion(
          this.progress, this.currentLevelNumber, this.currentStageIndex,
          getStageCount(this.currentLevelNumber),
        );
        this.progress = completion.progress;
        if (completion.shouldSave) this.progressStore.save(completion.progress);
      }
      if (this.currentArtworkVisual !== null) this.showArtworkPresentation();
      else this.showComplete();
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
      this.tweens.add({
        targets: this.nextSheet.root, y: `-=${BOARD_SHEET_OFFSET_Y}`,
        duration: 220, ease: "Quad.InOut",
      });
      this.tweens.add({
        targets: this.nextSheet.shade, alpha: getBackingSheetShadeAlpha(0),
        duration: 220, ease: "Quad.InOut",
      });
    }
  }

  private showArtworkPresentation(): void {
    const artwork = getLevelArtwork(this.currentLevelNumber);
    if (artwork === undefined || !this.textures.exists(artwork.fullAssetKey)) {
      this.showComplete();
      return;
    }
    this.hidePause();
    this.clearHintFeedback();
    this.destroyBoardVisuals();
    this.setGameplayHudVisible(false);
    const backdrop = this.add.rectangle(240, 400, 480, 800, 0x07101d, 1).setInteractive();
    const image = this.add.image(240, 382, artwork.fullAssetKey)
      .setDisplaySize(400, 400);
    const title = setHiDpiTextResolution(this.add.text(240, 690, "Image unlocked", {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "30px", fontStyle: "bold",
    }).setOrigin(0.5), this.renderScale);
    const button = this.add.rectangle(240, 746, 190, 48, 0x3976b9).setStrokeStyle(2, 0xd6eaff)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        this.artworkPresentation?.destroy(true);
        this.artworkPresentation = null;
        this.showComplete();
      });
    const buttonText = setHiDpiTextResolution(this.add.text(240, 746, "Continue", {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "20px", fontStyle: "bold",
    }).setOrigin(0.5), this.renderScale);
    this.artworkPresentation = this.add.container(0, 0, [backdrop, image, title, button, buttonText]).setDepth(40);
  }

  private showComplete(): void {
    this.hidePause();
    this.clearHintFeedback();
    this.setGameplayHudVisible(false);
    const shade = this.add.rectangle(240, 420, 440, 330, 0x0b1220, 0.96).setStrokeStyle(2, 0x7fa8d8);
    const campaignComplete = !hasNextLevel(this.currentLevelNumber);
    const title = setHiDpiTextResolution(this.add.text(240, 315, campaignComplete ? "Campaign complete" : "Complete", {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "36px", fontStyle: "bold",
    }).setOrigin(0.5), this.renderScale);
    const nextButton = this.add.rectangle(240, 418, 210, 58, 0x3976b9).setStrokeStyle(2, 0xd6eaff)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        this.currentLevelNumber = campaignComplete ? 1 : this.currentLevelNumber + 1;
        this.startLevel();
      });
    const nextText = setHiDpiTextResolution(this.add.text(240, 418, campaignComplete ? "Restart from Level 1" : "Next level", {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "22px", fontStyle: "bold",
    }).setOrigin(0.5), this.renderScale);
    const replayButton = this.add.rectangle(240, 489, 180, 46, 0x243c5c).setStrokeStyle(1, 0x91acce)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => this.startLevel());
    const replayText = setHiDpiTextResolution(this.add.text(240, 489, "Replay level", {
      color: "#dceaff", fontFamily: "Arial, sans-serif", fontSize: "18px",
    }).setOrigin(0.5), this.renderScale);
    const menuButton = this.add.rectangle(240, 550, 180, 46, 0x243c5c).setStrokeStyle(1, 0x91acce)
      .setInteractive({ useHandCursor: true }).on("pointerdown", () => this.scene.start("MainMenuScene"));
    const menuText = setHiDpiTextResolution(this.add.text(240, 550, "Menu", {
      color: "#dceaff", fontFamily: "Arial, sans-serif", fontSize: "18px",
    }).setOrigin(0.5), this.renderScale);
    this.completeOverlay = this.add.container(
      0, 0, [shade, title, nextButton, nextText, replayButton, replayText, menuButton, menuText],
    ).setDepth(40);
  }

  private showPause(): void {
    if (this.inputLocked || this.hintActive || this.completeOverlay !== null
      || this.artworkPresentation !== null || this.pauseOverlay !== null) return;
    this.showPauseMenu();
  }

  private showPauseMenu(): void {
    this.replacePauseOverlay(
      "PAUSED",
      undefined,
      [
        { label: "Resume", action: () => this.hidePause() },
        { label: "Restart level", action: () => this.showRestartConfirmation() },
        { label: "Exit to menu", action: () => this.showExitConfirmation() },
      ],
    );
  }

  private showRestartConfirmation(): void {
    this.replacePauseOverlay(
      "Restart level?",
      "Current level progress will be lost.",
      [
        { label: "Restart", action: () => { this.hidePause(); this.startLevel(); } },
        { label: "Cancel", action: () => this.showPauseMenu() },
      ],
    );
  }

  private showExitConfirmation(): void {
    this.replacePauseOverlay(
      "Exit to menu?",
      "Current level progress will be lost.",
      [
        { label: "Exit", action: () => { this.hidePause(); this.scene.start("MainMenuScene"); } },
        { label: "Cancel", action: () => this.showPauseMenu() },
      ],
    );
  }

  private replacePauseOverlay(
    titleCopy: string,
    message: string | undefined,
    actions: readonly { readonly label: string; readonly action: () => void }[],
  ): void {
    this.pauseOverlay?.destroy(true);
    const objects: Phaser.GameObjects.GameObject[] = [];
    const backdrop = this.add.rectangle(240, 400, 480, 800, 0x07101d, 0.72).setInteractive();
    const panelHeight = message === undefined ? 350 : 300;
    const panel = this.add.rectangle(240, 410, 420, panelHeight, 0x0b1220, 0.98)
      .setStrokeStyle(2, 0x7fa8d8);
    const titleY = message === undefined ? 280 : 320;
    const title = setHiDpiTextResolution(this.add.text(240, titleY, titleCopy, {
      color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "34px", fontStyle: "bold",
    }).setOrigin(0.5), this.renderScale);
    objects.push(backdrop, panel, title);
    if (message !== undefined) {
      objects.push(setHiDpiTextResolution(this.add.text(240, 370, message, {
        color: "#bcd1ec", fontFamily: "Arial, sans-serif", fontSize: "17px",
      }).setOrigin(0.5), this.renderScale));
    }
    const firstButtonY = message === undefined ? 365 : 440;
    actions.forEach(({ label, action }, index) => {
      const y = firstButtonY + index * 68;
      const button = this.add.rectangle(240, y, 220, 50, index === 0 ? 0x3976b9 : 0x243c5c)
        .setStrokeStyle(index === 0 ? 2 : 1, index === 0 ? 0xd6eaff : 0x91acce)
        .setInteractive({ useHandCursor: true }).on("pointerdown", action);
      const text = setHiDpiTextResolution(this.add.text(240, y, label, {
        color: "#ffffff", fontFamily: "Arial, sans-serif", fontSize: "19px",
        fontStyle: index === 0 ? "bold" : "normal",
      }).setOrigin(0.5), this.renderScale);
      objects.push(button, text);
    });
    this.pauseOverlay = this.add.container(0, 0, objects).setDepth(50);
  }

  private hidePause(): void {
    this.pauseOverlay?.destroy(true);
    this.pauseOverlay = null;
  }
}
