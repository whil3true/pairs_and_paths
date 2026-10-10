import { TILE_SYMBOLS, type TileSymbolDefinition } from "./TileSymbols.js";
import { BORDERS, COMPONENT_RADII, MOTION, VISUAL_COLORS } from "./VisualTokens.js";

export const BOARD_RUNTIME_ATLAS_VERSION = 1;
export const BOARD_RUNTIME_ATLAS_COLUMNS = 6;
export const BOARD_RUNTIME_ATLAS_ROWS = 6;
export const BOARD_RUNTIME_ATLAS_GUARD = 3;

export const TILE_VISUAL_STYLE = Object.freeze({
  size: 56,
  radius: COMPONENT_RADII.tile,
  fill: VISUAL_COLORS.surface.card.phaser,
  pressedFill: VISUAL_COLORS.state.pressedFill.phaser,
  border: VISUAL_COLORS.divider.phaser,
  selectedBorder: VISUAL_COLORS.route.core.phaser,
  selectedFill: VISUAL_COLORS.state.selectedFill.phaser,
  selectedMarker: false,
  hintBorder: VISUAL_COLORS.state.hint.phaser,
  blockedBorder: VISUAL_COLORS.state.danger.phaser,
  borderWidth: BORDERS.divider,
  emphasizedBorderWidth: BORDERS.emphasized,
  hintInnerBorderWidth: 1,
  hintInnerInset: 5,
  hintInnerRadius: COMPONENT_RADII.tile - 3,
  pressedScale: 0.96,
  pressedDuration: MOTION.tilePress,
});

export type TileCardFrame = "default" | "pressed" | "selected" | "hint" | "blocked";

export interface CardFrameDefinition {
  readonly state: TileCardFrame;
  readonly frameName: `tile/${TileCardFrame}`;
  readonly fill: number;
  readonly border: number;
  readonly borderWidth: number;
  readonly innerBorderWidth: number;
}

export const BOARD_CARD_FRAMES: readonly CardFrameDefinition[] = Object.freeze([
  { state: "default", frameName: "tile/default", fill: TILE_VISUAL_STYLE.fill,
    border: TILE_VISUAL_STYLE.border, borderWidth: TILE_VISUAL_STYLE.borderWidth, innerBorderWidth: 0 },
  { state: "pressed", frameName: "tile/pressed", fill: TILE_VISUAL_STYLE.pressedFill,
    border: TILE_VISUAL_STYLE.border, borderWidth: TILE_VISUAL_STYLE.borderWidth, innerBorderWidth: 0 },
  { state: "selected", frameName: "tile/selected", fill: TILE_VISUAL_STYLE.selectedFill,
    border: TILE_VISUAL_STYLE.selectedBorder, borderWidth: TILE_VISUAL_STYLE.emphasizedBorderWidth,
    innerBorderWidth: 0 },
  { state: "hint", frameName: "tile/hint", fill: TILE_VISUAL_STYLE.fill,
    border: TILE_VISUAL_STYLE.hintBorder, borderWidth: TILE_VISUAL_STYLE.emphasizedBorderWidth,
    innerBorderWidth: TILE_VISUAL_STYLE.hintInnerBorderWidth },
  { state: "blocked", frameName: "tile/blocked", fill: TILE_VISUAL_STYLE.fill,
    border: TILE_VISUAL_STYLE.blockedBorder, borderWidth: TILE_VISUAL_STYLE.emphasizedBorderWidth,
    innerBorderWidth: 0 },
]);

export const getBoardSymbolFrameName = (assetKey: string): `symbol/${string}` => `symbol/${assetKey}`;

export const BOARD_SYMBOL_FRAMES = Object.freeze(TILE_SYMBOLS.map((definition) => Object.freeze({
  definition,
  frameName: getBoardSymbolFrameName(definition.assetKey),
})));

