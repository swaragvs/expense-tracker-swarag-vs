(function () {
  function getCurrencyValue(value) {
    return value === undefined || value === null ? 0 : Number(value);
  }

  function renderTotals(totals) {
    const income = document.querySelector('.summary-card--income .summary-amount');
    const expenses = document.querySelector('.summary-card--expense .summary-amount');
    const balance = document.querySelector('.summary-card--balance .summary-amount');
    const balanceCard = document.querySelector('.summary-card--balance');

    if (!income || !expenses || !balance || !balanceCard) {
      return;
    }

    income.textContent = window.ET.logic.formatCurrency(getCurrencyValue(totals.incomePaise));
    expenses.textContent = window.ET.logic.formatCurrency(getCurrencyValue(totals.expensePaise));
    balance.textContent = window.ET.logic.formatCurrency(getCurrencyValue(totals.balancePaise));

    balanceCard.classList.toggle('summary-card--negative', totals.balancePaise < 0);
  }

  function renderList(transactions, totalCount, filters = {}) {
    const list = document.getElementById('tx-list');
    const empty = document.querySelector('.empty-state');
    const filteredEmpty = document.querySelector('.filtered-empty-state');
    const listMeta = document.getElementById('list-meta');
    const template = document.getElementById('tx-template');

    if (!list || !template) {
      return;
    }

    const visibleCount = Array.isArray(transactions) ? transactions.length : 0;
    const totalTransactions = Number(totalCount) || 0;

    if (listMeta) {
      listMeta.textContent = `Showing ${visibleCount} of ${totalTransactions}`;
    }

    list.innerHTML = '';

    if (empty) {
      empty.hidden = totalTransactions !== 0 || (filters.type !== 'all' || filters.category !== 'all');
    }

    if (filteredEmpty) {
      filteredEmpty.hidden = visibleCount !== 0 || totalTransactions === 0;
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return;
    }

    transactions.forEach((transaction) => {
      const row = template.content.firstElementChild.cloneNode(true);
      const amount = Number(transaction.amountPaise || 0);
      const sign = transaction.type === 'income' ? '+' : '-';
      const amountValue = `${sign}${window.ET.logic.formatCurrency(Math.abs(amount))}`;

      row.dataset.id = transaction.id;
      row.classList.toggle('transaction-row--income', transaction.type === 'income');
      row.classList.toggle('transaction-row--expense', transaction.type === 'expense');

      const categoryChip = row.querySelector('.category-chip');
      if (categoryChip) {
        categoryChip.textContent = transaction.category;
        categoryChip.classList.toggle('category-chip--income', transaction.type === 'income');
      }

      const description = row.querySelector('.transaction-description');
      if (description) {
        description.textContent = transaction.description;
      }

      const dateNode = row.querySelector('.transaction-date');
      if (dateNode) {
        dateNode.textContent = window.ET.logic.formatDate(transaction.date) || transaction.date;
      }

      const amountNode = row.querySelector('.amount');
      if (amountNode) {
        amountNode.textContent = amountValue;
        amountNode.classList.toggle('amount--income', transaction.type === 'income');
        amountNode.classList.toggle('amount--expense', transaction.type === 'expense');
      }

      const editButton = row.querySelector('[data-action="edit"]');
      const deleteButton = row.querySelector('[data-action="delete"]');

      if (editButton) {
        editButton.dataset.id = transaction.id;
      }

      if (deleteButton) {
        deleteButton.dataset.id = transaction.id;
      }

      list.appendChild(row);
    });
  }

  function showErrors(errors) {
    clearErrors();
    const fields = ['amount', 'category', 'date', 'description'];

    fields.forEach((field) => {
      const message = errors && errors[field];
      const node = document.getElementById(`${field}-error`);
      if (node) {
        node.textContent = message || '';
      }
    });
  }

  function clearErrors() {
    const fields = ['amount', 'category', 'date', 'description'];
    fields.forEach((field) => {
      const node = document.getElementById(`${field}-error`);
      if (node) {
        node.textContent = '';
      }
    });
  }

  function readForm(form) {
    const checkedType = form.querySelector('input[name="type"]:checked');
    const type = checkedType ? checkedType.value : 'expense';

    return {
      type,
      amount: form.querySelector('#amount')?.value || '',
      category: form.querySelector('#category')?.value || '',
      date: form.querySelector('#date')?.value || '',
      description: form.querySelector('#description')?.value || '',
    };
  }

  function fillForm(transaction) {
    const form = document.querySelector('.transaction-form');
    if (!form || !transaction) {
      return;
    }

    const typeField = form.querySelector(`input[name="type"][value="${transaction.type}"]`);
    if (typeField) {
      typeField.checked = true;
      const event = new Event('change', { bubbles: true });
      typeField.dispatchEvent(event);
    }

    const amountField = form.querySelector('#amount');
    const categoryField = form.querySelector('#category');
    const dateField = form.querySelector('#date');
    const descriptionField = form.querySelector('#description');

    if (amountField) {
      amountField.value = String(Math.abs(Number(transaction.amountPaise || 0)) / 100);
    }

    if (categoryField) {
      categoryField.value = transaction.category;
    }

    if (dateField) {
      dateField.value = transaction.date;
    }

    if (descriptionField) {
      descriptionField.value = transaction.description;
    }
  }

  function toast(message) {
    const toast = document.querySelector('.toast');
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.add('visible');

    clearTimeout(toast._timerId);
    toast._timerId = setTimeout(() => {
      toast.classList.remove('visible');
    }, 1600);
  }

  const ui = {
    renderTotals,
    renderList,
    showErrors,
    clearErrors,
    readForm,
    fillForm,
    toast,
  };

  window.ET = window.ET || {};
  window.ET.ui = ui;
})();
