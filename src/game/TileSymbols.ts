export interface TileSymbolDefinition {
  readonly name: string;
  readonly assetKey: string;
  readonly assetPath: string;
  readonly accentIndex: number;
}

export const TILE_ACCENT_COLORS = Object.freeze([
  0x57c7ff, 0xffc857, 0xf27ca7, 0x79d49b, 0xa993ff, 0xff8a5b,
] as const);

const symbol = (name: string, accentIndex: number): TileSymbolDefinition => Object.freeze({
  name,
  assetKey: `tile-symbol-${name}`,
  assetPath: `assets/symbols/${name}.svg`,
  accentIndex,
});

/** Ordered visual vocabulary: TileId 1 maps to entry 0. Keep early entries especially distinct. */
export const TILE_SYMBOLS: readonly TileSymbolDefinition[] = Object.freeze([
  symbol("sun", 0), symbol("moon", 1), symbol("drop", 2), symbol("star", 3),
  symbol("leaf", 4), symbol("flame", 5), symbol("cloud", 0), symbol("mountain", 1),
  symbol("lightning", 2), symbol("flower", 3), symbol("gem", 4), symbol("fish", 5),
  symbol("feather", 0), symbol("mushroom", 1), symbol("shell", 2), symbol("key", 3),
  symbol("bell", 4), symbol("crown", 5), symbol("compass", 0), symbol("snowflake", 1),
  symbol("clover", 2), symbol("eye", 3), symbol("spiral", 4), symbol("wave", 5),
  symbol("acorn", 0), symbol("lantern", 1), symbol("butterfly", 2), symbol("crystal", 3),
  symbol("planet", 4), symbol("heart", 5),
]);

/** Loads the single shared symbol catalog into any scene that presents tiles. */
export function preloadTileSymbols(scene: Phaser.Scene): void {
  for (const definition of TILE_SYMBOLS) scene.load.svg(definition.assetKey, definition.assetPath);
}

export function getTileSymbol(tileId: number): TileSymbolDefinition {
  if (!Number.isInteger(tileId) || tileId < 1 || tileId > TILE_SYMBOLS.length) {
    throw new RangeError(`No tile symbol for TileId ${tileId}`);
  }
  return TILE_SYMBOLS[tileId - 1]!;
}
