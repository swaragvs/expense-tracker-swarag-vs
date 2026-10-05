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
