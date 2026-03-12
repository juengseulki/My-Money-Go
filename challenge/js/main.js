import {
  fetchInitialData,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteSelectedTransactions,
} from "./api.js";
import {
  debounce,
  extractFormValues,
  filterTransactions,
  getCategoryOptions,
  getTodayString,
  makeTransactionPayload,
  sortTransactions,
  getUniqueCategoryNames,
} from "./utils.js";
import { validateTransactionForm } from "./validation.js";
import {
  clearFormDraft,
  getFilterSettings,
  getFormDraft,
  saveFilterSettings,
  saveFormDraft,
  saveTheme,
  getTheme,
} from "./storage.js";
import { renderTransactionList } from "./render/list.js";
import {
  renderMonthlyStats,
  renderSummaryCards,
  renderExpenseAnalysis,
} from "./render/stats.js";
import {
  hideLoading,
  showLoading,
  showToast,
  showConfirmModal,
} from "./render/ui.js";

const elements = {
  form: document.getElementById("transaction-form"),
  id: document.getElementById("transaction-id"),
  type: document.getElementById("type"),
  date: document.getElementById("date"),
  category: document.getElementById("category"),
  amount: document.getElementById("amount"),
  description: document.getElementById("description"),
  submitBtn: document.getElementById("submit-btn"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),

  typeFilter: document.getElementById("type-filter"),
  categoryFilter: document.getElementById("category-filter"),
  sortKey: document.getElementById("sort-key"),
  sortOrder: document.getElementById("sort-order"),
  searchInput: document.getElementById("search-input"),

  transactionList: document.getElementById("transaction-list"),
  summaryCards: document.getElementById("summary-cards"),
  monthlyStats: document.getElementById("monthly-stats"),
  expenseAnalysis: document.getElementById("expense-analysis"),

  deleteSelectedBtn: document.getElementById("delete-selected-btn"),
  selectAll: document.getElementById("select-all"),
  themeToggle: document.getElementById("theme-toggle"),
};

const state = {
  transactions: [],
  categories: [],
  filters: {
    type: "all",
    category: "all",
    search: "",
    sortKey: "date",
    sortOrder: "desc",
  },
  selectedIds: new Set(),
  editingId: null,
};

function initDefaultDate() {
  if (!elements.date.value) {
    elements.date.value = getTodayString();
  }
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  elements.themeToggle.textContent =
    theme === "dark" ? "☀️ 라이트모드" : "🌙 다크모드";
}

function initTheme() {
  const savedTheme = getTheme();
  applyTheme(savedTheme);
}

function populateCategorySelect(type) {
  const options = getCategoryOptions(state.categories, type);

  elements.category.innerHTML = options
    .map(
      (category) =>
        `<option value="${category.name}">${category.name}</option>`,
    )
    .join("");
}

function populateCategoryFilter() {
  const uniqueNames = getUniqueCategoryNames(state.categories);

  elements.categoryFilter.innerHTML = `
    <option value="all">전체</option>
    ${uniqueNames
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("")}
  `;
}

function applySavedFilterSettings() {
  const savedFilters = getFilterSettings();

  if (!savedFilters) return;

  state.filters = {
    ...state.filters,
    ...savedFilters,
  };

  elements.typeFilter.value = state.filters.type;
  elements.categoryFilter.value = state.filters.category;
  elements.sortKey.value = state.filters.sortKey;
  elements.sortOrder.value = state.filters.sortOrder;
  elements.searchInput.value = state.filters.search;
}

function saveCurrentFilterSettings() {
  saveFilterSettings(state.filters);
}

function restoreFormDraft() {
  const draft = getFormDraft();
  if (!draft) return;

  elements.type.value = draft.type || "expense";
  populateCategorySelect(elements.type.value);

  elements.date.value = draft.date || getTodayString();
  elements.category.value = draft.category || elements.category.value;
  elements.amount.value = draft.amount || "";
  elements.description.value = draft.description || "";
}

function saveCurrentFormDraft() {
  const draft = extractFormValues(elements);
  saveFormDraft(draft);
}

