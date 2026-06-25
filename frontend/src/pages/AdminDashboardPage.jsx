import { useEffect, useMemo, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { adminStats, pendingBreeders, reports } from '../data/mockData.js'
import { fetchAdminStats } from '../services/api.js'

const ADMIN_VERIFICATIONS_KEY = 'purrfect-match-admin-verifications'
const ADMIN_REPORTS_KEY = 'purrfect-match-admin-reports'

function readStoredItems(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function AdminDashboardPage() {
  const [backendStats, setBackendStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const verifications = readStoredItems(ADMIN_VERIFICATIONS_KEY, pendingBreeders)
  const moderatedReports = readStoredItems(ADMIN_REPORTS_KEY, reports)
  const openReports = moderatedReports.filter((report) => report.status !== 'Resolved')

  useEffect(() => {
    let ignore = false

    async function loadStats() {
      try {
        const data = await fetchAdminStats()
        if (!ignore) {
          setBackendStats(data.stats)
          setStatsError('')
        }
      } catch (error) {
        if (!ignore) {
          setStatsError(error.response?.data?.error?.message ?? 'Backend admin stats unavailable.')
        }
      }
    }

    loadStats()

    return () => {
      ignore = true
    }
  }, [])

  const stats = useMemo(() => {
    if (!backendStats) {
      return adminStats
    }

    return [
      { label: 'Total users', value: String(backendStats.total_users), note: 'Across all roles' },
      { label: 'Breeders', value: String(backendStats.total_breeders), note: `${backendStats.pending_certifications} pending review` },
      { label: 'Customers', value: String(backendStats.total_customers), note: 'Registered customer accounts' },
    ]
  }, [backendStats])

  return (
    <>
      <SectionHeader
        eyebrow="Admin"
        title="Marketplace operations"
        description="Review platform health, breeder verification queues, and listing reports."
      />
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        <StatCard label="Verification queue" value={String(backendStats?.pending_certifications ?? verifications.length)} note={backendStats ? 'Backend queue' : 'Local demo queue'} />
        <StatCard label="Open reports" value={String(backendStats?.pending_reports ?? openReports.length)} note="Moderation follow-up needed" />
        <StatCard label="Admin reviews" value={String(backendStats?.total_reviews ?? 'Ready')} note={backendStats ? 'Backend reviews' : 'Placeholder workflows connected locally'} />
        {statsError ? <p className="text-sm font-semibold text-amber-700 md:col-span-3">{statsError}</p> : null}
      </section>
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Pending breeder verification</h2>
          <div className="mt-5 space-y-4">
            {verifications.slice(0, 2).map((breeder) => (
              <div key={breeder.id} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-950">{breeder.name}</p>
                  <p className="text-sm text-slate-500">{breeder.owner} · {breeder.submitted}</p>
                </div>
                <ActionButton to={`/admin/verifications/${breeder.id}`} variant="secondary">Review</ActionButton>
              </div>
            ))}
          </div>
          <ActionButton className="mt-5" to="/admin/verifications">Open queue</ActionButton>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Reports</h2>
          <div className="mt-5 space-y-4">
            {moderatedReports.slice(0, 2).map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-950">{report.listing}</p>
                  <p className="text-sm text-slate-500">{report.reason} · {report.status}</p>
                </div>
                <ActionButton to={`/admin/reports/${report.id}`} variant="secondary">Open</ActionButton>
              </div>
            ))}
          </div>
          <ActionButton className="mt-5" to="/admin/reports">Manage reports</ActionButton>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Users</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Review customer, breeder, and admin account placeholders before the user-management API is connected.
          </p>
          <ActionButton className="mt-5" to="/admin/users" variant="secondary">Open users</ActionButton>
        </div>
      </section>
    </>
  )
}

export default AdminDashboardPage
