// Every call to the backend goes through the API Gateway at /api.
// Vite forwards /api to the gateway (see vite.config.js).
const API_URL = '/api'

// Thrown when the gateway or the service behind it can't be reached
export class ServiceUnavailableError extends Error {}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, options)
  } catch {
    throw new ServiceUnavailableError('Could not reach the API Gateway.')
  }

  // 404: the route doesn't exist yet. 5xx: the gateway or the service behind it is down.
  if ([404, 500, 502, 503, 504].includes(response.status)) {
    throw new ServiceUnavailableError(`Service not available (${response.status}).`)
  }

  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

// GET /api/health
export async function getHealth() {
  const { data } = await request('/health')
  return data
}

// GET /api/expenses -> { expenses: [...] }
export async function getExpenses() {
  const { ok, data } = await request('/expenses')
  if (!ok) throw new Error('Could not load expenses.')
  return data.expenses
}

// POST /api/expenses -> 201 { expense, budgetStatus } or 400 { errors: [...] }
export async function addExpense(expense) {
  const { ok, data } = await request('/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  })
  return { ok, data }
}

// GET /api/budgets -> { budgets: [{ category, budget, spent, remaining, percentUsed, warning }] }
export async function getBudgets() {
  const { ok, data } = await request('/budgets')
  if (!ok) throw new Error('Could not load budgets.')
  return data.budgets
}

// POST /api/ai/receipt (multipart, field "receipt")
// -> { merchant, amount, date, category } with null for anything the AI couldn't read
export async function scanReceipt(file) {
  const body = new FormData()
  body.append('receipt', file)
  const { ok, data } = await request('/ai/receipt', { method: 'POST', body })
  if (!ok) throw new Error(data.error || 'The AI could not read this receipt.')
  return data
}