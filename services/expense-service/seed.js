// Seed script: clears the expenses database and adds sample expenses.
// Run with: npm run seed (from the project root, or inside this folder)
const db = require('./db');

// Dates relative to today, so the sample data always looks recent
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const SAMPLE = [
  { merchant: 'Safeway', amount: 41.27, category: 'Groceries', daysAgo: 12 },
  { merchant: 'Rent', amount: 850.0, category: 'Rent', daysAgo: 11 },
  { merchant: 'Chipotle', amount: 13.5, category: 'Food', daysAgo: 9 },
  { merchant: 'DoorDash', amount: 32.4, category: 'Delivery', daysAgo: 8 },
  { merchant: 'ORCA Card', amount: 25.0, category: 'Transit', daysAgo: 7 },
  { merchant: 'Starbucks', amount: 6.75, category: 'Food', daysAgo: 5 },
  { merchant: 'Uber Eats', amount: 41.6, category: 'Delivery', daysAgo: 4 },
  { merchant: 'Trader Joe\'s', amount: 38.92, category: 'Groceries', daysAgo: 3 },
  { merchant: 'DoorDash', amount: 34.0, category: 'Delivery', daysAgo: 1 },
];

async function seed() {
  await db.connect();
  await db.expenses().deleteMany({});

  const docs = SAMPLE.map((e, i) => ({
    id: i + 1,
    merchant: e.merchant,
    amount: e.amount,
    category: e.category,
    date: daysAgo(e.daysAgo),
    createdAt: new Date().toISOString(),
  }));
  await db.expenses().insertMany(docs);

  // The next new expense gets the next id
  const counters = (await db.connect()).collection('counters');
  await counters.updateOne({ _id: 'expenseId' }, { $set: { seq: docs.length } }, { upsert: true });

  console.log(`Seeded ${docs.length} expenses into ${db.DB_NAME}.`);
}

seed()
  .catch((err) => {
    console.error(`Seeding failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.close());
