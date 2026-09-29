# VISUAL SPECIFICATION v1

**Project:** `whil3true/pairs_and_paths`  
**Production direction:** **Curated Cozy Places artwork + Warm Premium Cozy functional UI**  
**Working catalog title:** `Соедини пары: Уютная галерея`  
**Short in-product brand:** `Уютная галерея`  
**English working title:** `Pair Connect: Cozy Gallery`  
**Baseline:** `dev` at `3192ea29a163f227bdb3230372cddd18bed4c229`  
**Status:** implementation-ready source of truth for redesign v1  
**Date:** 29 September 2026

---

## 1. Purpose / scope

This document fixes the visual system for the production redesign. It governs UI, board presentation, tile cards and symbols, blockers, route, Hint, artwork generation and QA, export, catalog creatives, motion, accessibility, Android/HiDPI QA, and implementation order.

The product promise is:

> connect pairs → gradually reveal artwork → clean reward → persistent Gallery

When a mockup, generated asset, or implementation conflicts with this document, this document wins. The validated mockups are directional evidence, not pixel-perfect production layouts.

Decisions that still require a pilot use this format:

- **Default:** value to implement first.
- **Acceptable range:** bounded adjustment allowed without reopening art direction.
- **Validation:** exact QA that decides whether to retain or adjust the default.

Real-user testing is useful but is not a pre-production gate. Unverified cohort assumptions are marked `nice-to-have user validation`; device-dependent rendering is marked `needs real-device QA`.

---

## 2. Product constraints

The redesign must not change these invariants:

- Phaser 4 + TypeScript, HTML5, Yandex Games target.
- Permanent logical viewport: `480×800`; portrait-first. Desktop is a centered portrait game with gutters, not a desktop layout.
- 100 Levels; 10 Chapters × 10 Levels.
- `CELL_PITCH = 64`, `TILE_SIZE = 56`, intentional gap = `8` logical px.
- Maximum board: `7×7`, footprint `448×448`, bounds `[16,196]..[464,644]`.
- All board sizes use the same tile scale. Final campaign boards are square; authored pre-stages may be rectangular.
- Deterministic solvable generation, current seeds, pair counts, blocker coordinates, multi-stage composition, progression, persistence, loading boundaries, and Gallery unlock derivation remain unchanged.
- Artwork appears under tiles only on the final Stage. Blockers remain above artwork.
- Route movement is orthogonal, stays inside real board coordinates, transits only empty cells, has no virtual border and no hard turn limit. Pathfinder priority is minimum turns, then minimum length, then stable deterministic order.
- Hint highlights two endpoints for `900 ms`; it draws no route, removes no tiles, and changes no progress.
- Locked and unavailable Gallery assets are never loaded. Main Menu loads no artwork; active Gallery chapter loads only eligible unlocked thumbnails; Full View loads only the selected full image.
- Reward is shown after progress has been persisted; Continue proceeds into the existing completion flow. Replays may show the reward again.

Forbidden copy: **never** state or imply `не более двух поворотов`.

Approved short instruction:

> Соединяйте одинаковые плитки свободным путём по пустым клеткам и открывайте картинку.

---

## 3. Brand / visual principles

### 3.1 Functional layer

The functional layer is calm, high-contrast, opaque, and predictable:

- warm ivory/oat surfaces;
- very dark charcoal text;
- deep teal primary actions and active selection;
- warm gold for Hint, current frontier, and reward framing;
- muted coral only as a secondary accent, never as the sole carrier of status;
- rounded geometry with visible borders and restrained depth;
- no text directly over artwork unless it sits on an opaque or sufficiently dark scrim;
- no state expressed by colour alone.

### 3.2 Emotional layer

Artwork and small decorative fields may use softer pastels, paper grain, gouache variation, chapter palettes, and hand-made imperfection. Decorative softness must never lower control, text, symbol, route, or state contrast.

### 3.3 Must not resemble

- sterile Apple-style minimalism;
- low-contrast pastel UI;
- hypercasual candy UI;
- glassmorphism or glow-dependent controls;
- generic thin-line mobile templates;
- generic “beige room + plants” AI output;
- cinematic fantasy unrelated to the chapter;
- a living artist’s recognizable style.

### 3.4 Priority order

1. Recognize tile identity and state.
2. Understand the next action.
3. Read Level/Stage/pairs information.
4. Perceive artwork reveal.
5. Appreciate texture and decoration.

If beauty conflicts with items 1–4, beauty loses.

---

## 4. Color tokens

All HEX values are sRGB. RGB is given as `r,g,b`. Alpha tokens are stated separately. Contrast targets use WCAG-style ratios as a practical QA proxy even though the game canvas is not ordinary HTML text.

### 4.1 Core palette

| Token | HEX / RGB | Intended use | Required pairing / target | Do not use |
|---|---|---|---|---|
| `bg.app` | `#F5EEDF` / 245,238,223 | app background, safe gutters | `text.primary` 10.6:1 | white text; gold text |
| `surface.elevated` | `#FFFDF8` / 255,253,248 | modal, top-level panels | `text.primary` 12.1:1 | unbordered over artwork |
| `surface.card` | `#FFFBF3` / 255,251,243 | cards, buttons, tile cards | `text.primary` 11.9:1 | translucent gameplay tile |
| `surface.board` | `#E7DCC8` / 231,220,200 | non-art board interior and pre-stage backing | `text.primary` 9.1:1 | symbol identity background without tile card |
| `primary.teal` | `#176B69` / 23,107,105 | primary button, selected border, active state | white 6.3:1 | large decorative fields in every artwork |
| `primary.tealPressed` | `#105452` / 16,84,82 | pressed primary button | white 8.7:1 | default action fill |
| `primary.tealDisabled` | `#D3DED9` / 211,222,217 | disabled control fill | `#50605C` 4.8:1 | white label; active state |
| `text.primary` | `#26383A` / 38,56,58 | titles, body, numerals, borders where specified | ≥7:1 preferred | on dark artwork without scrim |
| `text.secondary` | `#586260` / 88,98,96 | supporting labels | 5.5:1 on `bg.app` | critical 14 px text |
| `text.tertiary` | `#606A67` / 96,106,103 | metadata, optional captions | 4.8:1 on `bg.app` | disabled-by-opacity labels |
| `accent.coral` | `#C96E5B` / 201,110,91 | decorative accent, icon sub-colour, chapter art cue | non-text or ≥3:1 shape boundary | body text; white text; sole status cue |
| `accent.gold` | `#D49A35` / 212,154,53 | reward frame, progress fill, decorative highlight | `text.primary` 5.0:1 | white text; route core |
| `state.success` | `#2D7464` / 45,116,100 | completed fill/accent | white 5.5:1 | selected state without check glyph |
| `state.locked` | `#7C8685` / 124,134,133 | lock glyph/border | use with pale locked fill and dark labels | white small text; opacity-only lock |
| `state.lockedFill` | `#E3E1DA` / 227,225,218 | locked card fill | `text.primary` 9.4:1 | unlocked thumbnail placeholder |
| `state.selectedFill` | `#D7E8E3` / 215,232,227 | selected/current pale fill | `text.primary` 9.7:1 | Hint fill |
| `state.hint` | `#C98519` / 201,133,25 | Hint ring and bulb glyph | paired with double ring/pulse | route; normal selection |
| `state.hintFill` | `#F2DDB5` / 242,221,181 | optional Hint wash | `text.primary` 9.2:1 | entire board flash |
| `route.core` | `#0B7475` / 11,116,117 | successful route center line | `route.halo` contrast ≈5:1 | Hint endpoints |
| `route.halo` | `#FFF3D2` / 255,243,210 | route isolation on bright/dark art | always under core | line without core |
| `blocker.fill` | `#62645E` / 98,100,94 | stone terrain body | ivory relief glyph + distinct shape | recoloured tile card |
| `blocker.dark` | `#3F4543` / 63,69,67 | blocker edge/cracks/shadow | ≥3:1 boundary against ivory tiles | text |
| `border.strong` | `#344346` / 52,67,70 | tile, board, modal, primary structural border | visible at low brightness | hairline-only controls |
| `border.soft` | `#C9BEAA` / 201,190,170 | card boundary on ivory/oat | non-text boundary | selected/current border |
| `divider` | `#D9CDB8` / 217,205,184 | separators, progress track | decorative only | state indicator |
| `overlay.modal` | `rgba(28,35,35,0.72)` | modal backdrop | modal remains opaque | text directly on overlay |
| `state.danger` | `#A5423F` / 165,66,63 | blocked-pair error feedback and destructive confirmation actions | white 6.1:1 | routine accent or reward |

