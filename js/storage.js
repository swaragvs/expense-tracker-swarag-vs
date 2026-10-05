(function () {
  const STORAGE_KEY = 'expenseTracker.v1';

  function isValidTransaction(value) {
    if (!value || typeof value !== 'object') {
      return false;
    }

    if (typeof value.id !== 'string' || value.id.trim() === '') {
      return false;
    }

    if (!['income', 'expense'].includes(value.type)) {
      return false;
    }

    if (!Number.isInteger(value.amountPaise)) {
      return false;
    }

    if (typeof value.category !== 'string' || value.category.trim() === '') {
      return false;
    }

    if (typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
      return false;
    }

    if (typeof value.description !== 'string' || value.description.trim() === '') {
      return false;
    }

    return typeof value.createdAt === 'number';
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.transactions)) {
        return [];
      }

      return parsed.transactions.filter(isValidTransaction);
    } catch (error) {
      return [];
    }
  }

  function save(list) {
    try {
      const transactions = Array.isArray(list) ? list.filter(isValidTransaction) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, transactions }));
      return true;
    } catch (error) {
      return false;
    }
  }

  const storage = {
    load,
    save,
  };

  window.ET = window.ET || {};
  window.ET.storage = storage;
})();
