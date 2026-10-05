(function () {
  const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];
  const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Other'];
  const VALID_CATEGORIES = {
    expense: EXPENSE_CATEGORIES,
    income: INCOME_CATEGORIES,
  };

  function createId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function parseAmountToPaise(value) {
    if (value === null || value === undefined) {
      return null;
    }

    const text = typeof value === 'string' ? value.trim() : String(value).trim();
    if (text === '') {
      return null;
    }

    if (!/^-?\d+(\.\d{1,2})?$/.test(text)) {
      return null;
    }

    const numeric = Number(text);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    const paise = Math.round((numeric + Number.EPSILON) * 100);
    if (!Number.isInteger(paise) || Math.abs(paise) > 99999999900) {
      return null;
    }

    return paise;
  }

  function validateTransaction(input = {}) {
    const errors = {
      amount: '',
      category: '',
      date: '',
      description: '',
    };

    const type = String(input.type || '').trim().toLowerCase();
    const amountValue = input.amount !== undefined ? input.amount : input.amountPaise;
    const categoryValue = typeof input.category === 'string' ? input.category.trim() : String(input.category || '').trim();
    const dateValue = typeof input.date === 'string' ? input.date.trim() : String(input.date || '').trim();
    const descriptionValue = typeof input.description === 'string' ? input.description.trim() : String(input.description || '').trim();

    if (amountValue === undefined || amountValue === null || String(amountValue).trim() === '') {
      errors.amount = 'Amount is required';
    } else {
      const parsedAmount = parseAmountToPaise(amountValue);
      if (parsedAmount === null) {
        errors.amount = 'Amount must be a valid number with at most 2 decimal places';
      } else if (parsedAmount <= 0) {
        errors.amount = 'Amount must be greater than 0';
      } else if (Math.abs(parsedAmount) > 99999999900) {
        errors.amount = 'Amount must be at most ₹99,99,99,999';
      }
    }

    if (!['income', 'expense'].includes(type)) {
      errors.category = 'Type is required';
    }

    if (categoryValue === '') {
      errors.category = 'Category is required';
    } else if (type && VALID_CATEGORIES[type] && !VALID_CATEGORIES[type].includes(categoryValue)) {
      errors.category = 'Category is invalid for the selected type';
    }

    if (dateValue === '') {
      errors.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      errors.date = 'Date must be a valid calendar date';
    } else {
      const [year, month, day] = dateValue.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      const isValidCalendarDate = parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day;
      const today = new Date();
      const maxFuture = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate());

      if (!isValidCalendarDate) {
        errors.date = 'Date must be a valid calendar date';
      } else if (parsedDate > maxFuture) {
        errors.date = 'Date cannot be too far in the future';
      }
    }

    if (descriptionValue === '') {
      errors.description = 'Description is required';
    } else if (descriptionValue.length > 100) {
      errors.description = 'Description must be 1 to 100 characters';
    }

    return {
      valid: !Object.values(errors).some(Boolean),
      errors,
    };
  }

  function createTransaction(input = {}) {
    const sanitized = {
      id: input.id || createId(),
      type: String(input.type || '').trim().toLowerCase(),
      amount: input.amount !== undefined ? input.amount : input.amountPaise,
      category: typeof input.category === 'string' ? input.category.trim() : String(input.category || '').trim(),
      date: typeof input.date === 'string' ? input.date.trim() : String(input.date || '').trim(),
      description: typeof input.description === 'string' ? input.description.trim() : String(input.description || '').trim(),
      createdAt: input.createdAt || Date.now(),
    };

    const validation = validateTransaction(sanitized);
    if (!validation.valid) {
      const message = Object.values(validation.errors).find(Boolean) || 'Invalid transaction';
      const error = new Error(message);
      error.details = validation.errors;
      throw error;
    }

    const parsedAmount = parseAmountToPaise(sanitized.amount);
    return {
      id: sanitized.id,
      type: sanitized.type,
      amountPaise: parsedAmount,
      category: sanitized.category,
      date: sanitized.date,
      description: sanitized.description,
      createdAt: sanitized.createdAt,
    };
  }

  function updateTransaction(list, id, patch = {}) {
    const safeList = Array.isArray(list) ? list : [];
    const index = safeList.findIndex((transaction) => transaction.id === id);
    if (index === -1) {
      return safeList.slice();
    }

    const merged = {
      ...safeList[index],
      ...patch,
    };

    if (patch.amount !== undefined || patch.amountPaise !== undefined) {
      merged.amountPaise = parseAmountToPaise(patch.amount !== undefined ? patch.amount : patch.amountPaise);
    }

    if (patch.type !== undefined) {
      merged.type = String(patch.type).trim().toLowerCase();
    }

    if (patch.category !== undefined) {
      merged.category = String(patch.category).trim();
    }

    if (patch.date !== undefined) {
      merged.date = String(patch.date).trim();
    }

    if (patch.description !== undefined) {
      merged.description = String(patch.description).trim();
    }

    const validation = validateTransaction(merged);
    if (!validation.valid) {
      return safeList.slice();
    }

    return safeList.map((transaction, transactionIndex) => (transactionIndex === index ? merged : transaction));
  }

  function deleteTransaction(list, id) {
    const safeList = Array.isArray(list) ? list : [];
    return safeList.filter((transaction) => transaction.id !== id);
  }

  function filterTransactions(list, filters = {}) {
    const safeList = Array.isArray(list) ? list : [];
    const type = String(filters.type || 'All').trim().toLowerCase();
    const category = String(filters.category || 'All').trim();

    return safeList.filter((transaction) => {
      const matchesType = type === 'all' || transaction.type === type;
      const matchesCategory = category === 'All' || category === 'all' || transaction.category === category;
      return matchesType && matchesCategory;
    });
  }

  function calculateTotals(list) {
    const safeList = Array.isArray(list) ? list : [];
    let incomePaise = 0;
    let expensePaise = 0;

    for (const transaction of safeList) {
      const amount = Number(transaction.amountPaise || 0);
      if (transaction.type === 'income') {
        incomePaise += amount;
      } else if (transaction.type === 'expense') {
        expensePaise += amount;
      }
    }

    return {
      incomePaise,
      expensePaise,
      balancePaise: incomePaise - expensePaise,
    };
  }

  function summarizeMonth(list, month) {
    const safeList = Array.isArray(list) ? list : [];
    const monthKey = month || new Date().toISOString().slice(0, 7);
    const filtered = safeList.filter((transaction) => transaction.date && transaction.date.startsWith(monthKey));
    return calculateTotals(filtered);
  }

  function expenseByCategory(list, month) {
    const safeList = Array.isArray(list) ? list : [];
    const filteredByMonth = month
      ? safeList.filter((transaction) => transaction.type === 'expense' && transaction.date && transaction.date.startsWith(month))
      : safeList.filter((transaction) => transaction.type === 'expense');

    const totals = new Map();
    for (const transaction of filteredByMonth) {
      const current = totals.get(transaction.category) || 0;
      totals.set(transaction.category, current + Number(transaction.amountPaise || 0));
    }

    return Array.from(totals.entries())
      .map(([category, amountPaise]) => ({ category, amountPaise }))
      .sort((first, second) => second.amountPaise - first.amountPaise);
  }

  function sortByDateDesc(list) {
    const safeList = Array.isArray(list) ? list : [];
    return [...safeList].sort((first, second) => String(second.date || '').localeCompare(String(first.date || '')));
  }

  function formatCurrency(paise) {
    const value = Number(paise || 0) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(iso) {
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      return '';
    }

    const [year, month, day] = iso.split('-').map(Number);
    const candidate = new Date(year, month - 1, day);
    if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) {
      return '';
    }

    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(candidate);
  }

  const logic = {
    parseAmountToPaise,
    validateTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    filterTransactions,
    calculateTotals,
    summarizeMonth,
    expenseByCategory,
    sortByDateDesc,
    formatCurrency,
    formatDate,
  };

  if (typeof window !== 'undefined') {
    window.ET = window.ET || {};
    window.ET.logic = logic;
  }

  if (typeof module !== 'undefined') {
    module.exports = logic;
  }
})();
