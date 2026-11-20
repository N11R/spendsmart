// Seed script: clears the budgets database and adds a monthly budget for each category.
// Run with: npm run seed
const db = require('./db');

const SAMPLE = [
  { category: 'Food', budget: 200 },
  { category: 'Groceries', budget: 150 },
  { category: 'Delivery', budget: 150 },
  { category: 'Transit', budget: 60 },
  { category: 'Rent', budget: 900 },
  { category: 'Other', budget: 100 },
];

async function seed() {
  await db.connect();
  await db.budgets().deleteMany({});
  await db.budgets().insertMany(SAMPLE.map((b) => ({ ...b })));
  await db.budgets().createIndex({ category: 1 }, { unique: true });
  console.log(`Seeded ${SAMPLE.length} budgets into ${db.DB_NAME}.`);
}

seed()
  .catch((err) => {
    console.error(`Seeding failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.close());
