// Receipt reading: the prompt we send to Groq and how we clean up its answer
const { CATEGORIES } = require('../shared/categories');

const INSTRUCTIONS = `You read purchase receipts for a student budgeting app.
Return only a JSON object with exactly these keys:
- "merchant": the store or restaurant name, as a string
- "amount": the final total paid, as a number (no currency sign)
- "date": the purchase date as "YYYY-MM-DD"
- "category": one of ${CATEGORIES.map((c) => `"${c}"`).join(', ')}
Use "Delivery" for food delivery apps (DoorDash, Uber Eats, Grubhub), "Groceries" for grocery stores,
"Food" for restaurants and coffee shops, and "Transit" for buses, trains, rideshare, and transit cards.
If you can't read a field, use null for it. Do not guess.`;

// Makes sure every field is valid, or null, so the frontend can show "Could not read"
function cleanResult(raw = {}) {
  const merchant = typeof raw.merchant === 'string' && raw.merchant.trim() ? raw.merchant.trim() : null;

  const number = typeof raw.amount === 'string' ? Number(raw.amount.replace(/[$,]/g, '')) : Number(raw.amount);
  const amount = raw.amount !== null && Number.isFinite(number) && number > 0 ? Math.round(number * 100) / 100 : null;

  const date =
    typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) && !Number.isNaN(Date.parse(raw.date))
      ? raw.date
      : null;

  const category = CATEGORIES.includes(raw.category) ? raw.category : null;

  return { merchant, amount, date, category };
}

module.exports = { INSTRUCTIONS, cleanResult };