function resetForm() {
  state.editingId = null;
  elements.id.value = "";
  elements.form.reset();
  elements.type.value = "expense";
  initDefaultDate();
  populateCategorySelect(elements.type.value);
  elements.submitBtn.textContent = "기록하기";
  elements.cancelEditBtn.style.display = "none";
  clearFormDraft();
}

async function handleCancelEdit() {
  const hasInputValue =
    elements.date.value ||
    elements.amount.value ||
    elements.description.value ||
    state.editingId;

  if (!hasInputValue) {
    resetForm();
    return;
  }

  const isConfirmed = await showConfirmModal({
    title: "작성을 멈출까요?",
    message: state.editingId
      ? "수정 중인 내용이 사라집니다."
      : "적어두던 내용이 사라집니다.",
    confirmText: "그만 쓸래요",
    cancelText: "계속 쓸래요",
    icon: "✍️",
  });

  if (!isConfirmed) return;

  resetForm();
}

function fillFormForEdit(transaction) {
  state.editingId = transaction.id;
  elements.id.value = transaction.id;
  elements.type.value = transaction.type;
  populateCategorySelect(transaction.type);
  elements.date.value = transaction.date;
  elements.category.value = transaction.category;
  elements.amount.value = transaction.amount;
  elements.description.value = transaction.description;
  elements.submitBtn.textContent = "수정 저장";
  elements.cancelEditBtn.style.display = "inline-flex";
}

function getProcessedTransactions() {
  const filtered = filterTransactions(state.transactions, state.filters);
  return sortTransactions(
    filtered,
    state.filters.sortKey,
    state.filters.sortOrder,
  );
}

function renderApp() {
  const processedTransactions = getProcessedTransactions();

  renderTransactionList(processedTransactions, elements.transactionList, {
    onEdit: handleEditClick,
    onDelete: handleDeleteSingle,
    selectedIds: state.selectedIds,
  });

  renderSummaryCards(state.transactions, elements.summaryCards);
  renderMonthlyStats(state.transactions, elements.monthlyStats);
  renderExpenseAnalysis(state.transactions, elements.expenseAnalysis);

  syncRowCheckboxEvents();
  syncSelectAllState();
}

function syncRowCheckboxEvents() {
  const checkboxes = document.querySelectorAll(".row-checkbox");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const id = checkbox.dataset.id;

      if (checkbox.checked) {
        state.selectedIds.add(id);
      } else {
        state.selectedIds.delete(id);
      }

      syncSelectAllState();
    });
  });
}

function syncSelectAllState() {
  const visibleIds = getProcessedTransactions().map((item) => String(item.id));

  const isAllChecked =
    visibleIds.length > 0 &&
    visibleIds.every((id) => state.selectedIds.has(id));

  elements.selectAll.checked = isAllChecked;
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const formValues = extractFormValues(elements);
  const validation = validateTransactionForm(formValues);

  if (!validation.isValid) {
    showToast(validation.errors[0], "error");
    return;
  }

  const payload = makeTransactionPayload(formValues);

  showLoading();

  try {
    if (state.editingId) {
      const updated = await updateTransaction(state.editingId, payload);

      state.transactions = state.transactions.map((transaction) =>
        String(transaction.id) === String(state.editingId)
          ? updated
          : transaction,
      );

      showToast("기록을 수정했어요.", "success");
    } else {
      const created = await createTransaction(payload);
      state.transactions = [...state.transactions, created];
      showToast("새 기록을 남겼어요.", "success");
    }

    resetForm();
    renderApp();
  } catch (error) {
    showToast(`저장 중 오류가 발생했습니다. ${error.message}`, "error");
  } finally {
    hideLoading();
  }
}

