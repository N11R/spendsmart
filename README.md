# SpendSmart

**The Penny Pinchers (Team 11)** · TCSS 460: Client/Server Programming for Internet Applications

SpendSmart is an AI-powered budget tracker for college students. Users log expenses, set monthly budgets, and get warned before they overspend. Later phases add AI receipt scanning and spending insights.

This is the **Phase II prototype**. It demonstrates one full client–server interaction: a user adds an expense in React, the Express API validates and saves it, and the API returns the updated budget status for that category.

## Team

| Member | Responsibility |
|---|---|
| Mariam Hussein | Frontend and design (React) |
| Nasra Hussein | Backend, data, and AI (Node.js/Express) |

## Project structure

```
spendsmart/
├── frontend/        React app (Vite)
├── backend/         Express API
│   ├── server.js
│   └── .env.example
├── docs/            Phase II report
├── README.md
└── .gitignore
```

## Requirements

- Node.js 20.19 or later (required by Vite)
- npm

## Setup and running

Run the backend and the frontend in two separate terminals.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

The API runs at http://localhost:3001.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Environment variables

Copy `backend/.env.example` to `backend/.env`. The `.env` file is ignored by Git and must never be committed.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port for the API. Defaults to `3001`. |
| `API_KEY` | Not yet | Key for the AI receipt-scanning service, planned for Phase III. Stays on the backend only. |

## Testing the prototype

### In the browser

1. Start the backend and the frontend.
2. Add an expense, for example **DoorDash**, **24**, **Delivery**, and any date.
3. The app shows the saved expense and the Delivery budget status: **$132 of $150 used (88%)**, with a warning because more than 80% of the budget is used.
4. Submit the form with empty fields. The server rejects it and the app shows the error messages.

### From the terminal

With the backend running:

```bash
# Server check
curl http://localhost:3001/api/health

# List expenses
curl http://localhost:3001/api/expenses

# Add a valid expense
curl -X POST http://localhost:3001/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"merchant":"DoorDash","amount":24,"category":"Delivery","date":"2026-11-05"}'

# Add an invalid expense (returns 400 with error messages)
curl -X POST http://localhost:3001/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"merchant":"","amount":-5,"category":"Shoes"}'
```

## Implemented API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Confirms the server is running |
| GET | `/api/expenses` | Returns all expenses |
| POST | `/api/expenses` | Validates and adds an expense, then returns the category's budget status |

### `POST /api/expenses`

Request body:

```json
{
  "merchant": "DoorDash",
  "amount": 24,
  "category": "Delivery",
  "date": "2026-11-05"
}
```

`category` must be one of: Food, Groceries, Delivery, Transit, Rent, Other.

Success (`201 Created`):

```json
{
  "expense": { "id": 3, "merchant": "DoorDash", "amount": 24, "category": "Delivery", "date": "2026-11-05" },
  "budgetStatus": {
    "category": "Delivery",
    "spent": 132,
    "budget": 150,
    "remaining": 18,
    "percentUsed": 88,
    "warning": "You have used 88% of your Delivery budget."
  }
}
```

Validation error (`400 Bad Request`):

```json
{
  "errors": [
    "Merchant is required.",
    "Amount must be a positive number.",
    "Category must be one of: Food, Groceries, Delivery, Transit, Rent, Other.",
    "Date must be valid (YYYY-MM-DD)."
  ]
}
```

Invalid JSON also returns `400`, and unknown routes return `404`.

## Data

The prototype uses sample data stored in memory, so new expenses are cleared when the server restarts. MongoDB is planned for Phase III.

## Planned for Phase III

- MongoDB storage for users, expenses, budgets, and AI insights
- AI receipt scanning that fills in the store, date, total, and category
- Budget management, a spending dashboard, and AI tips
- Full create, read, update, and delete support for expenses and budgets