export interface AtlasPlacement {
  readonly frameName: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BoardRuntimeAtlasLayout {
  readonly renderScale: number;
  readonly physicalScale: number;
  readonly guardPx: number;
  readonly visualContentPx: number;
  readonly slotPx: number;
  readonly columns: number;
  readonly rows: number;
  readonly atlasWidthPx: number;
  readonly atlasHeightPx: number;
  readonly logicalSlotSize: number;
  readonly textureKey: string;
  readonly placements: readonly AtlasPlacement[];
}

export function computeBoardRuntimeAtlasLayout(renderScale: number): BoardRuntimeAtlasLayout {
  if (!Number.isFinite(renderScale) || renderScale <= 0) throw new RangeError("renderScale must be positive and finite");
  const visualContentPx = Math.max(1, Math.round(TILE_VISUAL_STYLE.size * renderScale));
  const physicalScale = visualContentPx / TILE_VISUAL_STYLE.size;
  const guardPx = Math.max(1, Math.ceil(BOARD_RUNTIME_ATLAS_GUARD * physicalScale));
  const slotPx = visualContentPx + guardPx * 2;
  const names = [
    ...BOARD_CARD_FRAMES.map(({ frameName }) => frameName),
    ...BOARD_SYMBOL_FRAMES.map(({ frameName }) => frameName),
  ];
  const placements = names.map((frameName, index) => Object.freeze({
    frameName,
    x: (index % BOARD_RUNTIME_ATLAS_COLUMNS) * slotPx,
    y: Math.floor(index / BOARD_RUNTIME_ATLAS_COLUMNS) * slotPx,
    width: slotPx,
    height: slotPx,
  }));
  return Object.freeze({
    renderScale,
    physicalScale,
    guardPx,
    visualContentPx,
    slotPx,
    columns: BOARD_RUNTIME_ATLAS_COLUMNS,
    rows: BOARD_RUNTIME_ATLAS_ROWS,
    atlasWidthPx: BOARD_RUNTIME_ATLAS_COLUMNS * slotPx,
    atlasHeightPx: BOARD_RUNTIME_ATLAS_ROWS * slotPx,
    logicalSlotSize: slotPx / physicalScale,
    textureKey: `board-runtime-atlas-v${BOARD_RUNTIME_ATLAS_VERSION}-${visualContentPx}-${guardPx}`,
    placements: Object.freeze(placements),
  });
}

const cssColor = (value: number): string => `#${value.toString(16).padStart(6, "0")}`;

function roundedRect(
  context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number,
): void {
  const right = x + width;
  const bottom = y + height;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(right - radius, y);
  context.arcTo(right, y, right, y + radius, radius);
  context.lineTo(right, bottom - radius);
  context.arcTo(right, bottom, right - radius, bottom, radius);
  context.lineTo(x + radius, bottom);
  context.arcTo(x, bottom, x, bottom - radius, radius);
  context.lineTo(x, y + radius);
  context.arcTo(x, y, x + radius, y, radius);
  context.closePath();
}

function drawCard(
  context: CanvasRenderingContext2D,
  placement: AtlasPlacement,
  definition: CardFrameDefinition,
  layout: BoardRuntimeAtlasLayout,
): void {
  const x = placement.x + layout.guardPx;
  const y = placement.y + layout.guardPx;
  const size = layout.visualContentPx;
  const radius = Math.round(TILE_VISUAL_STYLE.radius * layout.physicalScale);
  roundedRect(context, x, y, size, size, radius);
  context.fillStyle = cssColor(definition.fill);
  context.fill();
  context.strokeStyle = cssColor(definition.border);
  context.lineWidth = Math.max(1, Math.round(definition.borderWidth * layout.physicalScale));
  context.stroke();
  if (definition.innerBorderWidth > 0) {
    const inset = Math.round(TILE_VISUAL_STYLE.hintInnerInset * layout.physicalScale);
    roundedRect(context, x + inset, y + inset, size - inset * 2, size - inset * 2,
      Math.round(TILE_VISUAL_STYLE.hintInnerRadius * layout.physicalScale));
    context.lineWidth = Math.max(1, Math.round(definition.innerBorderWidth * layout.physicalScale));
    context.stroke();
  }
}

function sourceImage(scene: Phaser.Scene, definition: TileSymbolDefinition): CanvasImageSource & { width: number; height: number } {
  if (!scene.textures.exists(definition.assetKey)) {
    throw new Error(`Board runtime atlas source texture is missing: ${definition.assetKey}`);
  }
  const source = scene.textures.get(definition.assetKey).getSourceImage() as CanvasImageSource & {
    width: number; height: number;
  };
  if (!(source.width > 0) || !(source.height > 0)) {
    throw new Error(`Board runtime atlas source texture has invalid dimensions: ${definition.assetKey}`);
  }
  return source;
}

function verifyFrames(texture: Phaser.Textures.Texture, layout: BoardRuntimeAtlasLayout): void {
  for (const { frameName } of layout.placements) {
    if (!texture.has(frameName)) throw new Error(`Board runtime atlas is missing required frame: ${frameName}`);
  }
}

/** Builds the game-global immutable tile atlas once after source textures have loaded. */
export function ensureBoardRuntimeAtlas(scene: Phaser.Scene, renderScale: number): BoardRuntimeAtlasLayout {
  const layout = computeBoardRuntimeAtlasLayout(renderScale);
  for (const { definition } of BOARD_SYMBOL_FRAMES) sourceImage(scene, definition);
  if (scene.textures.exists(layout.textureKey)) {
    verifyFrames(scene.textures.get(layout.textureKey), layout);
    return layout;
  }
  const texture = scene.textures.createCanvas(layout.textureKey, layout.atlasWidthPx, layout.atlasHeightPx);
  if (texture === null) throw new Error(`Unable to create board runtime atlas: ${layout.textureKey}`);
  const context = texture.getContext();
  context.clearRect(0, 0, layout.atlasWidthPx, layout.atlasHeightPx);
  BOARD_CARD_FRAMES.forEach((definition, index) => drawCard(context, layout.placements[index]!, definition, layout));
  BOARD_SYMBOL_FRAMES.forEach(({ definition }, symbolIndex) => {
    const placement = layout.placements[BOARD_CARD_FRAMES.length + symbolIndex]!;
    const source = sourceImage(scene, definition);
    const targetPx = Math.round(definition.displaySize * layout.physicalScale);
    const scale = Math.min(targetPx / source.width, targetPx / source.height);
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const x = placement.x + Math.floor((layout.slotPx - width) / 2);
    const y = placement.y + Math.floor((layout.slotPx - height) / 2);
    context.drawImage(source, x, y, width, height);
  });
  for (const placement of layout.placements) {
    if (texture.add(placement.frameName, 0, placement.x, placement.y, placement.width, placement.height) === null) {
      throw new Error(`Unable to add board runtime atlas frame: ${placement.frameName}`);
    }
  }
  texture.refresh();
  verifyFrames(texture, layout);
  return layout;
}
