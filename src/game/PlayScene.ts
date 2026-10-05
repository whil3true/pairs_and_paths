import { applyMove, findPath, type Board, type GridPoint, type LegalMove } from "../domain/index.js";
import type { PlatformService } from "../platform/PlatformService.js";
import { resetPageDim, setPageDim } from "../platform/PageBackdrop.js";
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
  configureLogicalCamera, LOGICAL_GAME_HEIGHT, LOGICAL_GAME_WIDTH,
} from "./Display.js";
import { getHintMove } from "./Hint.js";
import { computeContainedSquarePlacement, getLevelArtwork, isArtworkRevealStage } from "./LevelArtwork.js";
import { TileVisual } from "./TileVisual.js";
import { createBlockerVisual } from "./BlockerVisual.js";
import { ensureBoardRuntimeAtlas } from "./BoardRuntimeAtlas.js";
import { GAMEPLAY_HUD, formatRemainingPairs } from "./GameplayHudPolicy.js";
import {
  createPolylineMetrics, GAMEPLAY_FEEDBACK, partialPolylineFromMetrics,
} from "./GameplayFeedbackPolicy.js";
import {
  createDangerButton, createModalShell, createPrimaryButton, createSecondaryButton, createUiText, type UiButton,
} from "./UiPrimitives.js";
import { BORDERS, VISUAL_COLORS } from "./VisualTokens.js";
import { DEFAULT_LOCALE, getChapterTitle, getUiStrings, type SupportedLocale } from "./Localization.js";
import { getLevelChapterPresentation } from "./ChapterPresentation.js";
import {
  COMPLETE_LAYOUT, getRewardMotionPolicy, REWARD_LAYOUT, REWARD_TRANSITION_DIM_ALPHA,
} from "./RewardVisualPolicy.js";
import { getPauseMotionPolicy, PAUSE_FADE_EASE, PAUSE_LAYOUT } from "./PauseVisualPolicy.js";

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
  private initialStageSettleTimer: Phaser.Time.TimerEvent | null = null;
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
  private rewardTimer: Phaser.Time.TimerEvent | null = null;
  private rewardTween: Phaser.Tweens.Tween | null = null;
  private rewardDimTween: Phaser.Tweens.Tween | null = null;
  private rewardTransitionImage: Phaser.GameObjects.Image | null = null;
  private rewardTransitionDim: Phaser.GameObjects.Rectangle | null = null;
  private currentArtworkVisual: Phaser.GameObjects.Image | null = null;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;
  private pauseTween: Phaser.Tweens.Tween | null = null;
  private pauseClosing = false;
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
    private readonly locale: SupportedLocale = DEFAULT_LOCALE,
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
    ensureBoardRuntimeAtlas(this, this.renderScale);
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
      this.clearInitialStageSettle();
      this.clearHintFeedback();
      this.clearPauseOverlayImmediately();
      this.cleanupRewardPresentation();
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
    this.clearPauseOverlayImmediately();
    this.completeOverlay?.destroy(true);
    this.completeOverlay = null;
    this.cleanupRewardPresentation();
    this.destroyBoardVisuals();
    this.setGameplayHudVisible(true);
    this.selected = null;
    this.inputLocked = true;

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
    } else {
      this.initialStageSettleTimer = this.time.delayedCall(
        GAMEPLAY_FEEDBACK.initialStageSettleDuration,
        () => {
          this.initialStageSettleTimer = null;
          this.inputLocked = false;
        },
      );
    }
  }

  private clearInitialStageSettle(): void {
    this.initialStageSettleTimer?.remove(false);
    this.initialStageSettleTimer = null;
  }

  private destroyBoardVisuals(): void {
    this.clearInitialStageSettle();
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
    const visual = new TileVisual(this, x, y, definition, this.renderScale);
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
    const sourceArtwork = this.currentArtworkVisual;
    if (artwork === undefined || sourceArtwork === null || !this.textures.exists(artwork.fullAssetKey)) {
      this.showComplete();
      return;
    }
    this.clearPauseOverlayImmediately();
    this.clearHintFeedback();
    this.setGameplayHudVisible(false);
    this.inputLocked = true;
    const sourceBounds = sourceArtwork.getBounds();
    const motion = getRewardMotionPolicy(this.prefersReducedMotion());
    this.rewardTimer = this.time.delayedCall(motion.holdDuration, () => {
      this.rewardTimer = null;
      if (!this.sys.isActive() || this.artworkPresentation !== null) return;
      const backdrop = this.add.rectangle(
        240, 400, 480, 800, VISUAL_COLORS.bg.app.phaser,
      ).setAlpha(0).setInteractive();
      const settledDim = this.add.rectangle(
        240, 400, 480, 800, VISUAL_COLORS.overlay.modal.phaser,
      ).setAlpha(0).setInteractive();
      this.artworkPresentation = this.add.container(0, 0, [backdrop, settledDim]).setDepth(40);
      const transitionDim = this.add.rectangle(
        240, 400, 480, 800, VISUAL_COLORS.overlay.modal.phaser,
      ).setAlpha(0).setDepth(39).setInteractive();
      const transitionImage = this.add.image(
        motion.spatialTravel ? sourceBounds.centerX : REWARD_LAYOUT.artwork.centerX,
        motion.spatialTravel ? sourceBounds.centerY : REWARD_LAYOUT.artwork.centerY,
        artwork.fullAssetKey,
      ).setDisplaySize(
        motion.spatialTravel ? sourceBounds.width : REWARD_LAYOUT.artwork.width,
        motion.spatialTravel ? sourceBounds.height : REWARD_LAYOUT.artwork.height,
      ).setDepth(42).setAlpha(motion.spatialTravel ? 1 : 0);
      this.rewardTransitionImage = transitionImage;
      this.rewardTransitionDim = transitionDim;
      sourceArtwork.setVisible(false);
      setPageDim(REWARD_TRANSITION_DIM_ALPHA, motion.transitionDuration);
      const targetScale = REWARD_LAYOUT.artwork.width / transitionImage.width;
      this.rewardTween = this.tweens.add({
        targets: transitionImage,
        x: REWARD_LAYOUT.artwork.centerX, y: REWARD_LAYOUT.artwork.centerY,
        scaleX: targetScale, scaleY: targetScale, alpha: 1,
        duration: motion.transitionDuration, ease: "Quad.Out",
        onComplete: () => {
          this.rewardTween = null;
          this.rewardDimTween?.stop();
          this.rewardDimTween = null;
          backdrop.setAlpha(1);
          settledDim.setAlpha(REWARD_TRANSITION_DIM_ALPHA);
          transitionDim.destroy();
          this.rewardTransitionDim = null;
          this.destroyBoardVisuals();
          transitionImage.destroy();
          this.rewardTransitionImage = null;
          this.populateRewardPresentation(artwork.fullAssetKey);
        },
      });
      this.rewardDimTween = this.tweens.add({
        targets: transitionDim, alpha: REWARD_TRANSITION_DIM_ALPHA,
        duration: motion.transitionDuration, ease: "Linear",
      });
      this.tweens.add({
        targets: [this.currentBoardVisual, this.stageStackVisual], alpha: 0,
        duration: motion.transitionDuration, ease: "Quad.Out",
      });
    });
  }

  private populateRewardPresentation(textureKey: string): void {
    if (this.artworkPresentation === null) return;
    const { artwork } = REWARD_LAYOUT;
    const image = this.add.image(artwork.centerX, artwork.centerY, textureKey)
      .setDisplaySize(artwork.width, artwork.height);
    const border = this.add.graphics().lineStyle(BORDERS.emphasized, VISUAL_COLORS.accent.gold.phaser, 1)
      .strokeRect(artwork.x, artwork.y, artwork.width, artwork.height);
    const strings = getUiStrings(this.locale);
    const chapter = getLevelChapterPresentation(this.currentLevelNumber).number;
    const heading = createUiText(this, this.renderScale, REWARD_LAYOUT.heading.centerX,
      REWARD_LAYOUT.heading.top, strings.rewardHeading, "screenTitle", { align: "center" }).setOrigin(0.5, 0);
    const chapterLabel = createUiText(this, this.renderScale, REWARD_LAYOUT.chapter.centerX,
      REWARD_LAYOUT.chapter.top, strings.chapterHeader(chapter, getChapterTitle(this.locale, chapter)),
      "body", { color: VISUAL_COLORS.text.secondary.hex, align: "center" }).setOrigin(0.5, 0);
    const continueButton = createPrimaryButton(this, this.renderScale, {
      x: REWARD_LAYOUT.continueButton.centerX, y: REWARD_LAYOUT.continueButton.centerY,
      width: REWARD_LAYOUT.continueButton.width, height: REWARD_LAYOUT.continueButton.height,
      label: strings.rewardContinue, onActivate: () => {
        this.cleanupRewardPresentation(false);
        this.showComplete();
      },
    });
    this.artworkPresentation.add([image, border, heading, chapterLabel, continueButton.container]);
  }

  private cleanupRewardPresentation(resetOuterDim = true): void {
    if (resetOuterDim) resetPageDim();
    this.rewardTimer?.remove(false);
    this.rewardTimer = null;
    this.rewardTween?.stop();
    this.rewardTween = null;
    this.rewardDimTween?.stop();
    this.rewardDimTween = null;
    this.rewardTransitionImage?.destroy();
    this.rewardTransitionImage = null;
    this.rewardTransitionDim?.destroy();
    this.rewardTransitionDim = null;
    this.artworkPresentation?.destroy(true);
    this.artworkPresentation = null;
  }

  private showComplete(): void {
    this.clearPauseOverlayImmediately();
    setPageDim(VISUAL_COLORS.overlay.modal.alpha, 0);
    this.clearHintFeedback();
    this.setGameplayHudVisible(false);
    const campaignComplete = !hasNextLevel(this.currentLevelNumber);
    const strings = getUiStrings(this.locale);
    const shell = createModalShell(this, {
      x: COMPLETE_LAYOUT.panel.centerX, y: COMPLETE_LAYOUT.panel.centerY,
      width: COMPLETE_LAYOUT.panel.width, height: COMPLETE_LAYOUT.panel.height,
    });
    const title = createUiText(this, this.renderScale, 240, COMPLETE_LAYOUT.titleY,
      campaignComplete ? strings.campaignComplete : strings.levelComplete,
      "sectionHeading", { align: "center" }).setOrigin(0.5);
    const nextButton = createPrimaryButton(this, this.renderScale, {
      x: 240, y: COMPLETE_LAYOUT.primaryY, width: COMPLETE_LAYOUT.buttonWidth,
      height: COMPLETE_LAYOUT.buttonHeight,
      label: campaignComplete ? strings.restartFromLevelOne : strings.nextLevel,
      onActivate: () => {
        this.currentLevelNumber = campaignComplete ? 1 : this.currentLevelNumber + 1;
        this.startLevel();
      },
    });
    const replayButton = createSecondaryButton(this, this.renderScale, {
      x: 240, y: COMPLETE_LAYOUT.replayY, width: COMPLETE_LAYOUT.buttonWidth,
      height: COMPLETE_LAYOUT.buttonHeight, label: strings.replayLevel, onActivate: () => this.startLevel(),
    });
    const menuButton = createSecondaryButton(this, this.renderScale, {
      x: 240, y: COMPLETE_LAYOUT.menuY, width: COMPLETE_LAYOUT.buttonWidth,
      height: COMPLETE_LAYOUT.buttonHeight, label: strings.menu,
      onActivate: () => this.scene.start("MainMenuScene"),
    });
    this.completeOverlay = this.add.container(0, 0, [
      shell, title, nextButton.container, replayButton.container, menuButton.container,
    ]).setDepth(40);
  }

  private showPause(): void {
    if (this.inputLocked || this.hintActive || this.completeOverlay !== null
      || this.artworkPresentation !== null || this.pauseOverlay !== null) return;
    this.showPauseMenu(true);
  }

  private showPauseMenu(animateEntry = false): void {
    const strings = getUiStrings(this.locale);
    this.replacePauseOverlay(
      strings.pauseTitle,
      undefined,
      [
        { label: strings.pauseResume, kind: "primary", action: () => this.dismissPauseOverlay() },
        { label: strings.pauseRestart, kind: "secondary", action: () => this.showRestartConfirmation() },
        { label: strings.pauseExit, kind: "secondary", action: () => this.showExitConfirmation() },
      ],
      animateEntry,
    );
  }

  private showRestartConfirmation(): void {
    const strings = getUiStrings(this.locale);
    this.replacePauseOverlay(
      strings.restartConfirmTitle,
      strings.restartConfirmBody,
      [
        { label: strings.cancel, kind: "primary", action: () => this.showPauseMenu() },
        { label: strings.restartConfirmAction, kind: "danger", action: () => this.dismissPauseOverlay(() => this.startLevel()) },
      ],
    );
  }

  private showExitConfirmation(): void {
    const strings = getUiStrings(this.locale);
    this.replacePauseOverlay(
      strings.exitConfirmTitle,
      strings.exitConfirmBody,
      [
        { label: strings.cancel, kind: "primary", action: () => this.showPauseMenu() },
        { label: strings.exitConfirmAction, kind: "danger", action: () => this.dismissPauseOverlay(() => this.scene.start("MainMenuScene")) },
      ],
    );
  }

  private replacePauseOverlay(
    titleCopy: string,
    message: string | undefined,
    actions: readonly { readonly label: string; readonly kind: "primary" | "secondary" | "danger"; readonly action: () => void }[],
    animateEntry = false,
  ): void {
    if (this.pauseClosing) return;
    const shell = createModalShell(this, {
      x: PAUSE_LAYOUT.panel.centerX, y: PAUSE_LAYOUT.panel.centerY,
      width: PAUSE_LAYOUT.panel.width, height: PAUSE_LAYOUT.panel.height, borderRole: "soft",
    });
    const title = createUiText(this, this.renderScale, PAUSE_LAYOUT.title.centerX,
      PAUSE_LAYOUT.title.centerY, titleCopy, "sectionHeading", { align: "center" }).setOrigin(0.5);
    const objects: Phaser.GameObjects.GameObject[] = [shell, title];
    if (message !== undefined) {
      objects.push(createUiText(this, this.renderScale, PAUSE_LAYOUT.body.centerX,
        PAUSE_LAYOUT.body.centerY, message, "body", {
          color: VISUAL_COLORS.text.secondary.hex, align: "center",
        }).setOrigin(0.5));
    }
    actions.forEach(({ label, kind, action }, index) => {
      const y = message === undefined
        ? PAUSE_LAYOUT.pauseButtonCenters[index]!
        : index === 0 ? PAUSE_LAYOUT.confirmationButtonCenters.safe : PAUSE_LAYOUT.confirmationButtonCenters.danger;
      const factory = kind === "primary" ? createPrimaryButton
        : kind === "danger" ? createDangerButton : createSecondaryButton;
      const button = factory(this, this.renderScale, {
        x: PAUSE_LAYOUT.button.centerX, y, width: PAUSE_LAYOUT.button.width,
        height: PAUSE_LAYOUT.button.height, label,
        onActivate: () => { if (!this.pauseClosing) action(); },
      });
      objects.push(button.container);
    });
    if (this.pauseOverlay === null) {
      this.pauseOverlay = this.add.container(0, 0, objects).setDepth(50);
    } else {
      this.pauseOverlay.removeAll(true);
      this.pauseOverlay.add(objects);
    }
    if (animateEntry) {
      const motion = getPauseMotionPolicy(this.prefersReducedMotion());
      this.pauseOverlay.setAlpha(0);
      setPageDim(VISUAL_COLORS.overlay.modal.alpha, motion.enterDuration);
      this.pauseTween = this.tweens.add({
        targets: this.pauseOverlay, alpha: 1, duration: motion.enterDuration, ease: PAUSE_FADE_EASE,
        onComplete: () => { this.pauseTween = null; },
      });
    }
  }

  private dismissPauseOverlay(afterDismiss?: () => void): void {
    if (this.pauseOverlay === null || this.pauseClosing) return;
    this.pauseClosing = true;
    const overlay = this.pauseOverlay;
    const motion = getPauseMotionPolicy(this.prefersReducedMotion());
    setPageDim(0, motion.exitDuration);
    this.pauseTween?.stop();
    this.pauseTween = this.tweens.add({
      targets: overlay, alpha: 0, duration: motion.exitDuration, ease: PAUSE_FADE_EASE,
      onComplete: () => {
        this.pauseTween = null;
        if (this.pauseOverlay === overlay) {
          overlay.destroy(true);
          this.pauseOverlay = null;
        }
        this.pauseClosing = false;
        afterDismiss?.();
      },
    });
  }

  private clearPauseOverlayImmediately(): void {
    const ownedPageDim = this.pauseOverlay !== null;
    this.pauseTween?.stop();
    this.pauseTween = null;
    this.pauseOverlay?.destroy(true);
    this.pauseOverlay = null;
    this.pauseClosing = false;
    if (ownedPageDim) resetPageDim();
  }
}
