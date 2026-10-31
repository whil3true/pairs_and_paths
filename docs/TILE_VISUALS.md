# Production tile visuals

The approved set is **V5.4.1**. Its intentionally historical runtime path is
`public/assets/symbols/v3/`; texture keys are `tile-symbol-v3-NAME`. Never identify obsolete art
from the directory version alone. Every catalog PNG has a 256×256 8-bit RGBA authored canvas,
presented at 56 logical pixels with its transparent padding intact.

## Exact TileId mapping

| ID | Symbol | ID | Symbol | ID | Symbol |
| --- | --- | --- | --- | --- | --- |
| 1 | cup | 11 | bell | 21 | mushroom |
| 2 | teapot | 12 | compass | 22 | crystal |
| 3 | sun | 13 | camera | 23 | jam-jar |
| 4 | cloud | 14 | mountain | 24 | heart |
| 5 | key | 15 | planet | 25 | butterfly |
| 6 | leaf | 16 | shell | 26 | snowflake |
| 7 | feather | 17 | wave | 27 | moon |
| 8 | flower | 18 | lightning | 28 | star |
| 9 | clover | 19 | fish | 29 | lantern |
| 10 | acorn | 20 | flame | 30 | gem |

`TileSymbols.ts` is authoritative. Current campaign IDs reach 22; entries 23–30 remain approved
catalog assets and are used by the diagnostic gallery. Do not trim them to the campaign maximum.
`preloadTileSymbols` skips cached textures; `BoardRuntimeAtlas` bakes the catalog/card states once
per density/version; `TileVisual` uses those frames and a separate persistent inset hint outline.

## Historical decisions to retain

Early SVG/tint rendering produced black squares and inconsistent Android rasterization. PNG
runtime textures avoid that dependency. The root-level prototype PNG/SVG catalog, 12-symbol pilot
and v2 exports have been superseded; their exact deletion evidence belongs in the repository audit.
They are not the source masters of V5.4.1. The corrected production cup is the byte version present
in audited `dev` (`aa734d0` updated it), not an older pilot cup.

## Visual QA

`?debug=1&symbols=1` renders all 30 entries using the real catalog/atlas. Check transparency,
consistent scale and padding, cup balance, no missing textures/black squares, and identical gallery
versus gameplay artwork. Compare Level 1/80 and legacy `&renderScale=1` versus default density.
Hint outlines must stay inside the tile, survive unrelated removals and coexist with selected/error
states. Full device checks are in `TESTING.md`.
