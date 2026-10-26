# FormdayAngular

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## FORMDAY

Angular port of the single-file FORMDAY training guide (`../formday/index.html`). All styling lives in `src/styles.css`, workout data in `src/app/data/plan.ts`, state/storage in `src/app/core/`, UI in `src/app/features/` and `src/app/shared/`.

- `npm start` — dev server on http://localhost:4200
- `npm run build` — static output in `dist/formday-angular/browser` (uses `<base href="./">`, so it can be hosted from any folder on GitHub Pages or Netlify)

### Upgrade notes (October 2026)

- Exercise demonstrations use real start/finish photographs from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (public domain, The Unlicense), shipped locally under `public/media/exercises/` with `LICENSE.txt`. The player (`src/app/shared/demo.component.ts`) cross-fades the two positions in a loop with play, pause, replay, loop, speed and fullscreen, and falls back to the animated figure guide when photos are missing or fail to load. Re-fetch photos with `node ../formday/src/tools/fetch-media.js`.
- Library view: search, muscle / equipment / difficulty filters, favourites, add-to-session (`src/app/features/library.component.ts`, data in `src/app/data/media.ts`).
- Guided session shows one exercise at a time with the demonstration, reps/weight steppers, one-tap set completion, inline rest timer, next-exercise preview (`src/app/features/active-exercise.component.ts`).
- Progress: weekly goal, streak, volume, personal records, recent sessions, suggestions, heatmap. Everything is computed from the local log; nothing is sampled.
- Acceptance checks: open the app with `?selftest=1`; results are printed at the bottom of the page and in the console.

### Mobile, navigation and appearance update (October 2026)

- **Bottom bar on every screen size**: Today, Library, a centre Start / Resume / Done button for the selected day, Progress, Settings. Guided sessions hide it and show their own controls.
- **Weight and reps entry fixed**: the guided set screen filled the boxes from defaults on every clock tick, so typed values snapped back. Boxes are now filled once per set, accept `7,5` or `7.5`, select their content on tap, and weight comes before reps.
- **Phones first**: day sections collapse into progress rows, the seven day tiles always fit, compact demo controls adapt to their card, the rest timer is a floating bar instead of a full sheet, and nothing overflows from 320 px up.
- **Running videos**: real footage from Wikimedia Commons (`public/media/run/ATTRIBUTION.txt`; CC BY 4.0 and CC BY-SA 2.0, credited on screen).
- **Settings → Appearance** (`src/app/core/ui.service.ts`, `src/app/features/settings.component.ts`): six themes, light and dark palettes with live contrast checks, workout colours, body and headline fonts (Barlow and Barlow Condensed bundled under the SIL OFL in `public/fonts/`), text size, headline weight/case/spacing, corner roundness, button shape, shadows, borders, spacing density, bottom bar style and labels, motion and autoplay, theme export/import and reset. Everything is saved with the rest of the data on the device.
- The stylesheet `src/styles.css` is now maintained here; the single-file version in `../formday` keeps its own copy.
- Test harnesses live in `tools/` (see `tools/README.md`).

### Full exercise library and mobile fixes (October 2026)

- **169 exercises across 15 muscle groups**: chest, shoulders, triceps, biceps, forearms, lats, middle back, traps, abs and core, lower back, glutes, quads, hamstrings, calves, inner and outer thigh. Every group has at least five, and most have 10 to 15, across several types of equipment.
- **Catalog**: `public/data/catalog.json` with photos in `public/media/library/` (Free Exercise DB, public domain), built by `node tools/build-catalog.js` and resized with `tools/resize-photos.ps1`. `src/app/core/catalog.service.ts` loads it in the background and registers each entry as a normal exercise, so it can be demonstrated, added to a day, logged and tracked.
- **Library**: starts with "Train by muscle" tiles grouped into upper body, core and lower body. A group page has equipment, difficulty and favourites filters, search, and rows with favourite and add-to-session buttons. The library is loaded as its own chunk to keep the first download under budget.
- **Same-muscle variety**: every exercise detail shows "More for this muscle" with a link to the full group, and plan exercise cards link to "More … exercises".
- **Mobile fixes** checked at 360 px: dialog content no longer grows wider than the screen, overview buttons sit in one row, settings tabs fit, colour rows are compact, warm-up timers drop under their text, and rest and stepper buttons show their icons.
- Library exercises have the catalog's steps and a general safety note. Only plan exercises have hand-written cues and common mistakes.
