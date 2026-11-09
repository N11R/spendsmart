// All calls to the Express backend live here.
const API_URL = 'http://localhost:3001/api'

export async function getExpenses() {
  const response = await fetch(`${API_URL}/expenses`)
  if (!response.ok) {
    throw new Error('Could not load expenses.')
  }
  const data = await response.json()
  return data.expenses
}

// Returns { ok, data } so the form can show the server's validation errors.
export async function addExpense(expense) {
  const response = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  })
  const data = await response.json()
  return { ok: response.ok, data }
}
