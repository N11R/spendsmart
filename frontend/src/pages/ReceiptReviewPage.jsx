import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { addExpense, getBudgets, scanReceipt, ServiceUnavailableError } from '../api.js'
import BudgetStatus from '../components/BudgetStatus.jsx'
import ServiceNotice from '../components/ServiceNotice.jsx'
import { barClass, CATEGORIES, money } from '../constants.js'

const EMPTY_FORM = { merchant: '', amount: '', date: '', category: '' }

// Small tag next to each field label: what the AI did with that field
function AiTag({ source }) {
  if (source === 'filled') return <span className="ai-tag">AI filled</span>
  if (source === 'suggested') return <span className="ai-tag">AI suggested</span>
  if (source === 'missing') return <span className="ai-tag missing">Could not read</span>
  return null
}

function ReceiptReviewPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [aiDown, setAiDown] = useState(false)
  // For each field: 'filled', 'suggested', 'missing', or undefined (typed by the user)
  const [sources, setSources] = useState({})
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)
  const [budgets, setBudgets] = useState(null)

  // Budgets are optional here: they power the "after saving" preview
  useEffect(() => {
    getBudgets()
      .then(setBudgets)
      .catch(() => setBudgets(null))
  }, [])

  // Free the preview image's memory when it changes or the page closes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleFile(event) {
    const chosen = event.target.files[0]
    if (!chosen) return
    setFile(chosen)
    setPreviewUrl(URL.createObjectURL(chosen))
    setScanError('')
    setSources({})
    setSaved(null)
  }

  async function handleScan() {
    setScanning(true)
    setScanError('')
    setAiDown(false)
    try {
      const result = await scanReceipt(file)
      const next = {}
      const nextSources = {}
      for (const field of ['merchant', 'amount', 'date', 'category']) {
        const value = result[field]
        const found = value !== null && value !== undefined && value !== ''
        next[field] = found ? String(value) : ''
        if (field === 'category') nextSources[field] = found ? 'suggested' : 'missing'
        else nextSources[field] = found ? 'filled' : 'missing'
      }
      setForm(next)
      setSources(nextSources)
    } catch (error) {
      if (error instanceof ServiceUnavailableError) setAiDown(true)
      else setScanError(error.message)
    } finally {
      setScanning(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    // Once the user edits a field, it's theirs, not the AI's
    setSources((current) => ({ ...current, [name]: undefined }))
  }

  function startOver() {
    setFile(null)
    setPreviewUrl('')
    setForm(EMPTY_FORM)
    setSources({})
    setErrors([])
    setScanError('')
    setAiDown(false)
    setSaved(null)
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setErrors([])
    try {
      const { ok, data } = await addExpense(form)
      if (ok) {
        setSaved(data)
        getBudgets().then(setBudgets).catch(() => setBudgets(null))
      } else {
        setErrors(data.errors || [data.error])
      }
    } catch {
      setErrors(['Could not reach the server. Make sure the API Gateway is running (npm start).'])
    } finally {
      setSaving(false)
    }
  }

  // "After saving" preview, when the Budget Service is available
  let preview = null
  const amount = Number(form.amount)
  const categoryBudget = budgets?.find((b) => b.category === form.category)
  if (categoryBudget && amount > 0) {
    const after = categoryBudget.spent + amount
    const percent = Math.round((after / categoryBudget.budget) * 100)
    preview = { category: form.category, after, budget: categoryBudget.budget, percent }
  }

  if (saved) {
    return (
      <>
        <h1 className="page-title">Receipt saved</h1>
        <div className="top-row">
          <BudgetStatus result={saved} />
          <section className="card">
            <h2>What next?</h2>
            <div className="button-row">
              <button type="button" onClick={startOver}>
                Scan another receipt
              </button>
              <Link to="/" className="button-link secondary">
                Back to dashboard
              </Link>
            </div>
          </section>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-heading">
        <h1 className="page-title">Review Receipt</h1>
        <span className="muted">Check what the AI found and fix anything before saving.</span>
      </div>

      <div className="receipt-layout">
        <section className="card">
          <h2>Uploaded receipt</h2>
          <label className="receipt-drop">
            {previewUrl ? (
              <img src={previewUrl} alt="Receipt you uploaded" />
            ) : (
              <span>
                <strong>Choose a receipt photo</strong>
                <br />
                JPG or PNG
              </span>
            )}
            <input type="file" accept="image/*" onChange={handleFile} className="visually-hidden" />
          </label>
          {file && (
            <button type="button" onClick={handleScan} disabled={scanning} className="full-width">
              {scanning ? 'Reading receipt...' : 'Scan with AI'}
            </button>
          )}
          {aiDown && (
            <ServiceNotice service="The AI Agent Service">You can still type the details in yourself.</ServiceNotice>
          )}
          {scanError && <p className="load-error">{scanError}</p>}
        </section>

        <section className="card">
          <form onSubmit={handleSave} noValidate>
            <label>
              <span className="label-row">
                Store <AiTag source={sources.merchant} />
              </span>
              <input name="merchant" type="text" value={form.merchant} onChange={handleChange} />
            </label>

            <div className="field-row">
              <label>
                <span className="label-row">
                  Total ($) <AiTag source={sources.amount} />
                </span>
                <input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} />
              </label>
              <label>
                <span className="label-row">
                  Date <AiTag source={sources.date} />
                </span>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className={sources.date === 'missing' ? 'needs-input' : ''}
                />
              </label>
            </div>

            <label>
              <span className="label-row">
                Category <AiTag source={sources.category} />
              </span>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="">Choose a category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            {preview && (
              <div className="warning">
                <strong>After saving:</strong> {preview.category} would be at {money(preview.after)} of{' '}
                {money(preview.budget)} ({preview.percent}%)
                <div className="bar-track">
                  <div
                    className={`bar-fill ${barClass(preview.percent)}`}
                    style={{ width: `${Math.min(preview.percent, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <ul className="error-list" role="alert">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}

            <div className="button-row right">
              <button type="button" className="secondary" onClick={() => navigate('/expenses')}>
                Cancel
              </button>
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save expense'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  )
}

export default ReceiptReviewPage