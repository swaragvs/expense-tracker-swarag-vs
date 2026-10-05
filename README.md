# Expense Tracker

A lightweight personal finance dashboard for recording income and expenses, filtering transactions, and checking a monthly overview without any framework or build step.

## Features

- Add, edit, and delete income or expense entries
- Instant totals for income, expenses, and balance
- Filters by type and category with a clear summary of visible results
- Monthly overview with category breakdown and spending chart
- Local persistence using the browser's storage API
- Works by opening the app directly from the file system

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js test runner for unit checks
- Playwright for browser regression tests

## How to run

1. Open [index.html](index.html) in a browser.
2. No install step is required.
3. The app stores data in the browser's local storage.

## Run tests

- Unit tests: `npm test`
- Browser tests: `npm run e2e`

## Deploy to Vercel

This project is a static app and is ready for Vercel with no build step.

1. Push this repo to GitHub.
2. Open Vercel and choose "Add New Project".
3. Import this repository.
4. Keep the default settings: framework preset "Other" or static, with no build command and output directory empty/root.
5. Deploy.

## Design decisions

- Money is stored as integer paise to avoid floating-point bugs.
- Dates are stored as YYYY-MM-DD strings to keep comparisons stable and timezone-safe.
- Summary cards always reflect the full dataset, while the transaction list can be filtered separately.
- The app is framework-free and designed to run with a simple file:// browser launch.

## Project structure

- [index.html](index.html) — app shell and UI layout
- [css/style.css](css/style.css) — design system and responsive styling
- [js/logic.js](js/logic.js) — pure transaction and totals logic
- [js/storage.js](js/storage.js) — local storage wrappers
- [js/ui.js](js/ui.js) — rendering and form utilities
- [js/app.js](js/app.js) — app state and event flow
- [tests/unit/logic.test.js](tests/unit/logic.test.js) — unit coverage for the logic layer
- [tests/e2e/app.spec.js](tests/e2e/app.spec.js) — browser journey checks
- [tests/REGRESSION.md](tests/REGRESSION.md) — release checklist


