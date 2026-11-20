import ServiceNotice from '../components/ServiceNotice.jsx'

function InsightsPage() {
  return (
    <>
      <h1 className="page-title">AI Insights</h1>
      <section className="card insights-card">
        <h2>Insights and Alerts</h2>
        <ServiceNotice service="The AI Agent Service">
          Spending tips and alerts will appear here in a later sprint.
        </ServiceNotice>
        <p className="muted">
          The AI will look at your saved expenses and budgets, point out categories that are growing,
          and suggest ways to save.
        </p>
      </section>
    </>
  )
}

export default InsightsPage