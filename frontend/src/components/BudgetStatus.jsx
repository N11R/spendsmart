function BudgetStatus({ result }) {
  if (!result) {
    return (
      <section className="card">
        <h2>Budget Status</h2>
        <p className="muted">Save an expense to see how much of that category's budget is used.</p>
      </section>
    )
  }

  const { expense, budgetStatus } = result
  const { category, spent, budget, remaining, percentUsed, warning } = budgetStatus

  // The bar is green, orange at 80%, and red at 100%
  let barClass = 'bar-ok'
  if (percentUsed >= 100) barClass = 'bar-over'
  else if (percentUsed >= 80) barClass = 'bar-warn'

  return (
    <section className="card">
      <h2>Budget Status</h2>
      <p className="saved-note">
        Saved {expense.merchant} for ${expense.amount.toFixed(2)}
      </p>

      <h3>{category}</h3>
      <div className="bar-track">
        <div className={`bar-fill ${barClass}`} style={{ width: `${Math.min(percentUsed, 100)}%` }} />
      </div>
      <p className="budget-numbers">
        ${spent.toFixed(2)} of ${budget.toFixed(2)} used ({percentUsed}%)
      </p>
      <p className="muted">
        {remaining >= 0
          ? `$${remaining.toFixed(2)} remaining`
          : `$${Math.abs(remaining).toFixed(2)} over budget`}
      </p>

      {warning && (
        <p className="warning" role="status">
          {warning}
        </p>
      )}
    </section>
  )
}

export default BudgetStatus
