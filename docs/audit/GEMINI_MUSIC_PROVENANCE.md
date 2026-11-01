# Porcelain Hours: generation and provenance evidence ledger

Status: **GEMINI HISTORY VERIFIED; THIRD-GENERATION TRACK SELECTED AND BYTE-MATCHED**.
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

### Resolved final-version association

The project owner identified four original downloads in generation order:
`quiet_geometry.mp3`, `the_quiet_tally.mp3`,
`porcelain_hours.mp3`, and `sunbeams_on_wood.mp3`.
The **third version**, generated in the revision at
**2026-10-13 10:15:22 CET**, was selected for the game.
The fourth version, at 10:18:39 CET, was not selected.

The original owner-supplied `porcelain_hours.mp3` has exactly the same
**3,782,802-byte** size and SHA-256
`14fe41b4dae8bea0f20fd46d6ba6ffc1e251230e910a61d0b55595c268dd4ffa`
as the shipped production MP3. This verifies byte identity, not just
a filename or musical resemblance. The complete four-version chronology
and limitations are recorded in
[`GEMINI_MUSIC_FINAL_VERIFICATION.md`](GEMINI_MUSIC_FINAL_VERIFICATION.md).

Google Takeout contains the prompts and replies, but not a signed audio
download manifest. The exact Gemini model version and generation-time
feature-specific terms were not verified. This evidence is not a legal
warranty of originality or third-party clearance.

## Private evidence to preserve outside the public game/repository

1. Keep the supplied Google Takeout ZIPs in a private archive. If possible,
   preserve the original Gemini chat with all generated audio cards. The
   Takeout copy covers prompt/reply text but omits downloadable music.
2. Selected audio identity is verified and its SHA-256 is recorded. Keeping a
   separate private copy of the original download is optional.
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
- [x] Selected third-generation message and audio version identified.
- [x] Original selected MP3 independently matched to the production file using SHA-256 and byte size.
- [x] Generation event timestamps established for 2026-10-13.
- [ ] Gemini model and applicable generation-time terms archived.

**Rights note:** This file is not public-domain/CC0 evidence. Google's
[Terms of Service](https://policies.google.com/terms) contain a statement
that Google does not claim ownership of original generated content; that
statement alone is not a warranty of exclusivity, copyright eligibility or
freedom from third-party claims. Review the actual service-specific terms
that applied when the track was created.