### 4.2 Functional pairing rules

- Critical text: target ≥4.5:1; large titles/actions: ≥3:1, but v1 palette normally exceeds 4.5:1.
- UI component boundaries and state marks: target ≥3:1 against adjacent colour.
- White text is allowed only on `primary.teal`, `primary.tealPressed`, `state.success`, or `state.danger`.
- `accent.coral`, `accent.gold`, and `state.locked` are not small-text backgrounds.
- Disabled state may be lower-emphasis but its label remains ≥4.5:1; it also carries a disabled glyph or unavailable label where meaning matters.
- Chapter palettes never replace UI tokens. Teal remains the consistent functional anchor.

### 4.3 Colour-blind safety

- Selected = teal border + inset corner marker.
- Hint = gold double border + synchronized pulse on both endpoints.
- Completed = check glyph + success tint.
- Locked = lock glyph + desaturated fill.
- Current/frontier = gold border + `Текущий` accessibility label where space permits.
- Error/blocked path = red stroke + short horizontal shake; never red alone.

---

## 5. Typography

### 5.1 Family and licensing

**Recommended production family:** `Manrope`, variable weight `400–800`, with Cyrillic. It is open source under SIL Open Font License 1.1 and is suitable for redistribution in a free/commercial HTML5 game when the licence notice accompanies the font files. Use a pinned, self-hosted WOFF2 build; do not depend on a remote font CDN at runtime.

Fallback stack:

```css
"Manrope", system-ui, -apple-system, "Segoe UI", Arial, sans-serif
```

Performance default:

- one variable WOFF2 containing required Cyrillic + Latin + digits;
- preload only that file;
- `font-display: swap` for HTML shell; Phaser must not enter player scenes until the chosen font is ready or must deterministically use the fallback for the full session;
- retain OFL notice in third-party licences;
- measure real WOFF2 bytes during the pilot; do not add the dependency in this stage.

If font loading proves visually unstable or materially increases startup time, the approved fallback is system UI only. Do not substitute a decorative serif or condensed display face.

### 5.2 Type roles at 480×800 logical resolution

| Role | Weight | Size / line-height | Tracking | Use |
|---|---:|---:|---:|---|
| Display / Brand | 800 | `36 / 42` | `-0.5 px` | Main Menu short brand only |
| Screen title | 750–800 | `30 / 36` | `-0.3 px` | Gallery, Levels, Reward |
| Section heading | 700 | `22 / 28` | `0` | chapter/card headings, modal title |
| Level title | 700 | `20 / 26` | `0` | chapter label or artwork title |
| HUD primary | 750 | `20 / 24` | `0` | Level, pairs remaining |
| HUD secondary | 650 | `16 / 20` | `0` | Stage, compact state |
| Button primary | 750 | `19 / 24` | `0` | primary/secondary buttons |
| Button secondary | 700 | `17 / 22` | `0` | tertiary/compact controls |
| Body | 500 | `17 / 24` | `0` | descriptions, confirmation copy |
| Caption | 600 | `15 / 20` | `0.1 px` | thumbnail state, progress note |
| Small metadata | 600 | `14 / 18` | `0.1 px` | non-critical Level number or chapter count |

Rules:

- No critical label below `16 px`; no production text below `14 px`.
- Numerals use tabular figures when available (`font-variant-numeric: tabular-nums` conceptually; verify Phaser support or use equal measured boxes).
- Avoid all-caps Russian UI strings.
- Maximum body line length inside the 480 px viewport: about 34–38 Cyrillic characters.
- Button labels remain one line. Shorten copy before reducing font size.
- `needs real-device QA`: Manrope’s actual Phaser metrics at renderScale 1 and 2, especially `Уровень 100`, `Осталось: 22 пары`, and bold Cyrillic at 17–20 px.

---

## 6. Spacing

### 6.1 Grid

- Base grid: `8 px`.
- Allowed substep: `4 px` for icon optical correction, border-to-label gap, and compact internal alignment.
- Never introduce 5/6/10/14 px spacing unless forced by fixed board geometry; round component layout to 4 px.

### 6.2 Viewport and safe areas

- Logical viewport remains `480×800` after CSS safe-area fitting.
- General horizontal screen margin: `24 px`.
- Gameplay board exception: `16 px` fixed max-board margin.
- Top content safe zone: begin at `24 px`; interactive top-row controls use bounds no higher than `16 px`.
- Bottom content safe zone: end at `776 px`; bottom controls must fit above it.
- Modal width: `416 px` default (`32 px` side margins); maximum `432 px` only when copy demands it.

### 6.3 Rhythm and padding

| Context | Value |
|---|---:|
| Major screen section gap | `24–32 px` |
| Heading to supporting text | `8 px` |
| Supporting text to main content | `20–24 px` |
| Card internal padding | `16 px` |
| Large preview card padding | `8 px` frame + content |
| Modal padding | `24 px` horizontal, `24–28 px` vertical |
| Button horizontal padding | `20 px` normal, `16 px` compact |
| Button stack gap | `12 px` |
| Adjacent card gap | `12–16 px` |
| Icon-to-label gap | `8 px` |
| Thumbnail-to-number gap | `6–8 px` |

### 6.4 Touch targets

- Minimum interactive bounds: `48×48 px`.
- Preferred primary height: `56 px`; Main Menu dominant action: `64 px`.
- Visual glyph may be 22–26 px inside a 48 px target.
- Adjacent touch targets need at least `8 px` clear separation.

---

## 7. Shape / radius / borders / shadows

### 7.1 Radius scale

| Token | Radius | Use |
|---|---:|---|
| `r.s` | `8 px` | progress bars, compact chips |
| `r.m` | `12 px` | tile cards, icon buttons, level cards |
| `r.l` | `16 px` | standard buttons, thumbnails |
| `r.xl` | `20 px` | cards, board frame, chapter banner |
| `r.modal` | `24 px` | modal/elevated hero card |

Assignments:

- button `16`; icon button `14`; tile card `12`; level card `16`; chapter banner `20`; artwork/thumbnail `16`; modal `24`; board outer frame `22`, board inner opening `16`.
- Do not create pill buttons unless the content is a small status chip. Rounded does not mean capsule everywhere.

### 7.2 Borders

