# Porcelain Hours: generation and provenance evidence ledger

Status: **GEMINI PROMPT/REPLY HISTORY VERIFIED; FINAL MUSIC FILE NOT IDENTIFIED**.
Initial record 2026-10-31; Takeout inspected 2026-11-01. This record identifies the exact shipped audio, not every generated
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

## Evidence from owner-provided Google Takeout (2026-11-01)

The Google Gemini Apps activity export contains the following initial rights question
and four music-generation/revision **prompt-and-textual-reply** events in one
Gemini conversation. The timestamps below reproduce the timezone label shown
by the Google export, without additional timezone conversion.

| Google Takeout timestamp | Evidence, paraphrased |
| --- | --- |
| 2026-10-13 10:04:53 CET | Owner asks whether generated game music may be used commercially without attribution. Gemini responds affirmatively with qualifications; its response is not authoritative legal clearance. |
| 2026-10-13 10:09:02 CET | Owner requests positive, calm, looping background music for a pair-matching game. Gemini responds that a first composition is available in chat. |
| 2026-10-13 10:12:15 CET | Owner requests a cozy loop without prominent bass, glossy TV-style sound or beach atmosphere. Gemini reports a revised version. |
| 2026-10-13 10:15:22 CET | Owner asks to further reduce bass. Gemini reports another revised version. |
| 2026-10-13 10:18:39 CET | Owner asks for a further variation based on the preceding track. Gemini reports another generated version. |

Google Activity also records positive feedback on two earlier responses, before
additional revisions. Neither feedback record identifies the shipped audio.

### Private evidence fingerprint

- Exported HTML inside the uploaded Takeout ZIP:
  `Takeout/Мои действия/Приложения Gemini/МоиДействия.html`.
- Original UTF-8 HTML: 1,043,495 bytes, SHA-256:
  `fed2c20d915330d3d9de6a504b0b5f703b3a30c090e5245f0b803468fcfbb205`.
- The second ZIP contains the Takeout archive browser, not a second conversation.
- The activity HTML preserves user prompts and Gemini textual replies, **not**
  downloadable generated music files. No MP3 or OGG for this generated track
  was found in either archive. Other voice/media files are not evidence of
  the selected music version and were not inspected as such.
- These ZIPs include unrelated personal account activity. The source archives,
  full transcript and private Gemini conversation URL are intentionally not
  committed to this public repository. Retain them in a private owner archive.

### Unresolved final-version association

Four candidate outputs are documented, but **which one became
`porcelain_hours.mp3` is not established**. The latest chronological
generation at 10:18:39 must not automatically be treated as selected.
The production MP3 SHA-256 is
`14fe41b4dae8bea0f20fd46d6ba6ffc1e251230e910a61d0b55595c268dd4ffa`.
Compare the owner's original selected audio download against that hash if
available; if it was converted, preserve both checksums and a conversion record.
The exact Gemini model, product mode and applicable generation-time terms
remain unverified.

## Private evidence to preserve outside the public game/repository

1. Keep the supplied Google Takeout ZIPs in a private archive. If possible,
   preserve the original Gemini chat with all generated audio cards. The
   Takeout copy covers prompt/reply text but omits downloadable music.
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
- [x] Gemini generation/revision events and dated text responses independently inspected from Takeout.
- [x] Private export HTML fingerprint recorded (no raw private export committed).
- [ ] Owner confirms durable private preservation of the original ZIPs and chat music.
- [ ] Final-generation message and exact audio version identified.
- [ ] Original selected export independently hash-matched or transformation documented.
- [x] Generation event timestamps established for 2026-10-13.
- [ ] Gemini model and applicable generation-time terms archived.

**Rights note:** This file is not public-domain/CC0 evidence. Google's
[Terms of Service](https://policies.google.com/terms) contain a statement
that Google does not claim ownership of original generated content; that
statement alone is not a warranty of exclusivity, copyright eligibility or
freedom from third-party claims. Review the actual service-specific terms
that applied when the track was created.
