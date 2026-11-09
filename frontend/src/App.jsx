import { useEffect, useState } from 'react'
import { getExpenses } from './api.js'
import BudgetStatus from './components/BudgetStatus.jsx'
import ExpenseForm from './components/ExpenseForm.jsx'
import ExpenseList from './components/ExpenseList.jsx'
import './App.css'

function App() {
  const [expenses, setExpenses] = useState([])
  const [loadError, setLoadError] = useState('')
  // The server's latest response: { expense, budgetStatus }
  const [lastSaved, setLastSaved] = useState(null)

  // Load the existing expenses when the page opens
  useEffect(() => {
    getExpenses()
      .then((data) => setExpenses(data))
      .catch(() =>
        setLoadError('Could not reach the server. Make sure the backend is running on port 3001.'),
      )
  }, [])

  function handleSaved(result) {
    setExpenses((current) => [...current, result.expense])
    setLastSaved(result)
    setLoadError('')
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="brand">$ SpendSmart</span>
        <span className="header-note">Phase II prototype</span>
      </header>

      <main className="content">
        <div className="top-row">
          <ExpenseForm onSaved={handleSaved} />
          <BudgetStatus result={lastSaved} />
        </div>
        <ExpenseList expenses={expenses} error={loadError} />
      </main>
    </div>
  )
}

export default App
