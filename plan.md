# Expense Tracker Blueprint

I'm treating this as a mentor-led build. Deadline is **tomorrow, 5 Oct, 5:00 PM**, so the plan has about 7 hours of work and a buffer. Aim to submit by noon.

## 0. Key decisions (and why)

| Decision | Why |
|---|---|
| Vanilla HTML/CSS/JS, **no framework** | Matches the brief exactly. |
| **Classic `<script>` files with one global namespace, not ES modules** | Browsers block `type="module"` on `file://`, and the README promises "open index.html". Modules would break that. |
| **Pure logic separated from DOM** (`logic.js`) | It can be unit-tested in Node with no browser. |
| **Money stored as integer paise** | Avoids float bugs like `0.1 + 0.2`. |
| **Dates stored as `YYYY-MM-DD` strings** | `new Date("2026-10-04")` is parsed as UTC and can shift the day. Compare and format strings yourself. |
| **`textContent`, never `innerHTML`, for user text** | Prevents XSS from descriptions. |
| **`<dialog>` for delete confirm** | Native, accessible, no library. |
| **`Intl.NumberFormat('en-IN')`** | Gives ₹1,00,000 formatting with no library. |
| **CSS-only bar chart** | No chart library needed. |
| **Tests: `node:test` (unit) and Playwright (E2E, dev-only)** | The app stays dependency-free. Testing tools live only in `devDependencies`. |

**Data model**
```js
{ id: "uuid", type: "income"|"expense", amountPaise: 45000,
  category: "Food", date: "2026-10-04", description: "Lunch", createdAt: 1759550000000 }
```
`localStorage` key: `expenseTracker.v1` → `{ version: 1, transactions: [...] }`. The version field lets you migrate later.

**Final structure**
```
expense-tracker-swarag-vs/
├── .github/copilot-instructions.md   ← permanent context for Copilot
├── docs/PROGRESS.md                  ← running memory between prompts
├── index.html
├── css/style.css
├── js/{logic.js, storage.js, ui.js, app.js}
├── tests/{unit/*.test.js, e2e/*.spec.js, REGRESSION.md}
├── package.json  .gitignore  README.md
```

## 1. Context management system (this is what saves your tokens)

1. **`copilot-instructions.md`** is read automatically on every request. It holds rules and architecture, so you never repeat them.
2. **`docs/PROGRESS.md`** works as a save file. Every prompt ends with "update PROGRESS.md". The next chat starts with "read PROGRESS.md".
3. **One new Copilot chat per phase.** Long chats drift and waste context.
4. Name files in the prompt (`#file:js/logic.js`) and restrict edits ("only touch X").
5. Keep files small, since small files cost less context.
6. Commit after every phase. Git is also your undo button.

## 2. Roadmap

| Phase | Goal | Time |
|---|---|---|
| 0 | GitHub repo and local clone | 20 min |
| 1 | Scaffold, context files, tooling | 30 min |
| 2 | Domain logic and unit tests | 60 min |
| 3 | HTML structure and design system | 60 min |
| 4 | Storage, render, add with validation | 60 min |
| 5 | Edit, delete, filters | 60 min |
| 6 | Bonus: monthly summary and chart | 45 min |
| 7 | Responsive, accessibility, polish | 45 min |
| 8 | E2E and regression tests | 45 min |
| 9 | README, final QA, submit | 30 min |

---

## Phase 0: Create the repo and clone it (do this now)

You do this phase yourself, not Copilot. From your document, the name is `expense-tracker-swarag-vs`.

**Option A: GitHub CLI (fastest)**
```bash
git --version                      # confirm git is installed
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
gh auth login                      # once; choose GitHub.com, HTTPS, browser
cd ~/projects                      # or wherever you keep code
gh repo create expense-tracker-swarag-vs --public --add-readme --clone
cd expense-tracker-swarag-vs
```

**Option B: Web UI**
1. github.com → **New repository** → name `expense-tracker-swarag-vs`.
2. Visibility **Public**, so the reviewer can open it without access issues.
3. Tick **Add a README**, add a `.gitignore` template of **Node**, then **Create**.
4. Click **Code → HTTPS → copy**, then:
```bash
git clone https://github.com/<your-username>/expense-tracker-swarag-vs.git
cd expense-tracker-swarag-vs
code .
```

