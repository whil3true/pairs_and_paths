# Tile visual system

Tiles use a deterministic, symbol-first visual vocabulary. `TileId` remains the domain identity; the presentation catalog maps IDs 1..30 to committed transparent PNG runtime textures and one of six reusable accent assignments. Because many unrelated symbols share an accent, color remains a secondary recognition cue rather than a unique answer. Numeric IDs are not visible during normal play.

## Catalog order

1. sun
2. moon
3. drop
4. star
5. leaf
6. flame
7. cloud
8. mountain
9. lightning
10. flower
11. gem
12. fish
13. feather
14. mushroom
15. shell
16. key
17. bell
18. crown
19. compass
20. snowflake
21. clover
22. eye
23. spiral
24. wave
25. acorn
26. lantern
27. butterfly
28. crystal
29. planet
30. heart

## Source and runtime assets

Task 8.3 separates editable source artwork from browser runtime textures:

- prototype SVG masters: `art/source/symbols/*.svg`;
- runtime textures: `public/assets/symbols/*.png`;
- runtime export size: 256×256, 8-bit RGBA with transparency;
- current display size: roughly 40–50 px depending on board layout.

The SVG masters are kept outside `public`, so the production build does not ship them. Phaser loads the committed PNG textures with its ordinary image loader. Runtime PNGs are generated artifacts, not the maximum authoring resolution: future themed artwork may be vector or much higher resolution and can be exported down to the runtime format.

Task 8 originally rendered SVGs directly. Android QA exposed runtime-tint black squares, and later QA exposed inconsistent SVG rasterization/geometry presentation. PNG runtime textures remove those renderer-specific dependencies while preserving the same current prototype artwork.

The current prototype drawings were intentionally rasterized as-is. Human QA has already identified **leaf, flame, mountain, gem, feather, shell, compass, clover, lantern, crystal, and planet** as visually imperfect. They are known temporary-art limitations and should be replaced or redesigned during the later full art-direction pass, not treated as final production icons.

## Manual visual QA

Open `?debug=1&symbols=1` for the developer-only 5×6 contact sheet. It uses the same PNG textures, catalog, card treatment, and approximate symbol-to-card ratio as gameplay.

After deployment verify:

- all 30 PNG symbols load;
- transparent backgrounds remain transparent;
- no black squares or missing textures appear;
- no unexpected pixelation appears at gameplay size;
- gallery and gameplay render the same artwork.

Then compare `?debug=1&level=1` and `?debug=1&level=80`. The known semantic/art-quality limitations listed above are deliberately deferred until the final visual theme is chosen.
