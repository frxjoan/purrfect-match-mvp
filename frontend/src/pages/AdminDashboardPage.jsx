import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { adminStats, pendingBreeders, reports } from '../data/mockData.js'

function AdminDashboardPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Admin"
        title="Marketplace operations"
        description="Review platform health, breeder verification queues, and listing reports."
      />
      <section className="grid gap-4 md:grid-cols-3">
        {adminStats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Pending breeder verification</h2>
          <div className="mt-5 space-y-4">
            {pendingBreeders.slice(0, 2).map((breeder) => (
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
            {reports.slice(0, 2).map((report) => (
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
      </section>
    </>
  )
}

export default AdminDashboardPage