function handleEditClick(id) {
  const target = state.transactions.find(
    (transaction) => String(transaction.id) === String(id),
  );

  if (!target) return;

  fillFormForEdit(target);
  saveCurrentFormDraft();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function handleDeleteSingle(id) {
  const target = state.transactions.find(
    (item) => String(item.id) === String(id),
  );

  const isConfirmed = await showConfirmModal({
    title: "이 기록을 지울까요?",
    message: target
      ? `${target.date} · ${target.category} · ${target.description}`
      : "돈의 흔적이 사라집니다.",
    confirmText: "지우기",
    cancelText: "남겨두기",
    icon: "🗑️",
  });

  if (!isConfirmed) return;

  showLoading();

  try {
    await deleteTransaction(id);

    state.transactions = state.transactions.filter(
      (item) => String(item.id) !== String(id),
    );

    state.selectedIds.delete(String(id));

    showToast("기록을 지웠어요.", "success");
    renderApp();
  } catch (error) {
    showToast(`삭제 중 오류가 발생했습니다. ${error.message}`, "error");
  } finally {
    hideLoading();
  }
}

async function handleDeleteSelected() {
  const ids = [...state.selectedIds];

  if (!ids.length) {
    showToast("지울 흔적을 먼저 선택해주세요.", "error");
    return;
  }

  const isConfirmed = await showConfirmModal({
    title: "선택한 흔적을 지울까요?",
    message: `선택한 ${ids.length}개의 기록이 사라집니다. 돈의 행방이 미궁으로 빠질 수 있어요.`,
    confirmText: "흔적 지우기",
    cancelText: "다시 보기",
    icon: "⚠️",
  });

  if (!isConfirmed) return;

  showLoading();

  try {
    await deleteSelectedTransactions(ids);

    state.transactions = state.transactions.filter(
      (item) => !ids.some((id) => String(item.id) === String(id)),
    );

    state.selectedIds.clear();
    showToast("선택한 흔적을 지웠어요.", "success");
    renderApp();
  } catch (error) {
    showToast(`선택 삭제 중 오류가 발생했습니다. ${error.message}`, "error");
  } finally {
    hideLoading();
  }
}

function handleTypeChange() {
  populateCategorySelect(elements.type.value);
  saveCurrentFormDraft();
}

function handleFilterChange() {
  state.filters.type = elements.typeFilter.value;
  state.filters.category = elements.categoryFilter.value;
  state.filters.sortKey = elements.sortKey.value;
  state.filters.sortOrder = elements.sortOrder.value;

  saveCurrentFilterSettings();
  renderApp();
}

const handleSearchInput = debounce((event) => {
  state.filters.search = event.target.value.trim();
  saveCurrentFilterSettings();
  renderApp();
}, 300);

function bindEvents() {
  elements.form.addEventListener("submit", handleFormSubmit);
  elements.cancelEditBtn.addEventListener("click", handleCancelEdit);
  elements.type.addEventListener("change", handleTypeChange);

  elements.typeFilter.addEventListener("change", handleFilterChange);
  elements.categoryFilter.addEventListener("change", handleFilterChange);
  elements.sortKey.addEventListener("change", handleFilterChange);
  elements.sortOrder.addEventListener("change", handleFilterChange);
  elements.searchInput.addEventListener("input", handleSearchInput);

  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    saveTheme(nextTheme);
  });

  [
    elements.type,
    elements.date,
    elements.category,
    elements.amount,
    elements.description,
  ].forEach((element) => {
    element.addEventListener("input", saveCurrentFormDraft);
    element.addEventListener("change", saveCurrentFormDraft);
  });

  elements.deleteSelectedBtn.addEventListener("click", handleDeleteSelected);

  elements.selectAll.addEventListener("change", () => {
    const visibleIds = getProcessedTransactions().map((item) =>
      String(item.id),
    );

    if (elements.selectAll.checked) {
      visibleIds.forEach((id) => state.selectedIds.add(id));
    } else {
      visibleIds.forEach((id) => state.selectedIds.delete(id));
    }

    renderApp();
  });
}

async function init() {
  showLoading();

  try {
    const { transactions, categories } = await fetchInitialData();

    state.transactions = transactions;
    state.categories = categories;

    populateCategorySelect(elements.type.value);
    populateCategoryFilter();
    initDefaultDate();
    applySavedFilterSettings();
    restoreFormDraft();
    initTheme();

    elements.cancelEditBtn.style.display = "none";

    bindEvents();
    renderApp();

    showToast("돈의 흐름을 불러왔어요.", "success");
  } catch (error) {
    showToast(`돈의 흐름 로딩에 실패했습니다. ${error.message}`, "error");
    elements.transactionList.innerHTML = `
      <tr>
        <td colspan="7" class="empty">데이터를 불러오지 못했습니다.</td>
      </tr>
    `;
  } finally {
    hideLoading();
  }
}

init();