**Verify**
```bash
git status            # "On branch main, nothing to commit"
git remote -v         # shows origin → your repo
```

**Branching:** with one day, work on `main` and commit per phase. It's simple and nothing is lost.

**Commit message style:** `feat: add transaction form`, `test: unit tests for totals`, `fix: ...`, `docs: ...`. Clean history is part of what they'll judge.

✅ **Done when:** the folder is open in VS Code and `git remote -v` shows your repo.

---

## Phase 1: Scaffold and context files

**Create the folders and files**
```bash
mkdir -p .github docs css js tests/unit tests/e2e
touch .github/copilot-instructions.md docs/PROGRESS.md index.html css/style.css js/{logic,storage,ui,app}.js
```

**Paste this into `.github/copilot-instructions.md`** (you do this one by hand):
```markdown
# Project: Expense Tracker (LTS assignment) — vanilla HTML/CSS/JS only
## Hard rules
- No frameworks, no bundlers, no runtime dependencies. Must work by opening index.html (file://).
- NO ES modules. Classic <script> tags, one global namespace `ET` (ET.logic, ET.storage, ET.ui).
- logic.js is PURE (no DOM, no localStorage). Must export for Node: `if (typeof module!=='undefined') module.exports = ...`
- Money = integer paise (amountPaise). Dates = "YYYY-MM-DD" strings. Never use new Date("YYYY-MM-DD").
- User text goes in via textContent, never innerHTML.
- Storage key `expenseTracker.v1` = { version:1, transactions:[] }; wrap localStorage in try/catch.
- Currency: Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'}).
## Model
{ id, type:'income'|'expense', amountPaise, category, date, description, createdAt }
## Categories
Expense: Food, Travel, Shopping, Bills, Entertainment, Health, Other. Income: Salary, Freelance, Other.
## Style
- Small functions, meaningful names, JSDoc on public functions, files < 250 lines.
- CSS: design tokens in :root, mobile-first, BEM-ish class names, no !important.
- Accessibility: labels on every input, aria-live for errors/totals, visible focus, 44px touch targets.
## Workflow
- Before work: read docs/PROGRESS.md. After work: update it (what's done, decisions, next step).
- Only edit files named in the prompt. Don't add features not asked for.
```

**Phase 1 Copilot prompt** (only for the remaining setup):
```
Read .github/copilot-instructions.md. Task (scaffold only, no features):
1. index.html: valid HTML5 skeleton, meta viewport, title "Expense Tracker", link css/style.css, script tags at end of body in order logic.js, storage.js, ui.js, app.js.
2. Each js file: IIFE that attaches an empty object to window.ET (e.g. ET.logic) and logic.js also supports module.exports.
3. package.json: "private": true, scripts: "test": "node --test tests/unit", devDependencies empty for now.
4. docs/PROGRESS.md: sections "Done / Decisions / Next / Known issues", filled for Phase 1.
Only touch those files.
```
```bash
git add . && git commit -m "chore: scaffold project and copilot context" && git push
```

---

## Phase 2: Domain logic and unit tests (the brain of the app)

**Functions in `logic.js` (all pure):**
`parseAmountToPaise(str)`, `validateTransaction(input)` → `{valid, errors:{field:msg}}`, `createTransaction(input)`, `updateTransaction(list,id,patch)`, `deleteTransaction(list,id)`, `filterTransactions(list,{type,category})`, `calculateTotals(list)` → `{incomePaise, expensePaise, balancePaise}`, `summarizeMonth(list,'2026-10')`, `expenseByCategory(list)`, `sortByDateDesc(list)`, `formatCurrency(paise)`, `formatDate(iso)`.

**Validation rules:** amount is greater than 0, at most 2 decimals, and has an upper cap (e.g. ≤ 99,99,99,999). Category must be valid for the type. Date is required, a real calendar date, and not unreasonably far in the future. Description is trimmed, 1–100 characters. The error messages are human wording like "Amount must be greater than 0".

**Unit test cases to require:** `0`, `-500`, `abc`, `10.999`, `" "` (description), `2026-02-30` (invalid date), `0.1+0.2` totals exact, empty list totals zero, filter combos (type × category), edit changes totals, delete of an unknown id is a no-op, month summary excludes other months.

