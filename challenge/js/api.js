const BASE_URL = "http://localhost:4000";

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`요청 실패: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function fetchInitialData() {
  const [transactions, categories] = await Promise.all([
    request(`${BASE_URL}/transactions`),
    request(`${BASE_URL}/categories`),
  ]);

  return { transactions, categories };
}

export async function createTransaction(data) {
  return request(`${BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(id, data) {
  return request(`${BASE_URL}/transactions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id) {
  return request(`${BASE_URL}/transactions/${id}`, {
    method: "DELETE",
  });
}

export async function deleteSelectedTransactions(ids) {
  const deleteRequests = ids.map((id) => deleteTransaction(id));
  await Promise.all(deleteRequests);
}
