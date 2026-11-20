import { money } from '../constants.js'

function ExpenseList({ expenses, error, limit, title = 'Recent Expenses' }) {
  // Newest first, by date
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  const shown = limit ? sorted.slice(0, limit) : sorted

  return (
    <section className="card">
      <h2>{title}</h2>

      {error && <p className="load-error">{error}</p>}
      {!error && expenses.length === 0 && <p className="muted">No expenses yet.</p>}

      {shown.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.date}</td>
                <td>{expense.merchant}</td>
                <td>{expense.category}</td>
                <td className="amount">{money(expense.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default ExpenseList