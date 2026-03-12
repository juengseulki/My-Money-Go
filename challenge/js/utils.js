export function formatCurrency(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getTypeLabel(type) {
  return type === "income" ? "수입" : "지출";
}

export function filterTransactions(transactions, filters) {
  const { type, category, search } = filters;

  return transactions.filter((transaction) => {
    const matchType = type === "all" || transaction.type === type;
    const matchCategory =
      category === "all" || transaction.category === category;
    const matchSearch =
      !search ||
      transaction.description.toLowerCase().includes(search.toLowerCase());

    return matchType && matchCategory && matchSearch;
  });
}

export function sortTransactions(transactions, sortKey, sortOrder) {
  const copied = [...transactions];

  copied.sort((a, b) => {
    let compareValue = 0;

    if (sortKey === "amount") {
      compareValue = a.amount - b.amount;
    }

    if (sortKey === "date") {
      compareValue = new Date(a.date) - new Date(b.date);
    }

    return sortOrder === "asc" ? compareValue : -compareValue;
  });

  return copied;
}

export function calculateSummary(transactions) {
  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpense = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export function groupTransactionsByMonth(transactions) {
  const monthMap = new Map();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        month: key,
        income: 0,
        expense: 0,
        balance: 0,
      });
    }

    const current = monthMap.get(key);

    if (transaction.type === "income") {
      current.income += transaction.amount;
    } else {
      current.expense += transaction.amount;
    }

    current.balance = current.income - current.expense;
  });

  return [...monthMap.values()].sort((a, b) => b.month.localeCompare(a.month));
}

export function getCategoryOptions(categories, selectedType) {
  return categories.filter((category) => category.type === selectedType);
}

export function getUniqueCategoryNames(categories) {
  return [...new Set(categories.map((category) => category.name))];
}

export function debounce(callback, delay = 300) {
  let timerId;

  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

export function getTodayString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export function makeTransactionPayload(formValues) {
  const { type, date, category, description, amount } = formValues;

  return {
    type,
    date,
    category,
    description: description.trim(),
    amount: Number(amount),
  };
}

export function extractFormValues(formElements) {
  const { type, date, category, description, amount } = formElements;

  return {
    type: type.value,
    date: date.value,
    category: category.value,
    description: description.value,
    amount: amount.value,
  };
}

export function getMonthlyStatEntries(monthlyStats) {
  return monthlyStats.map((item) => ({
    ...item,
    entries: Object.entries({
      수입: item.income,
      지출: item.expense,
      잔액: item.balance,
    }),
  }));
}

export function getExpenseCategoryAnalysis(transactions) {
  const expenseItems = transactions.filter((item) => item.type === "expense");

  const totalExpense = expenseItems.reduce((sum, item) => sum + item.amount, 0);

  const categoryMap = new Map();

  expenseItems.forEach((item) => {
    const current = categoryMap.get(item.category) || 0;
    categoryMap.set(item.category, current + item.amount);
  });

  return [...categoryMap.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percent: totalExpense ? Math.round((amount / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}
