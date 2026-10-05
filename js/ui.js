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

  function renderMonthlyOverview(monthSummary, categoryBreakdown, monthValue) {
    const incomeNode = document.getElementById('month-income');
    const expenseNode = document.getElementById('month-expenses');
    const balanceNode = document.getElementById('month-balance');
    const monthInput = document.getElementById('month-filter');
    const chart = document.getElementById('month-chart');

    if (incomeNode) {
      incomeNode.textContent = window.ET.logic.formatCurrency(getCurrencyValue(monthSummary.incomePaise));
    }

    if (expenseNode) {
      expenseNode.textContent = window.ET.logic.formatCurrency(getCurrencyValue(monthSummary.expensePaise));
    }

    if (balanceNode) {
      balanceNode.textContent = window.ET.logic.formatCurrency(getCurrencyValue(monthSummary.balancePaise));
    }

    if (monthInput && monthValue) {
      monthInput.value = monthValue;
    }

    if (!chart) {
      return;
    }

    if (!Array.isArray(categoryBreakdown) || categoryBreakdown.length === 0) {
      chart.innerHTML = '<div class="chart-empty">No expenses this month</div>';
      chart.setAttribute('aria-label', `No expenses for ${monthValue || 'selected month'}`);
      return;
    }

    const maxValue = Math.max(...categoryBreakdown.map((item) => Number(item.amountPaise || 0)), 1);
    const totalSpent = categoryBreakdown.reduce((sum, item) => sum + Number(item.amountPaise || 0), 0);

    const chartItems = categoryBreakdown
      .map((item) => {
        const amount = Number(item.amountPaise || 0);
        const width = Math.max((amount / maxValue) * 100, 10);
        const percent = totalSpent === 0 ? 0 : (amount / totalSpent) * 100;
        return `
          <div class="chart-row">
            <div class="chart-row__meta">
              <span>${item.category}</span>
              <span>${window.ET.logic.formatCurrency(amount)}</span>
            </div>
            <div class="chart-track" aria-hidden="true">
              <div class="chart-bar" style="width: ${width}%"></div>
            </div>
            <div class="chart-row__percent">${percent.toFixed(0)}%</div>
          </div>
        `;
      })
      .join('');

    chart.innerHTML = chartItems;
    chart.setAttribute('aria-label', `Expense categories for ${monthValue || 'selected month'}: ${categoryBreakdown.map((item) => `${item.category} ${Math.round((Number(item.amountPaise || 0) / totalSpent) * 100)} percent`).join(', ')}`);
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
      const input = document.getElementById(field);

      if (node) {
        node.textContent = message || '';
      }

      if (input) {
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
      }
    });
  }

  function clearErrors() {
    const fields = ['amount', 'category', 'date', 'description'];
    fields.forEach((field) => {
      const node = document.getElementById(`${field}-error`);
      const input = document.getElementById(field);

      if (node) {
        node.textContent = '';
      }

      if (input) {
        input.setAttribute('aria-invalid', 'false');
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
