import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-4xl font-bold text-slate-100">404 — Not Found</h1>
      <p className="mt-4 text-slate-300">The page you requested does not exist.</p>
      <div className="mt-6">
        <Link to="/" className="inline-block rounded bg-sky-400 px-4 py-2 font-semibold text-slate-950">
          Go home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
