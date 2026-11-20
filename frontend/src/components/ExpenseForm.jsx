import { useState } from 'react'
import { Link } from 'react-router'
import { addExpense } from '../api.js'
import { CATEGORIES } from '../constants.js'

const EMPTY_FORM = { merchant: '', amount: '', category: '', date: '' }

function ExpenseForm({ onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState([])
  const [saving, setSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setErrors([])

    try {
      const { ok, data } = await addExpense(form)
      if (ok) {
        setForm(EMPTY_FORM)
        onSaved(data)
      } else {
        // Validation errors come back as a list, other errors as one message
        setErrors(data.errors || [data.error])
      }
    } catch {
      setErrors(['Could not reach the server. Make sure the API Gateway is running (npm start).'])
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card">
      <h2>Add Expense</h2>

      <Link to="/expenses/receipt" className="receipt-placeholder">
        <strong>Scan a receipt</strong>
        <span>The AI fills in the fields for you to check</span>
      </Link>

      {/* noValidate: the Express backend checks the fields and sends back the errors */}
      <form onSubmit={handleSubmit} noValidate>
        <label>
          Merchant
          <input
            name="merchant"
            type="text"
            placeholder="DoorDash"
            value={form.merchant}
            onChange={handleChange}
          />
        </label>

        <div className="field-row">
          <label>
            Amount ($)
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="24.00"
              value={form.amount}
              onChange={handleChange}
            />
          </label>
          <label>
            Date
            <input name="date" type="date" value={form.date} onChange={handleChange} />
          </label>
        </div>

        <label>
          Category
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="">Choose a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        {errors.length > 0 && (
          <ul className="error-list" role="alert">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save expense'}
        </button>
      </form>
    </section>
  )
}

export default ExpenseForm