const { CATEGORIES } = require('../shared/categories');

// Checks an expense from the request body. Returns a list of problems.
function validateExpense({ merchant, amount, category, date } = {}) {
  const errors = [];

  if (typeof merchant !== 'string' || merchant.trim() === '') errors.push('Merchant is required.');
  const value = Number(amount);
  if (amount === '' || amount === null || !Number.isFinite(value) || value <= 0) {
    errors.push('Amount must be a positive number.');
  }
  if (!CATEGORIES.includes(category)) errors.push(`Category must be one of: ${CATEGORIES.join(', ')}.`);
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    errors.push('Date must be valid (YYYY-MM-DD).');
  }

  return errors;
}

// The cleaned-up version of the fields that get saved
function cleanExpense({ merchant, amount, category, date }) {
  return {
    merchant: merchant.trim(),
    amount: Math.round(Number(amount) * 100) / 100,
    category,
    date,
  };
}

module.exports = { validateExpense, cleanExpense };