- Structural border: `2 px`.
- Selected/current/Hint emphasis: `3 px` outer border.
- Route is specified separately and is not a border.
- Divider: `1 px`, never the only separation for tappable controls.

### 7.3 Shadows

Use at most two shadow recipes:

- `shadow.card`: `0 3 8 rgba(38,56,58,0.12)`.
- `shadow.modal`: `0 10 28 rgba(38,56,58,0.22)`.

No glow, coloured neon shadow, stacked material-elevation ladder, or shadow on every tile. Tile depth uses a border plus a restrained `0 2 3 rgba(38,56,58,0.18)` only when device QA shows separation is needed.

---

## 8. Buttons

All button states change both geometry/position and colour. Hover is an enhancement for mouse; it must never expose a control unavailable on touch.

### 8.1 Primary

- Height `56 px`; Main Menu dominant `64 px`; width follows layout, minimum `200 px`.
- Padding `20 px`; radius `16 px`; label `19/24`, weight 750.
- Default: `primary.teal`, white label, no border, `shadow.card`.
- Hover: lighten visual fill by at most 4% and raise `1 px`.
- Pressed: `primary.tealPressed`, translate down `2 px`, shadow removed.
- Focus: `3 px route.halo` outside + `2 px primary.tealPressed`; must be visible with keyboard.
- Disabled: `primary.tealDisabled`, label `#50605C`, no shadow, disabled/unavailable glyph if state is meaningful.

### 8.2 Secondary

- Height `52–56 px`; radius `16`; label `17–19 px`, weight 700.
- Default: `surface.card`, `2 px border.strong`, `text.primary`.
- Hover: `state.selectedFill`.
- Pressed: translate `2 px`, fill `#CBDDD8`.
- Focus: gold-free teal focus ring.
- Disabled: `state.lockedFill`, `state.locked` border, label `text.tertiary` plus glyph/label.

### 8.3 Tertiary

- Minimum target `48×48 px`; visual may be text + glyph with transparent fill.
- Default: `text.primary`; optional `surface.card` on busy surroundings.
- Pressed: `state.selectedFill`, radius `12`, translate `1 px`.
- Use for Back, Settings, and low-priority actions. Destructive actions are not tertiary by default.

### 8.4 Icon buttons

- Target `48×48 px`; compact HUD Pause/Hint may be `104×48` with icon + label.
- Glyph `22–24 px`; border `2 px`; radius `14 px`.
- Pause: secondary styling.
- Hint: secondary styling with gold bulb glyph; the button itself does not pulse when endpoint feedback is active.
- Chapter arrows: `48×48`, chevron glyph, unavailable arrow retains space but uses disabled styling and no interaction.
- Selected icon button: `state.selectedFill`, `3 px primary.teal` border, small inset dot/check.

### 8.5 Destructive confirmation action

- Restart and Exit confirmations use `state.danger` fill with white label only on the final confirm action.
- The preceding Pause-menu actions remain secondary; this prevents casual destructive colour saturation.
- Cancel is primary teal in a confirmation modal because it is the safe default.

---

## 9. Component states

| State | Fill | Border / shape | Glyph / label | Opacity rule |
|---|---|---|---|---|
| Default | role default | 2 px structural | normal label | 100% |
| Pressed | darker or selected fill | translate 1–2 px | unchanged | 100% |
| Selected | `state.selectedFill` | 3 px teal + inset corner notch/dot | optional check | 100% |
| Active | role default | teal leading edge or border | active label | 100% |
| Hint | `state.hintFill` optional | 3 px gold double ring | paired bulb/spark marker | 100% |
| Disabled | pale teal/stone | soft border | disabled glyph if meaningful | content ≥70%; never opacity alone |
| Locked | `state.lockedFill` | 2 px locked | lock glyph + level number | 100% |
| Current/frontier | warm ivory | 3 px gold + small pointer tab | number + optional `Текущий` a11y label | 100% |
| Completed | pale success tint | 2 px success | check glyph + number | 100% |
| Loading | opaque neutral skeleton | soft border | spinner/progress label | pulse optional; no content flicker |
| Unavailable / Soon | neutral card | dashed or interrupted soft border | unavailable-image glyph + `Скоро` | 100% |

`Selected` means user selection; `Current` means campaign frontier; `Active` means the current screen/tab. These terms must not be interchanged in code or QA.

---

## 10. Board

### 10.1 Geometry

Board content footprint is always `columns×64` by `rows×64`. It is centered on logical point `(240,420)`, preserving the current gameplay area. Required square bounds:

| Board | Footprint | x | y |
|---|---:|---:|---:|
| 4×4 | 256×256 | 112 | 292 |
| 5×5 | 320×320 | 80 | 260 |
| 6×6 | 384×384 | 48 | 228 |
| 7×7 | 448×448 | 16 | 196 |

Rectangular pre-stages use the same center and pitch. Do not resize tiles or artwork to make extra margins look fuller.

### 10.2 Frame

- Outer frame extends `8 px` beyond content bounds.
- Outer radius `22 px`; inner opening radius `16 px`.
- Fill `border.strong`; optional subtle paper-toned outer stroke `2 px #B8AA93`.
- `shadow.card` only on the frame, never on the artwork itself.
- Maximum frame at 7×7 is `464×464`, bounds `8..472` × `188..652`.

### 10.3 Interior

- Final Stage with artwork: artwork fills the exact board content bounds, square, no crop/stretch, no global blur, no tint. Frame clips it to `16 px` inner radius.
- Pre-stage/no-art: fill `surface.board`, with a very subtle paper noise or 4% darker edge vignette. No fake preview artwork.
- Empty cell on final Stage: fully reveals artwork. No empty-cell outline.
- Empty cell on pre-stage: no hard square. Optional inset well at ≤8% charcoal alpha to retain spatial legibility; must disappear visually before resembling a tile.
- The `8 px` inter-tile gaps expose artwork by design. Do not add opaque grid lines through them.
- Cell hit zones remain logical and invisible.

### 10.4 Size treatment

- 4×4 and 5×5 get no decorative enlargement; retain centered negative space.
- 6×6 and 7×7 use identical frame construction.
- Multi-stage backing sheets: `surface.elevated`/`surface.board`, `2 px border.soft`, existing 8 px padding and 7 px layer offsets; at most two sheets. They communicate stages, not stacked spatial boards.

### 10.5 Artwork readability rule

The board must pass with a bright, dark, and busy artwork. Tile and route recognition must not depend on editing the UI per artwork. If a production artwork forces stronger local UI effects, retouch/regenerate the artwork instead.

---

## 11. Tile cards

- Fixed size: `56×56 px`.
- Fill: `surface.card` at **100% opacity**. This is the production default; artwork never shows through the symbol area.
- Radius: `12 px`.
- Border: `2 px border.strong`.
- Internal symbol safe box: `38×38 px` default; absolute maximum painted extent `42×42 px`.
- Default shadow: none; allow the tile depth shadow from section 7 only if low-brightness QA requires it.

States:

- Default: base specification.
- Pressed: scale to `0.96` around center for 70–90 ms; fill `#F4EEE2`.
- Selected: `3 px primary.teal`; add `2 px` inset teal corner marker at top-left; keep symbol unchanged.
- Hint: `3 px state.hint` outer ring plus a second `1 px` inner ring; optional `state.hintFill` wash up to 35%. No teal marker.
- Removed: do not leave a card ghost. Route completes, then card/symbol scale to `0.88` and fade to zero; resulting cell is fully empty.
- Disabled is not a normal tile state. Input locks must not visually grey the board during 900 ms Hint or route animation.

