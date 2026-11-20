import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <section className="card">
      <h2>Page not found</h2>
      <p className="muted">
        That page doesn't exist. <Link to="/">Go to the dashboard</Link>.
      </p>
    </section>
  )
}

export default NotFoundPage