function ExpenseList({ expenses, error }) {
  // Newest expense first
  const newestFirst = [...expenses].reverse()

  return (
    <section className="card">
      <h2>Recent Expenses</h2>

      {error && <p className="load-error">{error}</p>}
      {!error && expenses.length === 0 && <p className="muted">No expenses yet.</p>}

      {expenses.length > 0 && (
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
            {newestFirst.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.date}</td>
                <td>{expense.merchant}</td>
                <td>{expense.category}</td>
                <td className="amount">${expense.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default ExpenseList
