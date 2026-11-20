// Budget Service (port 4002)
// Owns the budgets data. Works out how much of each budget is used by
// asking the Expense Service for spending totals.
const express = require('express');
const db = require('./db');
const { CATEGORIES } = require('../shared/categories');

const app = express();
const PORT = process.env.BUDGET_PORT || 4002;
const EXPENSE_SERVICE_URL = process.env.EXPENSE_SERVICE_URL || 'http://localhost:4001';
const WARNING_PERCENT = 80;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'budget-service' });
});

// Total spent per category, from the Expense Service
async function getSpendingTotals() {
  const response = await fetch(`${EXPENSE_SERVICE_URL}/expenses/totals`, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error('Expense Service returned an error.');
  return (await response.json()).totals;
}

// Turns a budget and the amount spent into the status the frontend shows
function buildStatus(category, budget, spent) {
  const percentUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  let warning = null;
  if (percentUsed >= 100) warning = `You are over your ${category} budget.`;
  else if (percentUsed >= WARNING_PERCENT) warning = `You have used ${percentUsed}% of your ${category} budget.`;

  return {
    category,
    budget,
    spent: Math.round(spent * 100) / 100,
    remaining: Math.round((budget - spent) * 100) / 100,
    percentUsed,
    warning,
  };
}

// GET /budgets: every budget with how much is used
app.get('/budgets', async (req, res) => {
  let totals;
  try {
    totals = await getSpendingTotals();
  } catch {
    return res.status(503).json({ error: 'Could not get spending totals from the Expense Service.' });
  }

  const list = await db.budgets().find().toArray();
  list.sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category));
  res.json({ budgets: list.map((b) => buildStatus(b.category, b.budget, totals[b.category] || 0)) });
});

// GET /budgets/:category: one budget's status
app.get('/budgets/:category', async (req, res) => {
  const { category } = req.params;
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: `Category must be one of: ${CATEGORIES.join(', ')}.` });

  const saved = await db.budgets().findOne({ category });
  if (!saved) return res.status(404).json({ error: `No budget set for ${category}.` });

  let totals;
  try {
    totals = await getSpendingTotals();
  } catch {
    return res.status(503).json({ error: 'Could not get spending totals from the Expense Service.' });
  }
  res.json({ budgetStatus: buildStatus(category, saved.budget, totals[category] || 0) });
});

// PUT /budgets/:category  { "budget": 200 }: set or change a category budget
app.put('/budgets/:category', async (req, res) => {
  const { category } = req.params;
  const amount = Number(req.body?.budget);
  const errors = [];
  if (!CATEGORIES.includes(category)) errors.push(`Category must be one of: ${CATEGORIES.join(', ')}.`);
  if (req.body?.budget === '' || !Number.isFinite(amount) || amount <= 0) errors.push('Budget must be a positive number.');
  if (errors.length > 0) return res.status(400).json({ errors });

  const budget = Math.round(amount * 100) / 100;
  await db.budgets().updateOne({ category }, { $set: { category, budget } }, { upsert: true });

  let totals = {};
  try {
    totals = await getSpendingTotals();
  } catch {
    // Still saved; show it with nothing spent
  }
  res.json({ budgetStatus: buildStatus(category, budget, totals[category] || 0) });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong in the Budget Service.' });
});

db.connect()
  .then(async () => {
    await db.budgets().createIndex({ category: 1 }, { unique: true });
    app.listen(PORT, () => {
      console.log(`Budget Service running on http://localhost:${PORT} (database: ${db.DB_NAME})`);
    });
  })
  .catch((err) => {
    console.error(`Budget Service could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  });
