# Porcelain Hours: generation and provenance evidence ledger

Status: **PARTIALLY DOCUMENTED — Gemini conversation/export not independently inspected**.
Recorded 2026-10-31. This record identifies the exact shipped audio, not every generated
candidate and not a legal determination of copyright ownership.

## Frozen production artifact

| Field | Evidence |
| --- | --- |
| Display title | Porcelain Hours |
| In-game audio path | `public/assets/audio/porcelain_hours.mp3` |
| SHA-256 | `14fe41b4dae8bea0f20fd46d6ba6ffc1e251230e910a61d0b55595c268dd4ffa` |
| Tracked Git file size | 3,782,802 bytes |
| Hash source | `docs/audit/production-assets.sha256.json`; also validated by `npm run build` / `check:assets` |
| Integration | `src/audio/AudioAssetManifest.ts`, `AUDIO_MUSIC` entry `porcelain-hours` |

## Generation chain: reported by the project owner

- Platform: Google Gemini.
- The owner requested music, received an initial generated track, then sent
  multiple corrective instructions. Gemini returned successive audio variants.
- One of those variants was selected and included in the approved eight-file
  `Sounds_confrim.zip`, then committed under the production path above.
- **Not yet independently verified**: generation dates; Gemini model/product
  and exact mode; original prompt and corrective prompts; exact response
  containing the final selected audio; original download filename; whether
  the final response's downloadable audio bytes match the shipped MP3; terms
  displayed at generation time.

Do not infer that the last message in the Gemini chat is the shipped version.
An iterative conversation may contain several equally named candidates.
Only a direct original export vs shipped-file **SHA-256 comparison** can establish
byte identity; if the file was transcoded or renamed/processed, preserve the
transformation record and source/export hashes instead.

## Private evidence to preserve outside the public game/repository

1. Export or save the **complete relevant Gemini conversation**, including
   the initial instruction, every corrective prompt, each generated audio
   result, and the final choice. Retain original timestamps if available.
2. Save the original selected audio download separately, without modifying
   it. Calculate its SHA-256 and byte count; compare with the shipped fingerprint.
3. Record the original conversation URL or private export reference, actual
   generation date and model/product if displayed, and which exact message
   corresponds to the approved version.
4. Preserve a dated copy or screenshot of applicable Gemini feature terms
   and Google Terms of Service. Distinguish generation rights from Google's
   non-ownership statement and third-party copyright considerations.
5. Store evidence in a private owner-controlled archive, not `public/` or a
   public GitHub repository. Avoid publishing private Gemini conversations,
   prompts, account identifiers, signed download URLs or unapproved tracks.

## Completion checklist

- [x] Production filename, size, SHA-256 and integration path recorded.
- [x] Owner's account of iterative generation recorded as **reported**, not verified.
- [ ] Gemini chat export / complete revision history securely archived.
- [ ] Final-generation message and exact audio version identified.
- [ ] Original selected export independently hash-matched or transformation documented.
- [ ] Generation timestamp, model and applicable terms archived.

**Rights note:** This file is not public-domain/CC0 evidence. Google's
[Terms of Service](https://policies.google.com/terms) contain a statement
that Google does not claim ownership of original generated content; that
statement alone is not a warranty of exclusivity, copyright eligibility or
freedom from third-party claims. Review the actual service-specific terms
that applied when the track was created.
