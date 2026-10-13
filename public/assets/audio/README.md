# Audio assets (awaiting user-provided binaries)

The audio integration PR deliberately does not ship binary assets until the verified
source files from the supplied `Sounds_confrim.zip` are uploaded to this folder.

Required filenames (case-sensitive):
- click_003.ogg
- drop_003.ogg
- drop_002.ogg
- drop_004.ogg
- bong_001.ogg
- jingles_PIZZI10.ogg
- forget_me_not_in_f_major_looped.ogg
- porcelain_hours.mp3

These are already referenced by `src/audio/AudioAssetManifest.ts`.
Without the files, requests return 404 and the game will have no sound.
**Do not merge/deploy the integration PR before adding all eight files.**
Licensing notes: `docs/AUDIO_LICENSES.md`.
