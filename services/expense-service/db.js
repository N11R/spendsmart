// Connects the Expense Service to its own MongoDB database
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });
const { MongoClient } = require('mongodb');

const DB_NAME = process.env.EXPENSE_DB_NAME || 'spendsmart_expenses';
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

function expenses() {
  return db.collection('expenses');
}

// Gives each new expense the next number: 1, 2, 3, ...
async function nextExpenseId() {
  const counter = await db
    .collection('counters')
    .findOneAndUpdate({ _id: 'expenseId' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  return counter.seq;
}

async function close() {
  if (client) await client.close();
}

module.exports = { connect, expenses, nextExpenseId, close, DB_NAME };
