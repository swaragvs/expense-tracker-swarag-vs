const test = require('node:test');
const assert = require('node:assert/strict');

const logic = require('../../js/logic.js');

function makeTx(overrides = {}) {
  return {
    id: 'tx-1',
    type: 'expense',
    amountPaise: 2500,
    category: 'Food',
    date: '2026-10-04',
    description: 'Lunch',
    createdAt: 1759550000000,
    ...overrides,
  };
}

test('parseAmountToPaise converts valid decimal strings to paise', () => {
  assert.equal(logic.parseAmountToPaise('10.50'), 1050);
  assert.equal(logic.parseAmountToPaise('0.10'), 10);
  assert.equal(logic.parseAmountToPaise('9999'), 999900);
});

test('parseAmountToPaise rejects invalid values', () => {
  assert.equal(logic.parseAmountToPaise('0'), 0);
  assert.equal(logic.parseAmountToPaise('-500'), -50000);
  assert.equal(logic.parseAmountToPaise('abc'), null);
  assert.equal(logic.parseAmountToPaise('10.999'), null);
});

test('validateTransaction rejects zero, negative, blank, and invalid date values', () => {
  const invalid = logic.validateTransaction({
    type: 'expense',
    amount: '0',
    category: 'Food',
    date: '2026-02-30',
    description: ' ',
  });

  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.amount, /greater than 0|required/i);
  assert.match(invalid.errors.date, /valid|required/i);
  assert.match(invalid.errors.description, /required|1 to 100|characters/i);
});

test('validateTransaction rejects category mismatch for type', () => {
  const result = logic.validateTransaction({
    type: 'income',
    amount: '1500',
    category: 'Travel',
    date: '2026-10-04',
    description: 'Allowance',
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.category, /invalid|allowed|type/i);
});

test('calculateTotals handles float-safe paise values and empty lists', () => {
  const totalsFromList = logic.calculateTotals([
    makeTx({ type: 'income', amountPaise: 10, category: 'Salary' }),
    makeTx({ type: 'income', amountPaise: 20, category: 'Freelance' }),
    makeTx({ type: 'expense', amountPaise: 15, category: 'Food' }),
  ]);

  assert.deepEqual(totalsFromList, {
    incomePaise: 30,
    expensePaise: 15,
    balancePaise: 15,
  });

  assert.deepEqual(logic.calculateTotals([]), {
    incomePaise: 0,
    expensePaise: 0,
    balancePaise: 0,
  });
});

test('filterTransactions combines type and category filtering', () => {
  const list = [
    makeTx({ id: '1', type: 'expense', category: 'Food', amountPaise: 1000, date: '2026-10-01' }),
    makeTx({ id: '2', type: 'expense', category: 'Travel', amountPaise: 2000, date: '2026-10-02' }),
    makeTx({ id: '3', type: 'income', category: 'Salary', amountPaise: 3000, date: '2026-10-03' }),
    makeTx({ id: '4', type: 'income', category: 'Freelance', amountPaise: 4000, date: '2026-10-04' }),
  ];

  assert.deepEqual(logic.filterTransactions(list, { type: 'expense', category: 'Food' }).map((tx) => tx.id), ['1']);
  assert.deepEqual(logic.filterTransactions(list, { type: 'income', category: 'All' }).map((tx) => tx.id), ['3', '4']);
  assert.deepEqual(logic.filterTransactions(list, { type: 'All', category: 'Travel' }).map((tx) => tx.id), ['2']);
});

test('updateTransaction returns a new list and deleteTransaction ignores unknown ids', () => {
  const list = [
    makeTx({ id: 'a', amountPaise: 1000, type: 'expense', category: 'Food' }),
    makeTx({ id: 'b', amountPaise: 2000, type: 'income', category: 'Salary' }),
  ];

  const updated = logic.updateTransaction(list, 'a', { amount: '15.50', category: 'Travel' });
  assert.equal(updated[0].amountPaise, 1550);
  assert.equal(updated[0].category, 'Travel');
  assert.equal(updated[1].id, 'b');

  const deleted = logic.deleteTransaction(list, 'missing');
  assert.equal(deleted.length, 2);
});

test('summarizeMonth excludes other months and expenseByCategory groups totals', () => {
  const list = [
    makeTx({ id: 'm1', date: '2026-09-30', type: 'expense', category: 'Food', amountPaise: 5000 }),
    makeTx({ id: 'm2', date: '2026-10-01', type: 'income', category: 'Salary', amountPaise: 20000 }),
    makeTx({ id: 'm3', date: '2026-10-04', type: 'expense', category: 'Food', amountPaise: 1500 }),
    makeTx({ id: 'm4', date: '2026-10-10', type: 'expense', category: 'Travel', amountPaise: 2500 }),
  ];

  const monthSummary = logic.summarizeMonth(list, '2026-10');
  assert.deepEqual(monthSummary, {
    incomePaise: 20000,
    expensePaise: 4000,
    balancePaise: 16000,
  });

  const categories = logic.expenseByCategory(list, '2026-10');
  assert.deepEqual(categories, [
    { category: 'Travel', amountPaise: 2500 },
    { category: 'Food', amountPaise: 1500 },
  ]);
});

test('sortByDateDesc puts latest transactions first and formatCurrency/formatDate are stable', () => {
  const list = [
    makeTx({ id: 'old', date: '2026-10-01' }),
    makeTx({ id: 'newer', date: '2026-10-05' }),
    makeTx({ id: 'middle', date: '2026-10-03' }),
  ];

  const sorted = logic.sortByDateDesc(list);
  assert.deepEqual(sorted.map((tx) => tx.id), ['newer', 'middle', 'old']);
  assert.equal(logic.formatCurrency(45000), '₹450.00');
  assert.equal(logic.formatDate('2026-10-04'), '4 Oct 2026');
});
