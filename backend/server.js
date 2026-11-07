const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Sample data (a database comes in Phase III)
const CATEGORIES = ['Food', 'Groceries', 'Delivery', 'Transit', 'Rent', 'Other'];
const budgets = { Food: 200, Groceries: 150, Delivery: 150, Transit: 60, Rent: 900, Other: 100 };
const expenses = [
  { id: 1, merchant: 'Safeway', amount: 41.27, category: 'Groceries', date: '2026-10-16' },
  { id: 2, merchant: 'DoorDash', amount: 108.0, category: 'Delivery', date: '2026-10-17' },
];
let nextId = 3;

// Works out how much of a category's budget has been used
function getBudgetStatus(category) {
  const spent = expenses
    .filter((e) => e.category === category)
    .reduce((sum, e) => sum + e.amount, 0);
  const budget = budgets[category];
  const percentUsed = Math.round((spent / budget) * 100);

  let warning = null;
  if (percentUsed >= 100) warning = `You are over your ${category} budget.`;
  else if (percentUsed >= 80) warning = `You have used ${percentUsed}% of your ${category} budget.`;

  return {
    category,
    spent: Number(spent.toFixed(2)),
    budget,
    remaining: Number((budget - spent).toFixed(2)),
    percentUsed,
    warning,
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/expenses', (req, res) => {
  res.json({ expenses });
});

app.post('/api/expenses', (req, res) => {
  const { merchant, amount, category, date } = req.body || {};
  const errors = [];

  if (typeof merchant !== 'string' || merchant.trim() === '') errors.push('Merchant is required.');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) errors.push('Amount must be a positive number.');
  if (!CATEGORIES.includes(category)) errors.push(`Category must be one of: ${CATEGORIES.join(', ')}.`);
  if (!date || Number.isNaN(Date.parse(date))) errors.push('Date must be valid (YYYY-MM-DD).');

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const expense = {
    id: nextId++,
    merchant: merchant.trim(),
    amount: Number(value.toFixed(2)),
    category,
    date,
  };
  expenses.push(expense);

  res.status(201).json({ expense, budgetStatus: getBudgetStatus(category) });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Bad JSON and unexpected errors
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`SpendSmart API running on http://localhost:${PORT}`);
});