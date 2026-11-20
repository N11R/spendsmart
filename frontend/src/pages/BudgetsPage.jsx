import { useEffect, useState } from 'react'
import { getBudgets } from '../api.js'
import BudgetBar from '../components/BudgetBar.jsx'
import ServiceNotice from '../components/ServiceNotice.jsx'

function BudgetsPage() {
  const [budgets, setBudgets] = useState(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    getBudgets()
      .then(setBudgets)
      .catch(() => setUnavailable(true))
  }, [])

  return (
    <>
      <h1 className="page-title">Budgets</h1>
      <section className="card">
        <h2>Monthly Budgets by Category</h2>
        {unavailable && (
          <ServiceNotice service="The Budget Service">
            This page reads GET /api/budgets through the gateway.
          </ServiceNotice>
        )}
        {!unavailable && !budgets && <p className="muted">Loading budgets...</p>}
        {budgets && (
          <div className="budget-list">
            {budgets.map((status) => (
              <div key={status.category}>
                <BudgetBar status={status} />
                {status.warning && <p className="warning small">{status.warning}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

export default BudgetsPage