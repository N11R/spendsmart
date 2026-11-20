// Must match the categories the backend accepts
export const CATEGORIES = ['Food', 'Groceries', 'Delivery', 'Transit', 'Rent', 'Other']

export function money(value) {
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Bar color: green, orange at 80%, red at 100%
export function barClass(percentUsed) {
  if (percentUsed >= 100) return 'bar-over'
  if (percentUsed >= 80) return 'bar-warn'
  return 'bar-ok'
}