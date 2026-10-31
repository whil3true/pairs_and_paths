# Audio assets

The eight user-approved files from `Sounds_confrim.zip` are stored in this directory,
with case-sensitive names matching `src/audio/AudioAssetManifest.ts`:

- `click_003.ogg` — shared UI button click
- `drop_003.ogg` — first tile tap
- `drop_002.ogg` — second tile tap
- `drop_004.ogg` — successful pair
- `bong_001.ogg` — blocked matching pair
- `jingles_PIZZI10.ogg` — completed level
- `forget_me_not_in_f_major_looped.ogg` — music track A
- `porcelain_hours.mp3` — music track B

The CI suite verifies that all manifest targets exist and have nonempty audio
files. Run Android playback QA after this PR is merged; CI cannot prove that
device codecs, autoplay policies or music-loop transitions sound correct.

The six effects have file-level Kenney CC0 provenance evidence recorded in
`docs/AUDIO_LICENSES.md` (five matching Git blobs and one matching LFS SHA-256).
No audio files were modified. See that document for the mirror evidence,
official source-pack links and limitations.
