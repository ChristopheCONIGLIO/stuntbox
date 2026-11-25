# Public release checklist

This repository's development catalogue is not required to run StuntBox.

- Copy only the StuntBox application folder into a new repository, without its Git history.
- Exclude `project.json` (development catalogue metadata) and any temporary files.
- Preserve `vendor/`, `js/local/`, `LICENSE.txt` and `CREDITS.md`.
- Verify upstream audio attribution and redistribution rights.
- Verify image metadata before publishing screenshots.
- Run `node tools/build-local.cjs --check` before creating a release.
- Disconnect from the network and open `index.html` directly; test editing, JSON import/export, race, rally, police chase, both recording layouts and video download in recent desktop Chrome, Firefox and Safari.

The application needs no server. No changes to simulation mechanics are intended by the source layout refactor.
