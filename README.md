# SpendSmart

**The Penny Pinchers (Team 11)** · TCSS 460: Client/Server Programming for Internet Applications

SpendSmart is an AI-powered budget tracker for college students. Users log expenses or scan a receipt, set category budgets, and get warned before they overspend.

## Team

| Member | Responsibility |
|---|---|
| Mariam Hussein | Frontend and design (React) |
| Nasra Hussein | Backend services, data, and AI (Node.js/Express, MongoDB, Groq) |

**Roles (Sprint 1):** Team Leader: Nasra Hussein · Scrum Master: Mariam Hussein

**Communication:** We use Discord for daily updates and questions, and GitHub Issues for the sprint backlog.

## Architecture

The React frontend talks only to the **API Gateway**. The gateway forwards each request to the service that owns it. Each data service has its own MongoDB database.

| Service | Port | Folder | Responsibility |
|---|---|---|---|
| Frontend (React + Vite) | 5173 | `frontend/` | Pages, forms, receipt review. Calls only `/api` |
| API Gateway | 4000 | `gateway/` | Single entry point. Routes `/api/*` to the services, health check |
| Expense Service | 4001 | `services/expense-service/` | Expenses CRUD, database `spendsmart_expenses`, seed script |
| Budget Service | 4002 | `services/budget-service/` | Category budgets and the 80% warning, database `spendsmart_budgets`, seed script |
| AI Agent Service | 4003 | `services/ai-service/` | Groq calls: receipt reading and quick expense text |

```
Browser → React (5173) → API Gateway (4000) ─┬→ Expense Service (4001) → MongoDB: spendsmart_expenses
                                             ├→ Budget Service (4002)  → MongoDB: spendsmart_budgets
                                             └→ AI Agent Service (4003) → Groq API
```

## External API: Groq

The AI Agent Service uses the **Groq API** (model `qwen/qwen3.8-27b`, which reads both text and images).

- **Sent to Groq:** a receipt photo (base64) or short expense text, plus instructions to answer in JSON with our categories.
- **Received:** `{ merchant, amount, date, category }`, with `null` for anything it couldn't read. The user checks the fields before saving.
- **Key handling:** `GROQ_API_KEY` lives only in `.env` on the backend. Only the AI Agent Service calls Groq, so the key never reaches the browser or GitHub.

## AI agent tools (planned for Sprint 2)

These are the tools the AI agent will be able to call on its own, so it can do more than answer text prompts.

| Tool | What it does | Calls |
|---|---|---|
| `getBudgetStatus(category)` | How much of a category budget is used | Budget Service `GET /budgets/:category` |
| `getSpendingByCategory()` | Total spent in every category | Expense Service `GET /expenses/totals` |
| `getRecentExpenses(limit)` | The latest expenses, to spot patterns | Expense Service `GET /expenses` |
| `compareToLastMonth(category)` | Whether spending in a category went up | Expense Service (new, Sprint 2) |
| `createInsight(type, message)` | Saves a warning or tip for the dashboard | Insights (new, Sprint 2) |

**Example:** A user saves a $24 DoorDash expense. The agent calls `getBudgetStatus("Delivery")` and sees 88% used, then `compareToLastMonth("Delivery")` and sees it doubled, then `createInsight("warning", "...")` with a tip to cook at home this week.

## Requirements

- Node.js 20.19 or later
- A MongoDB Atlas cluster (free tier is fine)
- A Groq API key from https://console.groq.com/keys

## Setup

From the project root:

```bash
npm run install-all       # installs every package
cp .env.example .env      # then add your MongoDB URI and Groq key to .env
npm run seed              # fills both databases with sample data
npm run test-groq         # optional: checks that the Groq key works
npm start                 # starts the gateway, all services, and the frontend
```

Open http://localhost:5173.

### Environment variables (`.env` in the project root)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string. Each service uses its own database on it |
| `GROQ_API_KEY` | Yes | Groq API key. Used only by the AI Agent Service, never sent to the frontend |
| `GROQ_MODEL` | No | Groq model that accepts images. Defaults to `qwen/qwen3.8-27b` |

`.env` is ignored by Git and must never be committed.

## API (through the gateway at http://localhost:4000)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Gateway status and whether each service is up |
| GET | `/api/expenses` | All expenses, newest first |
| GET | `/api/expenses/:id` | One expense |
| POST | `/api/expenses` | Add an expense. Returns `{ expense, budgetStatus }` |
| PUT | `/api/expenses/:id` | Edit an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/expenses/totals` | Total spent per category |
| GET | `/api/budgets` | Every budget with spent, remaining, percent used, and warning |
| GET | `/api/budgets/:category` | One budget's status |
| PUT | `/api/budgets/:category` | Set or change a budget, body `{ "budget": 200 }` |
| GET | `/api/ai/test` | Simple Groq call to check the AI connection |
| POST | `/api/ai/receipt` | Read a receipt photo (multipart field `receipt`). Returns `{ merchant, amount, date, category }`, with `null` for anything it couldn't read |
| POST | `/api/ai/parse-text` | Read quick text like `{ "text": "chipotle 13.50" }` into the same fields |

Invalid input returns `400` with an `errors` list, unknown routes return `404`, and a service that isn't running returns `503` from the gateway.

## Testing from the terminal

With `npm start` running:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/budgets
curl http://localhost:4000/api/ai/test

curl -X POST http://localhost:4000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"merchant":"DoorDash","amount":24,"category":"Delivery","date":"2026-11-19"}'

curl -X POST http://localhost:4000/api/ai/parse-text \
  -H "Content-Type: application/json" \
  -d '{"text":"chipotle 13.50"}'

curl -X POST http://localhost:4000/api/ai/receipt -F "receipt=@receipt.jpg"
```

## Troubleshooting

- **A page says a service is "not connected":** Check the terminal running `npm start` for an error from that service. Most often `.env` is missing or `MONGODB_URI` is wrong.
- **"Address already in use":** An old server is still running. Close old terminal tabs, then run `npm start` again.
- **MongoDB connection fails:** In Atlas, check the username and password in the URI and add your IP under Network Access.
- **Groq errors:** Run `npm run test-groq`. A 401 means the key is wrong, and a 429 means the free-tier limit was hit.
