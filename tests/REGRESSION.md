# Regression checklist

1. Add an expense and verify the row and totals update.
2. Add an income and verify the balance updates correctly.
3. Submit an empty form and confirm the inline validation messages appear.
4. Edit a transaction and confirm totals recalculate without duplicates.
5. Cancel delete and ensure the row remains visible.
6. Confirm delete and ensure the row is removed from the list.
7. Filter by type, by category, by both, then clear filters.
8. Refresh the page and verify the data persists.
9. Verify the empty state appears when there are no records.
10. Corrupt the stored JSON and confirm the app falls back safely.
11. Check negative balance styling for expense-heavy totals.
12. Validate long descriptions and large amounts do not break layout.
13. Check the month overview for current-month totals and category chart content.
14. Verify mobile layout at 390px width has no horizontal overflow.
15. Run the unit and E2E suites before release.
