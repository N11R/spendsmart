// Connects the Budget Service to its own MongoDB database
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });
const { MongoClient } = require('mongodb');

const DB_NAME = process.env.BUDGET_DB_NAME || 'spendsmart_budgets';
let client;
let db;

async function connect() {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy .env.example to .env in the project root and add your connection string.');
  }
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

function budgets() {
  return db.collection('budgets');
}

async function close() {
  if (client) await client.close();
}

module.exports = { connect, budgets, close, DB_NAME };
