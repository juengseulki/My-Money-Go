import {
  calculateSummary,
  formatCurrency,
  getMonthlyStatEntries,
  groupTransactionsByMonth,
  getExpenseCategoryAnalysis,
} from "../utils.js";

export function renderSummaryCards(transactions, target) {
  const { totalIncome, totalExpense, balance } = calculateSummary(transactions);

  target.innerHTML = `
    <div class="summary-card income">
      <h3>들어온 돈</h3>
      <div class="value">${formatCurrency(totalIncome)}</div>
    </div>
    <div class="summary-card expense">
      <h3>나간 돈</h3>
      <div class="value">${formatCurrency(totalExpense)}</div>
    </div>
    <div class="summary-card balance">
      <h3>살아남은 돈</h3>
      <div class="value">${formatCurrency(balance)}</div>
    </div>
  `;
}

export function renderMonthlyStats(transactions, target) {
  const monthlyStats = groupTransactionsByMonth(transactions);
  const statEntries = getMonthlyStatEntries(monthlyStats);

  target.innerHTML = `
    <div class="section-title-wrap">
      <h2>이번 달 돈의 행방</h2>
      <p>돈이 어디로 갔는지 추적 중...</p>
    </div>
    <div class="monthly-list">
      ${
        statEntries.length
          ? statEntries
              .map(
                (item) => `
                  <div class="month-item">
                    <div class="month-item-top">
                      <span class="month-item-title">${item.month}</span>
                    </div>
                    <div class="month-values">
                      ${item.entries
                        .map(([label, value]) => {
                          const badgeClass =
                            label === "수입"
                              ? "income"
                              : label === "지출"
                                ? "expense"
                                : "balance";

                          return `
                            <span class="badge ${badgeClass}">
                              ${label}: ${formatCurrency(value)}
                            </span>
                          `;
                        })
                        .join("")}
                    </div>
                  </div>
                `,
              )
              .join("")
          : `<p class="empty">아직 추적할 돈의 기록이 없습니다.</p>`
      }
    </div>
  `;
}

export function renderExpenseAnalysis(transactions, target) {
  const analysis = getExpenseCategoryAnalysis(transactions);

  target.innerHTML = `
    <div class="section-title-wrap">
      <h2>범인은 이 안에 있어</h2>
      <p>가장 많이 나간 카테고리를 추적 중...</p>
    </div>

    <div class="analysis-list">
      ${
        analysis.length
          ? analysis
              .map(
                (item) => `
                  <div class="analysis-item">
                    <div class="analysis-top">
                      <span class="analysis-label">${item.category}</span>
                      <span class="analysis-value">${formatCurrency(item.amount)} · ${item.percent}%</span>
                    </div>
                    <div class="analysis-bar">
                      <div class="analysis-fill" style="width: ${item.percent}%"></div>
                    </div>
                  </div>
                `,
              )
              .join("")
          : `<p class="empty">아직 추적할 지출이 없어요.</p>`
      }
    </div>
  `;
}
