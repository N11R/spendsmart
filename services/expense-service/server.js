// Expense Service (port 4001)
// Owns the expenses data. Saves, loads, edits, and deletes expenses
// in its own MongoDB database (spendsmart_expenses).
const express = require('express');
const db = require('./db');
const { validateExpense, cleanExpense } = require('./validate');

const app = express();
const PORT = process.env.EXPENSE_PORT || 4001;
const BUDGET_SERVICE_URL = process.env.BUDGET_SERVICE_URL || 'http://localhost:4002';

app.use(express.json());

// Hide MongoDB's internal _id from responses
const NO_MONGO_ID = { projection: { _id: 0 } };

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'expense-service' });
});

// GET /expenses: all expenses, newest first
app.get('/expenses', async (req, res) => {
  const list = await db.expenses().find({}, NO_MONGO_ID).sort({ date: -1, id: -1 }).toArray();
  res.json({ expenses: list });
});

// GET /expenses/totals: total spent per category (used by the Budget Service)
// Defined before /expenses/:id so "totals" isn't read as an id.
app.get('/expenses/totals', async (req, res) => {
  const rows = await db
    .expenses()
    .aggregate([{ $group: { _id: '$category', total: { $sum: '$amount' } } }])
    .toArray();
  const totals = {};
  for (const row of rows) totals[row._id] = Math.round(row.total * 100) / 100;
  res.json({ totals });
});

// GET /expenses/:id: one expense
app.get('/expenses/:id', async (req, res) => {
  const expense = await db.expenses().findOne({ id: Number(req.params.id) }, NO_MONGO_ID);
  if (!expense) return res.status(404).json({ error: 'Expense not found.' });
  res.json({ expense });
});

// Asks the Budget Service how much of this category's budget is used now
async function getBudgetStatus(category) {
  try {
    const response = await fetch(`${BUDGET_SERVICE_URL}/budgets/${encodeURIComponent(category)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) return (await response.json()).budgetStatus;
  } catch {
    // Budget Service is down; fall through
  }
  // Still send something the frontend can display
  return { category, spent: 0, budget: 0, remaining: 0, percentUsed: 0, warning: 'Budget status is unavailable right now.' };
}

// POST /expenses: add an expense, then return its budget status
app.post('/expenses', async (req, res) => {
  const errors = validateExpense(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });

  const expense = { id: await db.nextExpenseId(), ...cleanExpense(req.body), createdAt: new Date().toISOString() };
  await db.expenses().insertOne({ ...expense });

  const budgetStatus = await getBudgetStatus(expense.category);
  res.status(201).json({ expense, budgetStatus });
});

// PUT /expenses/:id: edit an expense
app.put('/expenses/:id', async (req, res) => {
  const errors = validateExpense(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });

  const updated = await db
    .expenses()
    .findOneAndUpdate({ id: Number(req.params.id) }, { $set: cleanExpense(req.body) }, { returnDocument: 'after', ...NO_MONGO_ID });
  if (!updated) return res.status(404).json({ error: 'Expense not found.' });
  res.json({ expense: updated });
});

// DELETE /expenses/:id: remove an expense
app.delete('/expenses/:id', async (req, res) => {
  const result = await db.expenses().deleteOne({ id: Number(req.params.id) });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Expense not found.' });
  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Bad JSON and unexpected errors (Express 5 passes async errors here)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong in the Expense Service.' });
});

db.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Expense Service running on http://localhost:${PORT} (database: ${db.DB_NAME})`);
    });
  })
  .catch((err) => {
    console.error(`Expense Service could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  });
