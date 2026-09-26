# Tile visual system

Tiles use a deterministic, symbol-first visual vocabulary. `TileId` remains the domain identity; the presentation catalog maps IDs 1..30 to local SVG assets and one of six reusable accents. Because many unrelated symbols share an accent, color is a secondary recognition cue rather than a unique answer. The normal game shows no numeric tile label.

## Catalog order

The order follows campaign exposure. The first eight deliberately emphasize strongly different outer silhouettes; later entries introduce related natural and geometric families without near-duplicate traps.

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

All artwork is project-local, original simple vector geometry in square, transparent SVGs under `public/assets/symbols`. Thick strokes and low detail target recognition at the 36–48 px sizes reached by the 480×800 layout. These assets are a strong visual-difficulty prototype, not final production illustration.

The catalog ordering and small palette intentionally make visual search depend on silhouette, raising realism relative to unique hues and large numbers without changing campaign content or rules. Phaser preloads each SVG from a relative static path; the existing build copies `public` unchanged.

Task 8 originally used white SVG strokes and applied the catalog accent with Phaser's runtime tint. Human QA on Android exposed a renderer-specific failure in which every symbol appeared as a solid black square, while cards, borders, positions, and gameplay remained correct. Task 8.1 therefore bakes each catalog accent into its SVG stroke and renders the source-colored image without runtime tint. Every SVG also declares an intrinsic 64×64 size. The same six colors are still reused across all 30 shapes, so recognition remains symbol-first and color remains secondary.

Task 8.2 normalizes the internal geometry that Task 8.1 deliberately did not alter. Every asset keeps the canonical `width="64"`, `height="64"`, and `viewBox="0 0 64 64"`. Artwork is optically centered around (32, 32), generally stays within an approximate x/y 8..56 safe box before stroke allowance, and retains enough outer padding for round five-pixel strokes. Natural proportions still differ—a cloud remains wide and a drop remains tall—but their apparent weight at tile size is comparable. Most originals use one clear uniform normalization transform; the moon path was redrawn because translating its old asymmetric artboard did not adequately center the visible crescent.

## Manual visual QA

Open `?debug=1&symbols=1` for the developer-only 5×6 contact sheet. It loads the same catalog, Phaser SVG textures, display ratio, and neutral card treatment as gameplay, and labels each entry for diagnosis. Without both query flags, the normal campaign starts unchanged.

On the gallery, inspect all 30 symbols together: confirm that the moon's visible crescent is centered, strokes do not clip, paths are not distorted, apparent sizes are consistent, no artwork is strongly shifted on either axis, all six colors are correct, and every silhouette remains recognizable. Then compare the real renderer at `?debug=1&level=1` and `?debug=1&level=80`.

Use the existing developer jump at Levels **1, 5, 10, 21, 35, 48, 59, 68, 80, 82, 94, and 100**, for example `?debug=1&level=80`. On an Android device, confirm that source-colored symbols render as line artwork rather than black squares in both available Canvas/WebGL paths. Also confirm symbol readability, shared-color disambiguation, selection scale/yellow border, blocked-pair red feedback, and unchanged route animation. Pay particular attention to the late 6×8 boards with 21–22 pairs.
