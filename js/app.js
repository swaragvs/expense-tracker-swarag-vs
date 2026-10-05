(function () {
  const state = {
    transactions: [],
    editingId: null,
    filters: {
      type: 'all',
      category: 'all',
    },
  };

  function getVisibleTransactions() {
    const list = [...state.transactions];
    const type = state.filters.type;
    const category = state.filters.category;

    return ET.logic.sortByDateDesc(
      list.filter((transaction) => {
        const typeMatches = type === 'all' || transaction.type === type;
        const categoryMatches = category === 'all' || transaction.category === category;
        return typeMatches && categoryMatches;
      })
    );
  }

  function getDefaultDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function setCategoryOptions(type) {
    const categoryField = document.getElementById('category');
    if (!categoryField) {
      return;
    }

    const choices = {
      expense: ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'],
      income: ['Salary', 'Freelance', 'Other'],
    };

    const allowed = choices[type] || choices.expense;
    const current = categoryField.value;
    categoryField.innerHTML = allowed
      .map((option) => `<option value="${option}">${option}</option>`)
      .join('');
    categoryField.value = allowed.includes(current) ? current : allowed[0];
  }

  function resetForm() {
    const form = document.querySelector('.transaction-form');
    const primaryButton = document.querySelector('.primary-button');
    const cancelButton = document.querySelector('.secondary-button');

    if (!form) {
      return;
    }

    form.reset();
    state.editingId = null;

    const expenseInput = form.querySelector('input[name="type"][value="expense"]');
    if (expenseInput) {
      expenseInput.checked = true;
    }

    const dateField = form.querySelector('#date');
    if (dateField) {
      dateField.value = getDefaultDate();
    }

    setCategoryOptions('expense');

    if (primaryButton) {
      primaryButton.textContent = 'Add transaction';
    }

    if (cancelButton) {
      cancelButton.classList.add('hidden');
    }

    ET.ui.clearErrors();
  }

  function render() {
    const totals = ET.logic.calculateTotals(state.transactions);
    ET.ui.renderTotals(totals);
    ET.ui.renderList(getVisibleTransactions());

    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');

    if (filterType) {
      filterType.value = state.filters.type;
    }

    if (filterCategory) {
      filterCategory.value = state.filters.category;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = ET.ui.readForm(form);
    const validation = ET.logic.validateTransaction(payload);

    if (!validation.valid) {
      ET.ui.showErrors(validation.errors);
      const firstField = Object.keys(validation.errors).find((name) => validation.errors[name]);
      const element = firstField ? form.querySelector(`#${firstField}`) : null;
      if (element) {
        element.focus();
      }
      return;
    }

    if (state.editingId) {
      state.transactions = ET.logic.updateTransaction(state.transactions, state.editingId, payload);
    } else {
      state.transactions = [...state.transactions, ET.logic.createTransaction(payload)];
    }

    if (!ET.storage.save(state.transactions)) {
      ET.ui.toast('Storage blocked');
      return;
    }

    ET.ui.toast('Saved');
    resetForm();
    render();
  }

  function bindEvents() {
    const form = document.querySelector('.transaction-form');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }

    document.querySelectorAll('input[name="type"]').forEach((input) => {
      input.addEventListener('change', (event) => {
        setCategoryOptions(event.target.value);
      });
    });

    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');
    const clearButton = document.querySelector('.link-button');

    if (filterType) {
      filterType.addEventListener('change', (event) => {
        state.filters.type = event.target.value;
        render();
      });
    }

    if (filterCategory) {
      filterCategory.addEventListener('change', (event) => {
        state.filters.category = event.target.value;
        render();
      });
    }

    if (clearButton) {
      clearButton.addEventListener('click', () => {
        state.filters = { type: 'all', category: 'all' };
        render();
      });
    }

    document.getElementById('tx-list')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) {
        return;
      }

      const id = button.dataset.id;
      const action = button.dataset.action;

      if (action === 'edit') {
        const transaction = state.transactions.find((item) => item.id === id);
        if (transaction) {
          state.editingId = id;
          ET.ui.fillForm(transaction);
          const primaryButton = document.querySelector('.primary-button');
          const cancelButton = document.querySelector('.secondary-button');
          if (primaryButton) {
            primaryButton.textContent = 'Save changes';
          }
          if (cancelButton) {
            cancelButton.classList.remove('hidden');
          }
          document.querySelector('.transaction-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      if (action === 'delete') {
        const dialog = document.getElementById('confirm-dialog');
        if (dialog) {
          dialog.dataset.id = id;
          dialog.showModal();
        }
      }
    });

    const cancelButton = document.querySelector('.secondary-button');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        resetForm();
      });
    }

    const dialog = document.getElementById('confirm-dialog');
    if (dialog) {
      dialog.addEventListener('close', () => {
        const id = dialog.dataset.id;
        if (!id) {
          return;
        }

        if (dialog.returnValue === 'delete') {
          state.transactions = ET.logic.deleteTransaction(state.transactions, id);
          if (!ET.storage.save(state.transactions)) {
            ET.ui.toast('Storage blocked');
            return;
          }

          if (state.editingId === id) {
            resetForm();
          }

          ET.ui.toast('Deleted');
          render();
        }

        delete dialog.dataset.id;
      });
    }
  }

  function init() {
    state.transactions = ET.storage.load();
    bindEvents();
    resetForm();
    render();
  }

  window.ET = window.ET || {};
  window.ET.app = {
    state,
    render,
    resetForm,
    init,
  };

  document.addEventListener('DOMContentLoaded', init);
})();
