import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getBudgets, getExpenses } from '../api.js'
import BudgetBar from '../components/BudgetBar.jsx'
import ExpenseList from '../components/ExpenseList.jsx'
import ServiceNotice from '../components/ServiceNotice.jsx'
import { CATEGORIES, money } from '../constants.js'

function DashboardPage() {
  const [expenses, setExpenses] = useState([])
  const [expenseError, setExpenseError] = useState('')
  const [budgets, setBudgets] = useState(null)
  const [budgetsDown, setBudgetsDown] = useState(false)

  useEffect(() => {
    getExpenses()
      .then(setExpenses)
      .catch(() => setExpenseError('Could not load expenses. Make sure the API Gateway is running (npm start).'))
    getBudgets()
      .then(setBudgets)
      .catch(() => setBudgetsDown(true))
  }, [])

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalBudget = budgets ? budgets.reduce((sum, b) => sum + b.budget, 0) : null
  const remaining = totalBudget === null ? null : totalBudget - totalSpent

  // Spending per category, for the bar chart
  const byCategory = CATEGORIES.map((category) => ({
    category,
    total: expenses.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0),
  }))
  const largest = Math.max(...byCategory.map((c) => c.total), 1)

  return (
    <>
      <div className="page-heading">
        <h1 className="page-title">Dashboard</h1>
        <Link to="/expenses/receipt" className="button-link">
          Scan a receipt
        </Link>
      </div>

      <div className="stat-row">
        <section className="card stat">
          <span className="muted">Total spent</span>
          <strong>{money(totalSpent)}</strong>
        </section>
        <section className="card stat">
          <span className="muted">Total budget</span>
          <strong>{totalBudget === null ? '--' : money(totalBudget)}</strong>
        </section>
        <section className="card stat">
          <span className="muted">Remaining</span>
          <strong className={remaining !== null && remaining < 0 ? 'negative' : 'positive'}>
            {remaining === null ? '--' : money(remaining)}
          </strong>
        </section>
      </div>

      <div className="top-row">
        <section className="card">
          <h2>Spending by Category</h2>
          <div className="category-chart" role="img" aria-label="Spending by category">
            {byCategory.map(({ category, total }) => (
              <div key={category} className="category-col">
                <span className="category-value">{total > 0 ? money(total) : ''}</span>
                <div className="category-bar" style={{ height: `${(total / largest) * 100}%` }} />
                <span className="category-label">{category}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Budgets</h2>
          {budgetsDown && <ServiceNotice service="The Budget Service">Budgets will show here once it is running.</ServiceNotice>}
          {budgets && budgets.length === 0 && <p className="muted">No budgets set yet.</p>}
          {budgets && (
            <div className="budget-list">
              {budgets.map((status) => (
                <BudgetBar key={status.category} status={status} compact />
              ))}
            </div>
          )}
          <Link to="/budgets" className="text-link">
            See all budgets
          </Link>
        </section>
      </div>

      <ExpenseList expenses={expenses} error={expenseError} limit={5} />
    </>
  )
}

export default DashboardPage