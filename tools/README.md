# Local test harnesses (not shipped)

Copy a harness into `dist/formday-angular/browser/` after a build and serve that folder with `node tools/serve.js dist/formday-angular/browser 4330`.

- `_selftest-phone.html` runs the in-app acceptance checks (`?selftest=1`) inside a 375 px frame.
- `_frames.html?set=a|b` renders eight screens at 320–430 px and reports page overflow and small tap targets.
- `_themes.html?preset=Paper` taps a theme card in Settings and checks other screens pick it up.
