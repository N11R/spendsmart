import { Route, Routes } from 'react-router'
import Layout from './components/Layout.jsx'
import BudgetsPage from './pages/BudgetsPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ExpensesPage from './pages/ExpensesPage.jsx'
import InsightsPage from './pages/InsightsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ReceiptReviewPage from './pages/ReceiptReviewPage.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="expenses/receipt" element={<ReceiptReviewPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App