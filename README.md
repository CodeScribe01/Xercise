# Xercise

A beginner-first daily training guide. It shows today's workout with real exercise photos, guides you through each set with a rest timer, logs weights and reps on your device, and tracks your progress. The library has 169 exercises across 15 muscle groups.

It is built with Angular 21 and runs as a static site. There is no server or account, and everything is saved in the browser.

Live site: https://codescribe01.github.io/Xercise/

## Run locally

You need Node.js 20.19 or later, 22.12 or later, or 24 or later.

```bash
npm install
npm start          # dev server on http://localhost:4200
npm run build      # static site in dist/xercise/browser
```

Open the app with `?selftest=1` added to the address to run the built-in checks. The results appear at the bottom of the page.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds the app and publishes it on every push to `main`.

1. On GitHub, open the repository's **Settings**, then **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**. This is a one-time step.
3. Push to `main`, or open **Actions**, choose **Deploy to GitHub Pages** and click **Run workflow**. If a run failed before Pages was switched on, open it and click **Re-run all jobs**.
4. When the run turns green, the site is live at `https://<your-user>.github.io/Xercise/`. The link is also shown on the run's summary page.

The app uses `<base href="./">` and relative paths for every file, so it works under the repository's sub-path without changes. Saved progress belongs to each browser and site address, so data from localhost does not appear on the live site.

## Project layout

- `src/styles.css`: all styling.
- `src/app/data/`: the weekly plan, exercises and media lists.
- `src/app/core/`: state, storage, sessions, timers, dialogs, appearance and the exercise catalog.
- `src/app/features/` and `src/app/shared/`: screens and reusable components.
- `public/`: photos, running videos, fonts and the catalog data, each with its licence.
- `tools/`: the catalog builder and test pages (see `tools/README.md`).

## Update notes

### Upgrade notes (October 2026)

- Exercise demonstrations use real start/finish photographs from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (public domain, The Unlicense), shipped locally under `public/media/exercises/` with `LICENSE.txt`. The player (`src/app/shared/demo.component.ts`) cross-fades the two positions in a loop with play, pause, replay, loop, speed and fullscreen, and falls back to the animated figure guide when photos are missing or fail to load.
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
- Test harnesses live in `tools/` (see `tools/README.md`).

### Full exercise library and mobile fixes (October 2026)

- **169 exercises across 15 muscle groups**: chest, shoulders, triceps, biceps, forearms, lats, middle back, traps, abs and core, lower back, glutes, quads, hamstrings, calves, inner and outer thigh. Every group has at least five, and most have 10 to 15, across several types of equipment.
- **Catalog**: `public/data/catalog.json` with photos in `public/media/library/` (Free Exercise DB, public domain), built by `node tools/build-catalog.js` and resized with `tools/resize-photos.ps1`. `src/app/core/catalog.service.ts` loads it in the background and registers each entry as a normal exercise, so it can be demonstrated, added to a day, logged and tracked.
- **Library**: starts with "Train by muscle" tiles grouped into upper body, core and lower body. A group page has equipment, difficulty and favourites filters, search, and rows with favourite and add-to-session buttons. The library is loaded as its own chunk to keep the first download under budget.
- **Same-muscle variety**: every exercise detail shows "More for this muscle" with a link to the full group, and plan exercise cards link to "More … exercises".
- **Mobile fixes** checked at 360 px: dialog content no longer grows wider than the screen, overview buttons sit in one row, settings tabs fit, colour rows are compact, warm-up timers drop under their text, and rest and stepper buttons show their icons.
- Library exercises have the catalog's steps and a general safety note. Only plan exercises have hand-written cues and common mistakes.
