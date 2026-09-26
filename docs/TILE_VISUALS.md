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

## Manual visual QA

Use the existing developer jump at Levels **1, 5, 10, 21, 35, 48, 59, 68, 80, 82, 94, and 100**, for example `?debug=1&level=80`. Confirm symbol readability, shared-color disambiguation, selection scale/yellow border, blocked-pair red feedback, and unchanged route animation. Pay particular attention to the late 6×8 boards with 21–22 pairs.