`needs real-device QA`: border optical thickness at renderScale 1 vs 2 and gap readability on 7×7.

---

## 12. Tile symbols

### 12.1 Production language

- Style: compact **filled-gouache pictograms**, not thin outline icons.
- Silhouette owns identity; colour only supports grouping and charm.
- 2–4 flat/matte colours per symbol, including a dark structural colour when needed.
- External contour must remain identifiable in solid black at `28×28 px`.
- Internal detail: maximum three major internal cuts/marks; no texture smaller than `2 px` at 56 px tile scale.
- Stroke: optional local outline `2.5–3 px` optical width, rounded joins; never a uniform thin-line set.
- Perspective: frontal or shallow three-quarter consistently; no mix of isometric and side-view objects.
- Light: upper-left, very restrained. No cast shadow outside the symbol silhouette.
- Padding: minimum `7 px` from tile edge; preferred painted box `36–40 px`.
- Visual weight: painted area target `38–52%` of the 56×56 card.
- Grayscale rule: every pair remains distinguishable after desaturation and 256→56→28 px reduction.
- Do not assign identity by family colour. Up to 22 types can appear together.

### 12.2 Thirty future slots

The validation sheet accidentally duplicated a flower-like subject across Garden and Sea. Production replaces the Sea duplicate with a lighthouse. This is a visual-slot recommendation only; future implementation must map the approved art onto existing `TileId` ordering without changing campaign content.

| # | Family | Subject | Key silhouette cue | Forbidden similarity |
|---:|---|---|---|---|
| 1 | Home | Cup | open oval rim + one side handle | no long spout or lid |
| 2 | Home | Teapot | long spout + top lid + opposite handle | must not read as cup/jar |
| 3 | Home | Table lamp | broad shade + narrow stem + base | no lantern cage/handle |
| 4 | Home | Open book | strong central valley + two page wings | no folded map outline |
| 5 | Home | Round key | round bow + long shaft + two teeth | no shovel handle |
| 6 | Garden | Leaf | single solid almond contour + short stem | no feather shaft/barbs |
| 7 | Garden | Feather | asymmetric barbs + exposed central shaft | no closed leaf contour |
| 8 | Garden | Flower | five broad petals + visible stem | no shell spiral |
| 9 | Garden | Sprout | two leaves emerging from soil arc | no freestanding leaf |
| 10 | Garden | Hand shovel | D/T handle + broad metal blade | no key teeth/round bow |
| 11 | Travel | Luggage | upright rectangle + telescopic handle + wheels | no book/map folds |
| 12 | Travel | Compass | circular case + strong directional needle | no circular camera lens body |
| 13 | Travel | Camera | rectangular body + top bump + offset lens | never circular badge-only |
| 14 | Travel | Train front | symmetric cab + windshield + rails/wheels | no luggage handle |
| 15 | Travel | Folded map | three vertical panels + zigzag top | no open-book center valley |
| 16 | Sea | Shell | asymmetric spiral body + flared lip | no petals/stem |
| 17 | Sea | Sailboat | triangular sail + horizontal hull | no compass needle |
| 18 | Sea | Anchor | crossbar + long shank + two hooks | no key |
| 19 | Sea | Fish | pointed head/tail + dorsal break | no leaf shape; eye alone insufficient |
| 20 | Sea | Lighthouse | tapered tower + cap/light beams | no lantern body |
| 21 | Treats | Croissant | segmented crescent with thick ends | no moon: show laminated segments |
| 22 | Treats | Cake slice | triangular wedge + layer cut + topping | no sailboat triangle |
| 23 | Treats | Jam jar | squat body + flat lid + label patch | no lantern cage/handle |
| 24 | Treats | Cherries | two round fruits + joined curved stems | no generic twin circles |
| 25 | Treats | Wrapped candy | central lozenge + two twisted ends | no bow/ribbon-only shape |
| 26 | Seasons / Magic | Snowflake | six radial arms with branching tips | no five-point star |
| 27 | Seasons / Magic | Crescent moon | thick smooth crescent, no pastry segments | no croissant ridges |
| 28 | Seasons / Magic | Brass star | five broad points, solid center | no radial snowflake branches |
| 29 | Seasons / Magic | Lantern | top handle + framed cage + light core | no flat jar lid/label |
| 30 | Seasons / Magic | Gem | faceted diamond outer silhouette | no camera lens/compass circle |

Confusing-pair QA is mandatory for cup/teapot, leaf/feather, star/snowflake, camera/compass, shell/flower, lantern/jar, plus moon/croissant and book/map added by this specification.

---

## 13. Blockers

Blocker is terrain, not a tile.

- Cell footprint: `56×56 px` centered in the same 64 px pitch.
- Silhouette: irregular squared stone slab with one clipped/chipped corner; radius varies optically around `8 px` but the outer mask is consistent across all blockers.
- Fill: `blocker.fill`; edge: `3 px blocker.dark`.
- Material: 2–3 broad matte stone planes and at most two cracks; no tile-like ivory face.
- Relief glyph: centered closed padlock or masonry knot in `#ECE4D3`, `24–26 px`, embossed by one light edge and one dark offset edge. The lock is a terrain cue, not a claim that the cell later unlocks.
- Shadow: short inset lower-right shadow plus `0 2 3 rgba(38,56,58,0.25)`; visually heavier than a tile.
- It is never selectable, never pulses, and never uses family icon colours.
- On artwork it stays fully opaque. On pre-stage board it must still differ through chipped silhouette, relief glyph, and weight—not dark colour alone.
- Blocked-pair feedback may draw the existing brief error route/stroke, but the blocker itself does not shake or imply damage.

QA: at 7×7, a user must identify blocker vs tile in grayscale, with peripheral glance, and at 30% screen brightness. `nice-to-have user validation` for 45–64.

---

## 14. Route

- Core: `route.core`.
- Halo: `route.halo`.
- Core width: `5 px`.
- Halo total width: `11 px` (3 px visible each side around core).
- Joins: round; caps: round; polyline corners use `6 px` visual corner radius where rendering permits without changing logical vertices.
- Z-order: artwork → empty-cell plane → halo → core → blockers → tile cards/symbols → HUD/modals. Route may terminate visually at selected tile centers but must not paint over symbols.
- Successful route display: `220 ms` default; acceptable `180–280 ms`.
- Entry: draw from first endpoint to second over `100–140 ms`; hold `60–80 ms`; fade `60–80 ms`.
- Use no particles, sparks, moving dots, or gold.
- A route is only successful path feedback. Hint never draws it. Blocked-pair/error feedback uses `state.danger`, no cream halo, and a shorter `160 ms` treatment.
- Route appearance does not imply any turn limit.

`needs real-device QA`: bright cream artwork, dark navy artwork, coral/teal artwork, and paths crossing high-frequency foliage.

---

## 15. Hint

Semantics remain exactly: highlight both endpoint tiles for `900 ms`; no route, no removal, no repeated input.

- Border: `3 px state.hint` outer ring + `1 px` inner ring separated by `1 px` of base tile edge.
- Both endpoints receive the same synchronized treatment.
- Optional fill: `state.hintFill` at 35% over tile fill; symbols remain full contrast.
- Pulse: two restrained scale cycles `1.00 → 1.035 → 1.00`, approximately `360 ms` each, then a quiet hold/fade to the 900 ms boundary.
- Add a small gold corner sparkle/notch distinct from the teal selected marker.
- Existing manual selection clears before Hint, so selected teal and Hint gold never stack.
- Reduced motion: no scaling; rings appear instantly, hold, and disappear at 900 ms.
- Hint button remains static; only endpoint tiles animate.

