import { barClass, money } from '../constants.js'

// One labeled budget bar, used on the Dashboard and Budgets pages
function BudgetBar({ status, compact = false }) {
  const { category, spent, budget, percentUsed } = status
  return (
    <div className="budget-row">
      <div className="budget-row-label">
        <span>{category}</span>
        {!compact && (
          <span className="muted">
            {money(spent)} of {money(budget)} ({percentUsed}%)
          </span>
        )}
      </div>
      <div className="bar-track">
        <div
          className={`bar-fill ${barClass(percentUsed)}`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default BudgetBar