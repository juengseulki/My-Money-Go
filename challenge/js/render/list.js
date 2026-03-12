import { formatCurrency, getTypeLabel } from "../utils.js";

export function renderTransactionList(transactions, tbody, handlers) {
  const { onEdit, onDelete, selectedIds } = handlers;

  if (!transactions.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">아직 기록이 없어요. 돈이 어디로 갔는지 남겨볼까요?</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions
    .map(
      (transaction) => `
        <tr>
          <td class="col-check">
            <input
              type="checkbox"
              class="row-checkbox"
              data-id="${transaction.id}"
              ${selectedIds.has(String(transaction.id)) ? "checked" : ""}
            />
          </td>

          <td class="col-type">
            <span class="type-pill ${transaction.type}">
              ${getTypeLabel(transaction.type)}
            </span>
          </td>

          <td class="col-date">${transaction.date}</td>

          <td class="col-category">
            <span class="category-chip">${transaction.category}</span>
          </td>

          <td class="col-desc">
            <span class="desc-text ${transaction.type}">
              ${transaction.description}
            </span>
          </td>

          <td class="col-amount amount amount-cell ${transaction.type}">
            <span class="amount-text">
              ${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}
            </span>
          </td>

          <td class="col-actions">
            <div class="row-actions">
              <button class="action-btn edit" data-edit-id="${transaction.id}">
                수정
              </button>
              <button class="action-btn delete" data-delete-id="${transaction.id}">
                삭제
              </button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");

  tbody.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      onEdit(button.dataset.editId);
    });
  });

  tbody.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      onDelete(button.dataset.deleteId);
    });
  });
}
