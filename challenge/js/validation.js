const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateTransactionForm(values) {
  const errors = [];

  const { type, date, category, description, amount } = values;

  if (!type) {
    errors.push("타입을 선택해주세요.");
  }

  if (!date) {
    errors.push("날짜를 입력해주세요.");
  } else if (!DATE_REGEX.test(date)) {
    errors.push("날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)");
  }

  if (!category) {
    errors.push("카테고리를 선택해주세요.");
  }

  if (!description.trim()) {
    errors.push("설명을 입력해주세요.");
  }

  if (!amount) {
    errors.push("금액을 입력해주세요.");
  } else if (Number(amount) <= 0) {
    errors.push("금액은 0보다 큰 양수여야 합니다.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