Pass condition: endpoint pair is identifiable in a 900 ms glance in deuteranopia/protanopia simulation and grayscale by double ring + paired motion, not gold hue alone.

---

## 16. Gameplay HUD

### 16.1 Brand presence

Remove the large `Уютная галерея` brand from active gameplay. The screen is already constrained by the fixed board; brand belongs to Main Menu and catalog surfaces. Gameplay uses a compact status HUD only.

### 16.2 Zones

- Top action row: y `20..68`.
  - Pause: bounds `24,20,104×48`.
  - Hint: bounds `352,20,104×48`.
- Status row: y `76..116`.
  - left-aligned `Уровень N` at x `24`, baseline region y `82..106`.
  - right-aligned `Осталось: N пар` at x `456`, same line.
- Stage row: y `116..140` only for multi-stage Levels: centered `Этап X/Y`, `16/20`, secondary text.
- Clear separation before board frame begins at y `188` maximum-board case. Minimum gap from Stage text to frame: `32 px`; from status to frame in single-stage: `56 px`.

### 16.3 Hierarchy

- Level and pairs: HUD primary `20/24`, weight 750.
- Stage: HUD secondary `16/20`, weight 650.
- Pause/Hint labels: button secondary `17/22`; icons 22 px.
- No seed, debug metric, chapter title, timer, score, or progress bar in production gameplay.
- Pair grammar must localize correctly in future; v1 Russian examples are layout strings, not a localization implementation request.

At `Уровень 100 · Этап 3/3 · Осталось: 22 пары`, the rows must not collide. `needs real-device QA` at system font fallback and Manrope.

---

## 17. Main Menu

### 17.1 Layout at 480×800

| Element | Bounds / rule |
|---|---|
| Brand | x 24..456, y 28..72; centered, `36/42` |
| Tagline | y 78..102; `16/20`, secondary; optional after first session |
| Chapter preview | x 24, y 124, `432×232`; artwork crop is prohibited—use contained square/approved wide derivative only. For v1 use a framed square/letterboxed composition, not arbitrary crop |
| Chapter badge | inset 16 from preview top/left, opaque card |
| Primary action | x 24, y 380, `432×64` |
| Secondary row | y 460, two buttons `208×56`, 16 px gap |
| Progress card | x 24, y 540, `432×104` |
| Settings reserved slot | target `48×48`, x 408, y 708–756; render nothing in v1 until a real Settings feature exists |

The preview may shift vertically by ±12 px after real art is available, while preserving all touch targets and bottom safe zone.

### 17.2 Priority and state

- Fresh progress: primary label `Играть` and target Level 1.
- In progress: `Продолжить · Уровень N` and target Stage 1 of first uncompleted Level.
- Campaign complete: `Играть снова · Уровень 1`; never clear recorded completion.
- `Уровни` and `Галерея` are equal secondary buttons.
- Progress card: `Открыто N из 100`, `18 px` label, 8 px-high track, gold fill, numeric value always present.
- Settings position is reserved for future use. Do **not** render a dead/non-functional Settings control in v1; when a real Settings feature exists, it uses tertiary styling and remains visually separate.
- Completed campaign progress card becomes `Коллекция: 100 из 100` with success check; no confetti or extra economy.

The Main Menu must request zero artwork. Therefore the “current chapter/art preview” must use a separately approved shell asset already bundled for menu use, a CSS/painted chapter banner, or a cached asset only if architecture explicitly permits later. V1 recommendation: ship one lightweight chapter-banner asset per implemented chapter only after package measurement; do not silently reuse locked full/thumbnail loads.

---

## 18. Level / Chapter Select

### 18.1 Layout

- Header x `24..456`, y `24..72`: `Глава N · Название`, screen title.
- Supporting progress y `76..98`: `N / 100 · 10 уровней`, body/secondary.
- Chapter banner x `24`, y `116`, `432×176`, radius 20. Use chapter banner/approved contained derivative; title scrim at bottom ≤40% height.
- Chapter arrows: `48×48`, centers x `48` and `432`, y `316`; centered chapter indicator between.
- Level grid: x `24..456`, y `352..532`, five columns × two rows.
- Card: `72×72`, radius 16; horizontal gap `18 px`; vertical gap `24 px`.
- Back button: x `24`, y `708`, `432×56`.

### 18.2 States

- Completed: pale success fill, 2 px success border, number 22 px, check glyph top-right.
- Current/frontier: warm ivory fill, 3 px gold border, small upward tab/diamond at bottom; number 22 px. It remains selectable.
- Locked: locked fill, 2 px locked border, number 20 px + lock glyph top-right. No interaction.
- Selected/focus (keyboard): teal outer focus ring in addition to the state border; do not erase current/completed semantics.
- Chapter banner should never imply a level is unlocked.
- Arrows do not wrap at Chapters 1/10. Disabled arrow retains target box and becomes non-interactive.

State comprehension must survive grayscale and low brightness.

---

## 19. Gallery

### 19.1 Overview

- Header: `Галерея` left at x 24/y 28; global `N / 100` right on the same row.
- Chapter heading and arrows occupy y `88..144`.
- Grid: 5×2 square thumbnail cards. Card `72×72`; radius 16; same x rhythm as Level Select. Level number below each card in a `20 px` label zone.
- Grid begins at y `176`; second row at y `292`. Keep lower half free for a short chapter progress card or empty breathing room, not policy/debug copy.
- Back to Menu: `432×56`, y `708`.

### 19.2 Slot states

- Unlocked: actual 256 thumbnail, contained square, no crop/stretch; 2 px strong border. Tappable.
- Locked: neutral `state.lockedFill`; large lock glyph; Level number; no asset request.
- Unavailable: `surface.card`, interrupted/dashed soft border, unavailable-image glyph + `Скоро`; no asset request. It must not look locked or achievable now.
- Loading: `surface.card` skeleton + small spinner and `Загрузка…`; keep dimensions stable. Only eligible unlocked thumbnails may enter loading.
- Failed unlocked thumbnail: neutral broken-image glyph + `Недоступно`; slot remains non-destructive and retry can occur on scene revisit according to existing loader policy.
- Chapter progress: `Открыто X из 10` as text plus 8 px gold progress track. Global progress remains in header.

### 19.3 Full View

- Back target at top-left `24,20,48×48`; title area centered.
- Artwork frame: exact `400×400`, x `40`, y `156`, radius 20, 3 px gold only for unlocked reward art; no crop/stretch.
- Level/chapter metadata above; artwork title below if available.
- Back returns to the originating chapter and scroll/state position. It never starts gameplay or writes progress.
- First uncached open shows loading immediately and requests only the selected full asset. Cached revisit appears without artificial loading delay.

Artwork title is optional metadata. If no curated title exists, display `Уровень N` rather than AI-generated filler.

---

## 20. Reward

Reward is a clean reveal, not an economy screen.

### 20.1 Layout