**Prompt:**
```
New chat. Read .github/copilot-instructions.md and docs/PROGRESS.md.
Implement js/logic.js per the model in the instructions. Functions: parseAmountToPaise, validateTransaction, createTransaction, updateTransaction, deleteTransaction, filterTransactions, calculateTotals, summarizeMonth, expenseByCategory, sortByDateDesc, formatCurrency, formatDate. Validation returns {valid, errors:{amount,category,date,description}} with friendly messages. Pure functions, no mutation of inputs.
Then write tests/unit/logic.test.js using node:test and node:assert/strict covering: valid/invalid amounts (0, -500, abc, 10.999, 10.5), invalid calendar date (2026-02-30), blank description, category/type mismatch, float-safe totals, empty list, each filter combo, edit, delete, delete-unknown-id, monthly summary boundaries (2026-09-30 vs 2026-10-01), category breakdown.
Run `npm test` and fix until green. Only touch js/logic.js and tests/unit/logic.test.js. Update docs/PROGRESS.md.
```
Run `npm test` yourself. **Gate: all green** before moving on.
Commit: `feat: pure domain logic with unit tests`

---

## Phase 3: HTML structure and design system

**Design direction: "calm fintech dashboard."** Reference points are Monzo, Revolut, and Splitwise: lots of whitespace, big numbers, soft cards.

**Tokens** (in `:root`):
- Colors: surface `#F7F8FA`, card `#FFFFFF`, text `#111827`, muted `#6B7280`, brand indigo `#4F46E5`, income green `#059669`, expense red `#DC2626`. All text must pass WCAG AA (4.5:1).
- Optional dark mode through `prefers-color-scheme`, if time remains.
- Type: system font stack, tabular numerals for amounts (`font-variant-numeric: tabular-nums`), 1.25 scale.
- Spacing on an 8px scale; radius 12px; subtle shadow.

**Components:** three summary cards (Income / Expenses / Balance, where balance turns red if negative), a form card with segmented Income/Expense toggle (radio buttons styled as a switch), a transaction list with category chips and signed colored amounts, a filter bar, an empty state with an illustration and text, a `<dialog>` for delete, and a toast for "Saved".

**Semantic HTML:** `<header>`, `<main>`, `<section aria-labelledby>`, `<form novalidate>` (you validate yourself), `<ul>` for the list, and `<template id="tx-template">` for rows.

**Prompt:**
```
New chat. Read .github/copilot-instructions.md and docs/PROGRESS.md.
Build the static UI only (no JS logic yet). index.html + css/style.css.
Layout: header; 3 summary cards (Income, Expenses, Balance) with aria-live="polite"; two-column grid on ≥900px (form card left, transactions right), single column on mobile. 
Form: segmented Income/Expense radio toggle, amount (inputmode="decimal"), category select, date input, description input, per-field error <p> elements with aria-describedby, submit "Add transaction" + hidden "Cancel edit" button.
Transactions: filter bar (type select, category select, "Clear filters"), <ul id="tx-list">, <template id="tx-template"> for a row (category chip, description, date, signed amount, Edit/Delete icon-buttons with aria-labels), empty-state block.
Also: <dialog id="confirm-dialog"> with Cancel/Delete, and a toast container.
Design: calm fintech look; tokens in :root (indigo brand, green income, red expense, AA contrast), 8px spacing scale, 12px radius, tabular-nums for money, visible :focus-visible, 44px min touch targets, mobile-first. Use hardcoded sample rows temporarily marked <!-- TEMP --> so I can preview.
Only touch index.html and css/style.css. Update PROGRESS.md.
```
Commit: `feat: semantic markup and design system`

---

## Phase 4: Storage, rendering, add with validation

**`storage.js`:** `load()` (try/catch, validates shape, falls back to `[]` on corrupt JSON), `save(list)` (try/catch, returns boolean so the UI can show "storage full/blocked").
**`ui.js`:** `renderTotals`, `renderList`, `showErrors`, `clearErrors`, `readForm`, `fillForm`, `toast`. It never holds business logic.
**`app.js`:** the single `state = {transactions, editingId, filters}` and the loop **action → update state → save → render()**. `render()` always redraws everything from state, which prevents out-of-sync bugs.

