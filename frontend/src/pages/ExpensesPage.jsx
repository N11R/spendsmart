import { useEffect, useState } from 'react'
import { getExpenses } from '../api.js'
import BudgetStatus from '../components/BudgetStatus.jsx'
import ExpenseForm from '../components/ExpenseForm.jsx'
import ExpenseList from '../components/ExpenseList.jsx'

function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [loadError, setLoadError] = useState('')
  // The server's latest response: { expense, budgetStatus }
  const [lastSaved, setLastSaved] = useState(null)

  useEffect(() => {
    getExpenses()
      .then(setExpenses)
      .catch(() => setLoadError('Could not load expenses. Make sure the API Gateway is running (npm start).'))
  }, [])

  function handleSaved(result) {
    setExpenses((current) => [...current, result.expense])
    setLastSaved(result)
    setLoadError('')
  }

  return (
    <>
      <h1 className="page-title">Expenses</h1>
      <div className="top-row">
        <ExpenseForm onSaved={handleSaved} />
        <BudgetStatus result={lastSaved} />
      </div>
      <ExpenseList expenses={expenses} error={loadError} title="All Expenses" />
    </>
  )
}

export default ExpensesPage