- Background `bg.app` with a restrained chapter-colour paper shape at ≤10% opacity.
- Heading `Картина открыта`, screen title, y `32..68`.
- Chapter label `Глава N · Название`, body/secondary, y `76..100`.
- Artwork frame `400×400`, x `40`, y `124`, radius 20, `3 px accent.gold`.
- Optional curated artwork title centered below at y `544..580`, Level title `20/26`.
- Primary Continue x `24`, y `620`, `432×56`.
- No secondary Gallery action in v1. The y `692` slot remains empty/reserved until a separate product decision defines navigation from Reward to Gallery and a safe return/completion contract.

If no curated artwork title exists, omit the title and preserve the spacing as breathing room; do not auto-invent a name at runtime. Chapter label is mandatory; artwork title is optional.

### 20.2 Transition

- After final pair removal, allow the board artwork to remain unobstructed for `450–650 ms`.
- Crossfade/scale into the clean 400×400 reward frame over `280–360 ms`.
- Continue enters after the artwork, with no coin, stars, confetti storm, streak, chest, or count-up. A direct Gallery action is deferred and must not be introduced as a visual-only change.
- Continue follows existing reward → Complete flow unless a later explicitly approved product change merges them. This specification does not change semantics.

---

## 21. Pause / Confirmations

### 21.1 Overlay and modal

- Backdrop: `overlay.modal` covering 480×800, input-blocking.
- Modal: width `416 px`, centered near y `400`; height adapts to content (`360–440 px`), fill `surface.elevated`, radius 24, 2 px `border.soft`, `shadow.modal`.
- Padding `24 px`; title `24/30` weight 750; body `17/24`.

### 21.2 Pause menu

Order:

1. `Продолжить` — primary teal.
2. `Начать уровень заново` — secondary.
3. `Выйти в меню` — secondary.

Buttons are `368×52`, 12 px gaps. Board remains visible behind overlay but is not interactive. Selection and exact session state remain intact.

### 21.3 Confirm restart

- Title `Начать заново?`
- Body `Текущий уровень начнётся с первого этапа.`
- Safe default `Отмена` — primary teal.
- Destructive `Начать заново` — error fill.
- Cancel returns to Pause, not gameplay.

### 21.4 Confirm exit

- Title `Выйти в меню?`
- Body `Незавершённый уровень не сохранится.`
- Safe default `Отмена` — primary teal.
- Destructive `Выйти` — error fill.
- Cancel returns to Pause.

Modal entry and exit follow motion section. Pause is unavailable after final completion, preserving current logic.

---

## 22. Artwork style bible

### 22.1 Formula

`place archetype + one anchor object + directional light + chapter palette + 1–2 recurring brand cues + controlled empty mass`

### 22.2 Technique

- contemporary editorial/storybook illustration;
- gouache + digital paint;
- matte finish, no glossy 3D;
- subtle cold-press paper texture visible at 1024 but not noisy at 256;
- controlled, believable geometry with deliberate handmade imperfection;
- no photorealism and no imitation of any living artist.

### 22.3 Composition

- 3–5 large value masses.
- Focal mass: 25–45% of frame.
- Maximum two high-frequency zones.
- Background must not be uniformly detailed.
- 10–12% calm safe zone around all edges; no critical object or cue there.
- No critical tiny focal element, text, signage, readable book spines, logos, watermark, or mandatory face.
- Human/animal presence is rare and small; no recurring mascot. Accidental face-like arrangements are a QA failure.
- Perspective must be grounded and internally consistent. Random cinematic Dutch angles and extreme wide-angle interiors are forbidden.

### 22.4 Readability under play

Every candidate must be reviewed at:

1. 1024 master view for structural errors.
2. 256 thumbnail.
3. 480×800 gameplay mock at 7×7 with 22 symbol types, blockers, route, and Hint.
4. 40% reveal and clean reward view.

### 22.5 Edge-density heuristic at 256×256

- **Pass:** `≤0.26` and no uniform micro-detail; strong mass hierarchy survives 7×7.
- **Manual review:** `0.26–0.30`, or ≤0.26 with clustered foliage/rails/window grids behind key UI. Pass only after gameplay overlay review.
- **Reject/retouch:** `>0.30`, more than two high-frequency zones, repeated small circular objects that mimic symbols, or focal identity lost under 7×7.

The number is a review heuristic, not an absolute aesthetic law. Reject symptoms override a nominal passing score.

### 22.6 Negative reference lessons

- Botanical Seasons: avoid foliage carpet, green-on-green, repeated fruit circles, and plant detail of equal importance everywhere.
- Mystic Journeys: avoid repeated crescent arch/gold path formula, purple fog, crystals, floating-island spectacle, generic fantasy monumentality, and reward imagery that mis-sells an adventure game.

---

## 23. Brand cues

Approved cue pool:

1. arch/arched opening;
2. small brass star;
3. burgundy thread/textile detail;
4. coral ceramic/object;
5. deep teal anchor object/shadow;
6. cold-press paper texture.

Rules:

- Paper texture is the universal rendering substrate and does not count toward the per-art cue maximum.
- Use **1–2 object/colour cues per artwork**; never all five object cues.
- Across each 10-art chapter, every cue should appear at least twice except where chapter exclusions apply, but no object cue appears in more than 5 artworks.
- The same pair of cues may not recur in more than two consecutive artworks.
- Brass star: maximum one obvious star object per artwork; it may also exist as a tiny hardware detail, never both.
- Arch: structural in no more than 4/10 works per chapter; curved window, bridge, and doorway count as the same family.
- Deep teal may be a small anchor even when chapter palette changes, but should occupy <20% of artwork in chapters where teal is not native.
- Coral ceramic/textile cue must change object category; do not place the same coral pot in every scene.
- Cue placement rotates among foreground, midground, and background. Repeating identical screen coordinates is forbidden.
- Artificial repetition test: hide titles and compare the chapter contact sheet. If cues read as a scavenger checklist before places read as distinct scenes, reduce them.

---

## 24. Composition families

| Family | Camera / horizon | Focal placement | Empty mass | Typical anchor | Chapter use | Common failures |
|---|---|---|---|---|---|---|
| Window / interior | eye-level 35–50 mm equivalent; horizon 42–55% | left/right third, not always chair | window light, wall, floor | chair, desk, table, lamp, book | 1,2,4,8,9,10; occasional 6 | generic cozy room, impossible windows, plant overload, identical chair/window |
| Threshold | eye-level or slight low angle; horizon 45–58% | doorway/arch off-center | open doorway, wall plane, sky | door, gate, shop entrance, greenhouse threshold | 1,3,5,6,8,9,10 | arch in every image, view-within-view clutter, impossible hinges/shadows |
| Courtyard | slight elevation; horizon 38–48% | anchor near lower third | paving, water, calm wall | fountain, bench, stall, table, tree | 2,3,5,6,8,10 | foliage carpet, many equal flowers, repeating fountain, fake Mediterranean sameness |
| Journey vista | eye-level or mild elevation; horizon 35–50% | route/vehicle/lighthouse on third | sky, sea, field, mist | train, luggage, road, pier, station | 6,7,8,9,10; rare 1 | cinematic fantasy, broken rails, tiny focal object, overly wide empty scene |

Distribution rules:

- Each chapter uses at least two families; Chapters 5–10 use at least three.
- No family may exceed 4/10 images in a chapter.
- No consecutive run longer than two from the same family.
- Camera variation stays within grounded editorial illustration; variety comes from mass arrangement and light, not lens gimmicks.

---

## 25. Chapters 1–10

Each list is a subject matrix, not final prompts. Production titles and exact briefs are authored before generation.

### 25.1 Chapter 1 — Утро дома