Details: remove the TEMP rows, swap the category options when the type toggles, reset the form after adding, focus the first invalid field, default the date to today (build it from local parts, not `toISOString`, which is UTC).

**Prompt:**
```
New chat. Read .github/copilot-instructions.md, docs/PROGRESS.md, #file:js/logic.js (API only) and #file:index.html.
Implement js/storage.js (load/save with try/catch, shape validation, corrupt-JSON fallback to []), js/ui.js (render functions, no business logic, textContent only, clone <template>), js/app.js (state {transactions, editingId, filters}; flow action→state→save→render). 
Features this phase: render totals + sorted list + empty state; add transaction with validateTransaction, inline field errors, focus first invalid field, toast on success, form reset; type toggle swaps category options; date defaults to today using local date parts. Remove TEMP markup. 
Only touch storage.js, ui.js, app.js, and index.html if needed. Update PROGRESS.md.
```
**Manual check:** add, refresh (F5), data persists; add `0`, `-5`, and empty fields and confirm each error shows.
Commit: `feat: add transactions with validation and persistence`

---

## Phase 5: Edit, delete, filter

- **Edit:** the Edit button fills the form, sets `editingId`, changes the button to "Save changes", shows "Cancel edit", and scrolls the form into view on mobile. Saving calls `updateTransaction`. Editing must **never** create a duplicate.
- **Delete:** open `<dialog>`, then on confirm call `deleteTransaction` and render. If the deleted item was being edited, reset the form.
- **Filters:** type and category selects drive `state.filters`. Selecting a type narrows the category options. The totals cards stay **global** (all data), while a small line "Showing 3 of 12" explains the filtered list. Decide this on purpose and document it in the README.

**Prompt:**
```
New chat. Read .github/copilot-instructions.md, docs/PROGRESS.md, #file:js/app.js, #file:js/ui.js.
Add: (1) Edit — fill form, editingId, button label "Save changes", Cancel edit, no duplicates on save; (2) Delete — via <dialog id="confirm-dialog"> with focus return to the trigger, reset form if deleting the item being edited; (3) Filters — type + category via filterTransactions, "Clear filters", "Showing X of Y" text, filtered-empty state ("No matches" + clear button) distinct from no-data state. Summary cards remain global totals. Use event delegation on #tx-list (data-id + data-action). 
Only touch app.js, ui.js, index.html, style.css. Update PROGRESS.md.
```
Commit: `feat: edit, delete, and filtering`

---

## Phase 6: Bonus features

- **Monthly summary:** a `<input type="month">` defaulting to the current month. It shows Income, Expenses, and Balance for that month using `summarizeMonth`.
- **Category chart:** horizontal CSS bars for expense categories in the selected month. Width is a percentage of the largest category, with label, amount, and percentage of total. Add `role="img"` with an `aria-label` summary, plus an empty state. Use `<div>` bars with `style.width` and a CSS transition. No library.

**Prompt:**
```
New chat. Read .github/copilot-instructions.md, docs/PROGRESS.md, #file:js/logic.js (summarizeMonth, expenseByCategory signatures only).
Add a "Monthly overview" section: month picker (default current month, local date parts), 3 mini stats via summarizeMonth, and a pure-CSS horizontal bar chart of expense by category for that month (bars sorted desc, width relative to max, shows amount + % of total, role="img" with aria-label summary, empty state "No expenses this month"). Add unit tests for any new pure helper in tests/unit/logic.test.js. Keep chart code in ui.js (render only).
Update PROGRESS.md.
```
Commit: `feat: monthly summary and category chart`

---

## Phase 7: Responsive, accessibility, polish

**Checklist:**
- Test at 360, 390, 768, 1024, and 1440px, with no horizontal scroll at 320.
- Mobile list rows stack (amount on top, actions below) and the inputs use at least 16px font so iOS doesn't zoom.
- Keyboard-only run-through: Tab order, Esc closes the dialog, focus returns correctly.
- Run Lighthouse; target Accessibility ≥ 95.
- `prefers-reduced-motion` disables animations.
- Add micro-interactions: button press states, 150ms hover transitions, and a toast fade.
- Run a long-description overflow test (`word-break`/ellipsis) and a huge amount test (₹99,99,99,999.99 must not break layout).

