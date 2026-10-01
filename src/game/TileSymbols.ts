export interface TileSymbolDefinition {
  readonly name: string;
  readonly assetKey: string;
  readonly assetPath: string;
  readonly artwork: "production-pilot" | "legacy-placeholder";
}

const symbol = (name: string, artwork: TileSymbolDefinition["artwork"]): TileSymbolDefinition => Object.freeze({
  name,
  assetKey: `tile-symbol-${artwork}-${name}`,
  assetPath: artwork === "production-pilot"
    ? `assets/production-pilot/symbols/${name}.png`
    : `assets/symbols/${name}.png`,
  artwork,
});

const pilot = (name: string): TileSymbolDefinition => symbol(name, "production-pilot");
const legacy = (name: string): TileSymbolDefinition => symbol(name, "legacy-placeholder");

/** Ordered visual vocabulary: TileId 1 maps to entry 0. Keep early entries especially distinct. */
export const TILE_SYMBOLS: readonly TileSymbolDefinition[] = Object.freeze([
  pilot("cup"), pilot("teapot"), legacy("sun"), legacy("cloud"), legacy("key"),
  pilot("leaf"), pilot("feather"), pilot("flower"), legacy("clover"), legacy("acorn"),
  legacy("bell"), pilot("compass"), pilot("camera"), legacy("mountain"), legacy("planet"),
  pilot("shell"), legacy("wave"), legacy("lightning"), legacy("fish"), legacy("flame"),
  legacy("mushroom"), legacy("crystal"), pilot("jam-jar"), legacy("heart"), legacy("butterfly"),
  pilot("snowflake"), legacy("moon"), pilot("star"), pilot("lantern"), legacy("gem"),
]);

/** Loads the single shared symbol catalog into any scene that presents tiles. */
export function preloadTileSymbols(scene: Phaser.Scene): void {
  for (const definition of TILE_SYMBOLS) scene.load.image(definition.assetKey, definition.assetPath);
}

export function getTileSymbol(tileId: number): TileSymbolDefinition {
  if (!Number.isInteger(tileId) || tileId < 1 || tileId > TILE_SYMBOLS.length) {
    throw new RangeError(`No tile symbol for TileId ${tileId}`);
  }
  return TILE_SYMBOLS[tileId - 1]!;
}