- **Tone:** fresh, safe, quietly purposeful.
- **Main palette:** ivory `#F6EBD8`, sunrise peach `#E9B481`, soft oat `#D9C5A5`.
- **Secondary:** deep teal `#245F5D`, muted coral `#C97160`, morning blue `#A9C9D2`.
- **Light:** low warm sun, long clean shadows.
- **Locations:** breakfast nook, small kitchen, entry, balcony, sewing corner.
- **Anchors:** cup, chair, folded textile, kettle, keys, open book.
- **Materials:** painted wood, linen, ceramic, plaster.
- **Families:** window/interior, threshold; rare courtyard/balcony.
- **Cues:** teal anchor, burgundy thread, coral ceramic, occasional arch.
- **Distinctive:** intimate domestic scale and clear morning air.
- **Must not:** night scenes, bakery display, plant jungle, luxury mansion, sleeping person.
- **Subjects (10):** sunrise breakfast nook; open balcony door with folded blanket; kettle by a bright window; reading chair and morning post; hallway bench with keys; small sewing table; tiled kitchen corner; quiet washstand; rooftop breakfast terrace; rain-cleared doorway with boots.

### 25.2 Chapter 2 — Чай и выпечка

- **Tone:** generous, aromatic, social without crowds.
- **Main palette:** pastry gold `#D99A4E`, cream `#F7E6C8`, cocoa `#765143`.
- **Secondary:** berry `#A85D62`, coral `#CE765E`, teal `#356B67`.
- **Light:** warm late morning, oven glow only as accent.
- **Locations:** bakery window, tea room, kitchen worktable, covered terrace.
- **Anchors:** teapot, cake stand, bread basket, oven, striped cloth.
- **Materials:** glazed ceramic, wood, paper wrap, linen, enamel.
- **Families:** interior, threshold, courtyard.
- **Cues:** coral ceramic/textile, burgundy thread, brass star hardware.
- **Distinctive:** broad food shapes and warm edible colour, not object abundance.
- **Must not:** close-up food photography, branded packaging, readable menu, dozens of identical pastries.
- **Subjects (10):** tea table by rain window; bakery before opening; cooling bread on a worktable; covered courtyard tea; small corner oven; cake stand under a glassless dome; picnic basket preparation; jam-making shelf with one focal pot; winter tea tray; seaside café table without signage.

### 25.3 Chapter 3 — Цветочные лавки

- **Tone:** lively craft, colour curated into bouquets.
- **Main palette:** petal rose `#D9828D`, leaf sage `#789477`, cream `#F4E5CF`.
- **Secondary:** violet `#8C7695`, marigold `#D8A23A`, teal `#2F6763`.
- **Light:** clear diffused daylight; occasional after-rain sparkle.
- **Locations:** flower shop, market stall, potting backroom, street kiosk, courtyard shop.
- **Anchors:** one bouquet, wrapping table, watering can, shop door, ribbon spool.
- **Materials:** kraft paper, ceramic, painted metal, wet stone, glass in large planes.
- **Families:** threshold, courtyard, interior.
- **Cues:** burgundy thread/ribbon, coral ceramic, occasional arch.
- **Distinctive:** florist craft and designed clusters, not botanical wilderness.
- **Must not:** uniform flower carpet, macro blossom wall, text signs, more than two detailed floral zones.
- **Subjects (10):** shop opening with one large bouquet; wrapping table and ribbon; rain-wet flower kiosk; courtyard delivery cart; tulip buckets in broad blocks; dried-flower workroom; shaded awning stall; evening cleanup; greenhouse shop threshold; single wedding bouquet on a chair without people.

### 25.4 Chapter 4 — Книги и письма

- **Tone:** reflective, tactile, slightly nostalgic.
- **Main palette:** paper `#E8D7B8`, ink blue `#405B6A`, walnut `#76584A`.
- **Secondary:** burgundy `#8D4F55`, sealing wax `#B55F48`, dusty teal `#4E7772`.
- **Light:** slanting window light, desk-lamp pools, quiet overcast.
- **Locations:** writing desk, small library, post room, bookshop alcove, station writing table.
- **Anchors:** sealed envelope, open book, pen tray, letter box, reading lamp.
- **Materials:** paper, leather, wood, brass, linen tape.
- **Families:** interior, threshold; rare journey vista/post route.
- **Cues:** burgundy thread, brass star stamp/hardware, teal bookend.
- **Distinctive:** poetcore through material and silence, not illegible decorative text.
- **Must not:** readable prose, random pseudo-text, endless packed bookshelves, quills in every image.
- **Subjects (10):** letter beside morning window; bookshop ladder alcove; parcel-wrapping desk; rain at a post-room door; library return cart; atlas table without readable labels; sealed correspondence tray; reading bench under skylight; station letter desk; archive drawer with one open folio.

### 25.5 Chapter 5 — Сады и дворики

- **Tone:** restorative, sun-warmed, architectural.
- **Main palette:** garden green `#5F7F61`, limestone `#DCCDAF`, sky `#A8C9CD`.
- **Secondary:** terracotta `#B96F4E`, lavender `#8B82A1`, teal `#2E6661`.
- **Light:** dappled afternoon, after-rain reflection, soft shade.
- **Locations:** walled garden, small courtyard, pergola, potting terrace, fountain court.
- **Anchors:** bench, fountain, gate, table, one shaped tree.
- **Materials:** stone, terracotta, painted iron, water, timber.
- **Families:** courtyard, threshold, journey vista/garden path.
- **Cues:** arch, coral ceramic, deep teal gate, rare brass star.
- **Distinctive:** structure first, foliage second.
- **Must not:** foliage carpet, ten equal planters, fruit-circle repetition, fantasy topiary.
- **Subjects (10):** shaded fountain courtyard; garden gate after rain; bench beneath one fruit tree; tiled potting terrace; pergola lunch table; narrow herb court; stone steps to a quiet garden; blue-hour conservatory exterior; wall fountain and chair; winter-to-spring courtyard edge.

### 25.6 Chapter 6 — У моря

- **Tone:** airy, restorative, lightly adventurous.
- **Main palette:** sea blue `#4F93A6`, sun cream `#F2DEB8`, salt white `#F7F1E4`.
- **Secondary:** coral luggage `#C86E59`, lighthouse red `#A9554D`, deep teal `#276466`.
- **Light:** crisp coastal sun, silver overcast, occasional amber dusk.
- **Locations:** small station, pier, lighthouse cottage, sea terrace, boat shed, sheltered cove.
- **Anchors:** luggage, lighthouse, bench, small boat, striped textile.
- **Materials:** weathered wood, painted metal, stone, rope, canvas.
- **Families:** journey vista, threshold, courtyard/terrace, interior.
- **Cues:** teal anchor, coral object, brass star on luggage, arch rarely.
- **Distinctive:** horizon and salt-air negative space.
- **Must not:** tropical resort cliché, giant waves, ships in distress, marine-animal spectacle, broken rail geometry.
- **Subjects (10):** coastal station arrival; lighthouse kitchen window; quiet pier bench; boat shed threshold; luggage on sea terrace; cove seen through an arch; fisherman’s table without person; rain shelter by the shore; sunset ferry landing; winter sea cottage.

### 25.7 Chapter 7 — Дороги и станции