**Prompt:**
```
New chat. Read .github/copilot-instructions.md, docs/PROGRESS.md, #file:css/style.css, #file:index.html.
CSS/markup polish only, no logic changes. Audit and fix: no horizontal scroll at 320px; mobile transaction row stacks; inputs ≥16px; 44px targets; focus-visible rings; dialog Esc + focus return; prefers-reduced-motion; text-overflow for long descriptions and huge amounts; contrast AA; consistent spacing; subtle transitions (≤150ms). Optionally add prefers-color-scheme dark tokens. List what you changed in PROGRESS.md.
```
Commit: `style: responsive and accessibility polish`

---

## Phase 8: Testing (unit, E2E, regression)

**Test pyramid for this app**
- **Unit** (Phase 2, extend if needed): all logic, runs in about 1 second.
- **E2E (Playwright):** the user journeys.
- **Regression:** a repeatable manual checklist plus the automated suites.

**E2E specs** (`tests/e2e/app.spec.js`):
1. Add an expense, then see the row and updated totals.
2. Add income, then the balance is correct.
3. Validation: submit empty, errors appear and nothing is saved.
4. Edit: change 450 → 550 and totals update, with no duplicate row.
5. Delete: cancel keeps the row, confirm removes it.
6. Filter by type, by category, by both, then clear.
7. **Persistence:** add, `page.reload()`, still there.
8. Corrupt storage: set `localStorage` to `"{bad"` and the app loads empty without crashing.
9. Mobile viewport (390×844): no horizontal overflow, form usable.

**Prompt:**
```
New chat. Read .github/copilot-instructions.md and docs/PROGRESS.md.
Set up Playwright as a devDependency only: package.json scripts "e2e": "playwright test". playwright.config.js: testDir tests/e2e, use file:// URL of index.html, projects chromium desktop + a 390x844 mobile viewport, no webServer. Write tests/e2e/app.spec.js covering: add expense; add income and balance; empty-submit validation; edit 450→550 with totals update and no duplicate; delete cancel vs confirm; filters (type, category, both, clear); persistence across reload; corrupt localStorage recovery; mobile no horizontal overflow. Use accessible locators (getByRole/getByLabel). Add .gitignore entries for node_modules, test-results, playwright-report. Do not touch app code except adding missing data-testid/aria attributes if essential; report any bug found instead of silently changing logic.
```
```bash
npm install -D @playwright/test && npx playwright install chromium
npm test && npm run e2e
```
Then write `tests/REGRESSION.md`, a 15-line checklist that you run before every release: add/edit/delete/filter/refresh/mobile/empty/corrupt storage/negative amount/long text/month boundary.

Commit: `test: e2e suite and regression checklist`

---

## Phase 9: README, final QA, submit

**README (short, as the brief asks):** one-line description, features, tech, **How to run** (open `index.html`; no install), how to run tests (`npm test`, `npm run e2e`), design decisions (paise, local dates, global totals vs filtered list), and a screenshot or two.

**Prompt:**
```
Read docs/PROGRESS.md and the project files list. Write README.md (short): description, feature list (core + bonus), tech stack, "How to run" (open index.html, no install), "Run tests" (npm test, npm run e2e), 4 design decisions (integer paise, local date strings, global totals vs filtered list, no framework/file:// compatibility), folder structure. Add a screenshots/ placeholder section. Do not touch code.
```

**Final QA, in a fresh clone:**
```bash
cd /tmp && git clone https://github.com/<you>/expense-tracker-swarag-vs.git && open expense-tracker-swarag-vs/index.html
```
Run through the regression checklist there. If it works in a clean clone, it works for the reviewer.

**Submit:** make sure the repo is public, `git log` shows the final commit on GitHub, then share the link: `https://github.com/<you>/expense-tracker-swarag-vs`.

---

## Mentor notes

- **Priority order if time collapses:** Phases 0–5 plus README is a complete submission. Phases 6–8 are the differentiators, and 7 matters more than 6.
- **Never let Copilot's output go in unread.** After each phase, read the diff (`git diff`) and be able to explain every function, since you may be asked about it.
- If Copilot rewrites files you didn't name, reject it and re-prompt with "only touch X."

**Your next step:** do Phase 0 now. When `git remote -v` shows your repo, tell me, and we'll do Phase 1 together, including the exact `copilot-instructions.md` tuning.