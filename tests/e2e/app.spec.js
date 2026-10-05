const { test, expect } = require('@playwright/test');
const path = require('node:path');

const indexUrl = `file://${path.resolve(__dirname, '..', '..', 'index.html').replace(/\\/g, '/')}`;

async function addTransaction(page, { type = 'expense', amount = '450', category = 'Food', date = '2026-10-04', description = 'Lunch' }) {
  const form = page.locator('.transaction-form');
  await form.locator(`input[name="type"][value="${type}"]`).check();
  await page.locator('#amount').fill(amount);
  await page.locator('#category').selectOption(category);
  await page.locator('#date').fill(date);
  await page.locator('#description').fill(description);
  await page.locator('.primary-button').click();
}

test.beforeEach(async ({ page }) => {
  await page.goto(indexUrl);
  await expect(page).toHaveTitle(/Expense Tracker/i);
});

test('add expense shows a row and updates totals', async ({ page }) => {
  await addTransaction(page, { type: 'expense', amount: '450', category: 'Food', date: '2026-10-04', description: 'Lunch' });

  await expect(page.locator('#tx-list li')).toHaveCount(1);
  await expect(page.locator('#tx-list li .transaction-description')).toHaveText('Lunch');
  await expect(page.locator('.summary-card--expense .summary-amount')).toHaveText('₹450.00');
  await expect(page.locator('.summary-card--balance .summary-amount')).toHaveText('-₹450.00');
});

test('add income updates the balance correctly', async ({ page }) => {
  await addTransaction(page, { type: 'income', amount: '1200', category: 'Salary', date: '2026-10-05', description: 'Monthly salary' });

  await expect(page.locator('#tx-list li')).toHaveCount(1);
  await expect(page.locator('.summary-card--income .summary-amount')).toHaveText('₹1,200.00');
  await expect(page.locator('.summary-card--balance .summary-amount')).toHaveText('₹1,200.00');
});

test('empty submission shows validation errors and keeps storage empty', async ({ page }) => {
  await page.locator('#amount').fill('');
  await page.locator('#date').fill('');
  await page.locator('#description').fill('');
  await page.locator('.primary-button').click();

  await expect(page.locator('#amount-error')).toContainText(/greater than 0|required/i);
  await expect(page.locator('#date-error')).toContainText(/required|valid/i);
  await expect(page.locator('#description-error')).toContainText(/required|characters|1 to 100/i);
  await expect(page.locator('#tx-list li')).toHaveCount(0);
});

test('edit updates totals and does not create duplicates', async ({ page }) => {
  await addTransaction(page, { type: 'expense', amount: '450', category: 'Food', date: '2026-10-04', description: 'Lunch' });

  await page.locator('#tx-list li [data-action="edit"]').click();
  await page.locator('#amount').fill('550');
  await page.locator('.primary-button').click();

  await expect(page.locator('#tx-list li')).toHaveCount(1);
  await expect(page.locator('.summary-card--expense .summary-amount')).toHaveText('₹550.00');
  await expect(page.locator('.summary-card--balance .summary-amount')).toHaveText('-₹550.00');
});

test('delete can be canceled or confirmed', async ({ page }) => {
  await addTransaction(page, { type: 'expense', amount: '450', category: 'Food', date: '2026-10-04', description: 'Lunch' });

  await page.locator('#tx-list li [data-action="delete"]').click();
  await page.locator('#confirm-dialog button[value="cancel"]').click();
  await expect(page.locator('#tx-list li')).toHaveCount(1);

  await page.locator('#tx-list li [data-action="delete"]').click();
  await page.locator('#confirm-dialog button[value="delete"]').click();
  await expect(page.locator('#tx-list li')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('filters narrow the list and clear resets it', async ({ page }) => {
  await addTransaction(page, { type: 'expense', amount: '450', category: 'Food', date: '2026-10-04', description: 'Lunch' });
  await addTransaction(page, { type: 'expense', amount: '200', category: 'Travel', date: '2026-10-05', description: 'Train ticket' });
  await addTransaction(page, { type: 'income', amount: '1200', category: 'Salary', date: '2026-10-06', description: 'Monthly salary' });

  await page.locator('#filter-type').selectOption('expense');
  await expect(page.locator('#tx-list li')).toHaveCount(2);

  await page.locator('#filter-category').selectOption('Food');
  await expect(page.locator('#tx-list li')).toHaveCount(1);
  await expect(page.locator('#tx-list li .transaction-description')).toHaveText('Lunch');

  await page.locator('.link-button').first().click();
  await expect(page.locator('#tx-list li')).toHaveCount(3);
});

test('persistence survives a page reload', async ({ page }) => {
  await addTransaction(page, { type: 'expense', amount: '450', category: 'Food', date: '2026-10-04', description: 'Lunch' });
  await page.reload();

  await expect(page.locator('#tx-list li')).toHaveCount(1);
  await expect(page.locator('.summary-card--expense .summary-amount')).toHaveText('₹450.00');
});

test('corrupt storage falls back to empty state without crashing', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('expenseTracker.v1', '{bad');
  });
  await page.goto(indexUrl);

  await expect(page.locator('#tx-list li')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('mobile viewport stays usable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await addTransaction(page, { type: 'expense', amount: '450', category: 'Food', date: '2026-10-04', description: 'Lunch' });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBeFalsy();
  await expect(page.locator('.transaction-form')).toBeVisible();
  await expect(page.locator('#amount')).toBeVisible();
});