- **Tone:** anticipation, calm movement, chosen departure.
- **Main palette:** rail green `#3F6863`, stone `#A99D89`, sky grey-blue `#8FA9B5`.
- **Secondary:** ticket ochre `#C9953A`, luggage coral `#B96857`, burgundy `#7F4D52`.
- **Light:** early departure light, overcast travel day, platform lamps at dusk.
- **Locations:** rural platform, tram stop, roadside inn threshold, mountain road overlook, waiting room.
- **Anchors:** suitcase, bench, clock without tiny text, railcar, map case.
- **Materials:** painted steel, timber, leather, stone, glass.
- **Families:** journey vista, threshold, interior.
- **Cues:** coral luggage, teal railcar/door, burgundy strap, brass star hardware.
- **Distinctive:** legible travel infrastructure and directional depth.
- **Must not:** impossible rails/wheels, readable station names, crowds, epic quest roads, generic airport.
- **Subjects (10):** first train platform; tram at a rain shelter; mountain waiting room; suitcase beside a rural road; bridge approach with no impossible spans; small station café; night platform lamp; bus-stop threshold in autumn; map table before departure; final carriage at dawn.

### 25.8 Chapter 8 — Осенние огни

- **Tone:** shelter, craft, amber contrast against rain/dusk.
- **Main palette:** amber `#D48632`, rust `#A9513F`, deep umber `#59443D`.
- **Secondary:** wine `#7E3F4B`, muted teal `#355F5B`, smoke blue `#667A82`.
- **Light:** lantern/lamplight pools with cool rainy exterior.
- **Locations:** workshop, porch, market closing, reading room, covered courtyard, station at dusk.
- **Anchors:** lantern, workbench, umbrella, leaf textile, warm window.
- **Materials:** dark wood, hammered brass, wool, wet stone, ceramic.
- **Families:** interior, threshold, courtyard, journey vista.
- **Cues:** brass star, burgundy textile, teal shadow/door.
- **Distinctive:** warm/cool light contrast and autumn material, not leaf decoration alone.
- **Must not:** orange monochrome, pumpkin festival cliché, fire everywhere, over-dark crushed shadows.
- **Subjects (10):** lantern on a workshop bench; rainy porch with folded umbrella; bookshop closing; covered market after sunset; amber tram shelter; wool mending table; courtyard leaves after rain; kettle by dark window; tool shed threshold; last light at a roadside inn.

### 25.9 Chapter 9 — Зимние окна

- **Tone:** hushed warmth, distance, clarity.
- **Main palette:** snow blue `#B8CDD5`, midnight `#294B5B`, winter cream `#F3E9D5`.
- **Secondary:** amber `#D6A34A`, cranberry `#9D4E56`, fir `#3F6760`.
- **Light:** blue hour, snow-reflected daylight, one warm interior source.
- **Locations:** arched window room, conservatory, snowy platform shelter, cabin entry, winter café.
- **Anchors:** window, blanket, lamp, mug, boots, small fir branch.
- **Materials:** wool, frosted glass, wood, enamel, snow.
- **Families:** interior, threshold, journey vista, courtyard.
- **Cues:** burgundy textile, teal/fir anchor, rare brass star.
- **Distinctive:** large quiet blue masses with precise warm refuge.
- **Must not:** Christmas branding, text ornaments, snowflake wallpaper, identical chair-and-window scenes.
- **Subjects (10):** snowy village window; frosted greenhouse door; empty winter platform; blanket on reading bench; blue-hour kitchen; snow-covered courtyard gate; lamp in a boat shed; thawing boots at entry; winter letter desk; moonlit conservatory exterior.

### 25.10 Chapter 10 — Тихая магия

- **Tone:** intimate wonder, plausible place with one impossible event.
- **Main palette:** indigo `#263E62`, moon cream `#F0E3C3`, oxidized teal `#287477`.
- **Secondary:** ember coral `#C86855`, antique gold `#C79A43`, burgundy `#713F52`.
- **Light:** moonlight plus one warm practical source; luminous event is controlled.
- **Locations:** familiar greenhouse, library, courtyard, station, coast, garden transformed subtly.
- **Anchors:** luminous tree, self-turning page, floating brass star, impossible reflection, moonlit doorway.
- **Materials:** same gouache/paper, glass, brass, stone, wood; magic does not change rendering system.
- **Families:** all four, with at least three represented.
- **Cues:** brass star, arch, deep teal, coral anchor; max two.
- **Distinctive:** one quiet impossibility inside grounded Curated Cozy Places.
- **Must not:** crystals, runes, spell UI, floating islands, castles, purple fog, epic quest, multiple magical phenomena.
- **Subjects (10):** greenhouse with one softly luminous tree; library where one page lifts in still air; courtyard reflection showing stars; coastal door opening onto moonlit calm; station clock casting constellation shadow; lantern holding a tiny dawn glow; garden path with one floating brass star; winter window with impossible summer reflection; tea steam forming one brief arch; final quiet room where chapter colours meet in one restrained light event.

---

## 26. Palette migration

Teal remains the functional UI anchor and a recurring artwork note; it must not dominate every artwork.

| Ch. | Migration role | Representative palette (dominant → accent) | Teal occupancy guidance |
|---:|---|---|---:|
| 1 | warm morning | `#F6EBD8 #E9B481 #D9C5A5 #245F5D #C97160` | 10–20% |
| 2 | bakery warmth | `#F7E6C8 #D99A4E #765143 #A85D62 #356B67` | 5–15% |
| 3 | floral colour | `#F4E5CF #D9828D #789477 #8C7695 #2F6763` | 5–15% |
| 4 | paper / poetcore | `#E8D7B8 #405B6A #76584A #8D4F55 #4E7772` | 8–18% |
| 5 | structured garden | `#DCCDAF #5F7F61 #A8C9CD #B96F4E #2E6661` | 8–18% |
| 6 | coastal opening | `#F7F1E4 #4F93A6 #F2DEB8 #C86E59 #276466` | 10–25% |
| 7 | travel restraint | `#A99D89 #8FA9B5 #3F6863 #C9953A #B96857` | 15–25% |
| 8 | autumn contrast | `#59443D #D48632 #A9513F #7E3F4B #355F5B` | 5–15% |
| 9 | winter quiet | `#B8CDD5 #294B5B #F3E9D5 #D6A34A #3F6760` | 8–18% |
| 10 | quiet magic | `#263E62 #F0E3C3 #287477 #C86855 #C79A43` | 15–30% |

Contact-sheet QA:

- Adjacent chapters must differ in dominant temperature or value structure.
- No three consecutive chapters may present beige + teal as the two largest masses.
- Within a chapter, no more than 4/10 works share the same dominant background hue.
- The full 100-art sheet should read as one collection through technique/cues, and as ten chapters through colour/light/location.

---

## 27. AI-art QA

### 27.1 Acceptance checklist

For every candidate, inspect:

- impossible architecture, stairs, doors, arches, perspective, wall thickness;
- duplicated/merged objects or repeated texture clones;
- impossible windows, reflections, mullions, handles, hinges;
- broken furniture, asymmetrical legs, unusable seating;
- inconsistent rails, sleepers, wheels, train body, bridge load/path geometry;
- malformed ceramics, handles, spouts, rims, impossible liquid;
- nonsensical light direction, cast shadows, reflections, moon/sun conflict;
- pseudo-text, signs, labels, logos, watermark;
- repeated props from earlier accepted work;
- accidental faces/eyes/figures in foliage, windows, fabric, or architecture;
- uniform visual clutter or more than two high-frequency zones;
- generic AI center composition and “cozy room + plants” default;
- near-duplicate camera, mass layout, anchor, or lighting of prior art;