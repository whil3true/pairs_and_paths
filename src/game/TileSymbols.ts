export const PRODUCTION_SYMBOL_DISPLAY_SIZE = 56;

export interface TileSymbolDefinition {
  readonly name: string;
  readonly assetKey: string;
  readonly assetPath: string;
  readonly artwork: "production-v2";
  /** Full authored 256x256 canvas, including its transparent padding. */
  readonly displaySize: typeof PRODUCTION_SYMBOL_DISPLAY_SIZE;
}

const symbol = (name: string): TileSymbolDefinition => Object.freeze({
  name,
  assetKey: `tile-symbol-v2-${name}`,
  assetPath: `assets/symbols/v2/${name}.png`,
  artwork: "production-v2",
  displaySize: PRODUCTION_SYMBOL_DISPLAY_SIZE,
});

/** Ordered visual vocabulary: TileId 1 maps to entry 0. Keep early entries especially distinct. */
export const TILE_SYMBOLS: readonly TileSymbolDefinition[] = Object.freeze([
  symbol("cup"), symbol("teapot"), symbol("sun"), symbol("cloud"), symbol("key"),
  symbol("leaf"), symbol("feather"), symbol("flower"), symbol("clover"), symbol("acorn"),
  symbol("bell"), symbol("compass"), symbol("camera"), symbol("mountain"), symbol("planet"),
  symbol("shell"), symbol("wave"), symbol("lightning"), symbol("fish"), symbol("flame"),
  symbol("mushroom"), symbol("crystal"), symbol("jam-jar"), symbol("heart"), symbol("butterfly"),
  symbol("snowflake"), symbol("moon"), symbol("star"), symbol("lantern"), symbol("gem"),
]);

/** Loads the single shared symbol catalog into any scene that presents tiles. */
export function preloadTileSymbols(scene: Phaser.Scene): void {
  for (const definition of TILE_SYMBOLS) {
    if (!scene.textures.exists(definition.assetKey)) scene.load.image(definition.assetKey, definition.assetPath);
  }
}

export function getTileSymbol(tileId: number): TileSymbolDefinition {
  if (!Number.isInteger(tileId) || tileId < 1 || tileId > TILE_SYMBOLS.length) {
    throw new RangeError(`No tile symbol for TileId ${tileId}`);
  }
  return TILE_SYMBOLS[tileId - 1]!;
}
