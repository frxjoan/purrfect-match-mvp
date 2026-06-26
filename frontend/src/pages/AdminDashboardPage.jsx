import { useEffect, useMemo, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { fetchAdminCertifications, fetchAdminReports, fetchAdminStats } from '../services/api.js'
import useAuth from '../hooks/useAuth.js'

function AdminDashboardPage() {
  const { currentUser } = useAuth()
  const [backendStats, setBackendStats] = useState(null)
  const [certifications, setCertifications] = useState([])
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(currentUser?.token))
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      if (!currentUser?.token) {
        setNotice('Sign in with a backend admin account to load dashboard data.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setNotice('')

      try {
        const [statsData, certificationData, reportsData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminCertifications(),
          fetchAdminReports({ status: 'all' }),
        ])

        if (!ignore) {
          setBackendStats(statsData.stats)
          setCertifications(certificationData.certifications ?? [])
          setReports(reportsData.reports ?? [])
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Admin dashboard data could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      ignore = true
    }
  }, [currentUser?.token])

  const stats = useMemo(() => ([
    { label: 'Total users', value: String(backendStats?.total_users ?? '-'), note: 'Backend users' },
    { label: 'Breeders', value: String(backendStats?.total_breeders ?? '-'), note: `${backendStats?.pending_certifications ?? '-'} pending review` },
    { label: 'Customers', value: String(backendStats?.total_customers ?? '-'), note: 'Registered customer accounts' },
    { label: 'Active listings', value: String(backendStats?.active_listings ?? '-'), note: 'Public catalogue' },
    { label: 'Open reports', value: String(backendStats?.pending_reports ?? '-'), note: 'Moderation follow-up' },
    { label: 'Reviews', value: String(backendStats?.total_reviews ?? '-'), note: 'Backend reviews' },
  ]), [backendStats])

  return (
    <>
      <SectionHeader
        eyebrow="Admin"
        title="Marketplace operations"
        description="Review platform health, breeder verification queues, and listing reports."
      />
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        {isLoading ? <p className="text-sm font-semibold text-slate-400 md:col-span-3">Loading backend admin data...</p> : null}
        {notice ? <p className="text-sm font-semibold text-amber-700 md:col-span-3">{notice}</p> : null}
      </section>
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Pending breeder verification</h2>
          <div className="mt-5 space-y-4">
            {certifications.length ? certifications.slice(0, 2).map((breeder) => (
              <div key={breeder.id} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{breeder.business_name}</p>
                  <p className="text-sm text-slate-500">{breeder.location} - {breeder.certification_status}</p>
                </div>
                <ActionButton to={`/admin/verifications/${breeder.id}`} variant="secondary">Review</ActionButton>
              </div>
            )) : <p className="text-sm text-slate-500">No pending breeder applications.</p>}
          </div>
          <ActionButton className="mt-5" to="/admin/verifications">Open queue</ActionButton>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Reports</h2>
          <div className="mt-5 space-y-4">
            {reports.length ? reports.slice(0, 2).map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-950">Listing #{report.listing_id}</p>
                  <p className="text-sm text-slate-500">{report.reason} - {report.status}</p>
                </div>
                <ActionButton to={`/admin/reports/${report.id}`} variant="secondary">Open</ActionButton>
              </div>
            )) : <p className="text-sm text-slate-500">No reports in the moderation queue.</p>}
          </div>
          <ActionButton className="mt-5" to="/admin/reports">Manage reports</ActionButton>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Users</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Review active, suspended, and banned accounts from the backend user list.
          </p>
          <ActionButton className="mt-5" to="/admin/users" variant="secondary">Open users</ActionButton>
        </div>
      </section>
    </>
  )
}

export default AdminDashboardPage
