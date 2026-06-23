import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { reports } from '../data/mockData.js'

function AdminReportsPage() {
  const { reportId } = useParams()
  const [notice, setNotice] = useState('')
  const activeReport = useMemo(() => reports.find((report) => report.id === reportId) ?? reports[0], [reportId])

  function updateReport(action) {
    // TODO: Connect report moderation actions to admin reports API when endpoint is finalized.
    setNotice(`${action} placeholder saved for ${activeReport.id}.`)
  }

  return (
    <>
      <SectionHeader eyebrow="Admin reports" title="Reports management" description="Review report details and take placeholder moderation actions." />
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {reports.map((report) => (
            <ActionButton className="w-full justify-start" key={report.id} to={`/admin/reports/${report.id}`} variant={activeReport.id === report.id ? 'primary' : 'secondary'}>
              {report.listing}
            </ActionButton>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Report detail</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">{activeReport.listing}</h2>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['Report ID', activeReport.id],
              ['Reason', activeReport.reason],
              ['Status', activeReport.status],
              ['Evidence', 'Customer submitted notes placeholder'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <ActionButton onClick={() => updateReport('Mark in review')}>Mark in review</ActionButton>
            <ActionButton onClick={() => updateReport('Resolve')} variant="secondary">Resolve placeholder</ActionButton>
          </div>
          {notice ? <p className="mt-4 text-sm font-semibold text-teal-700">{notice}</p> : null}
        </div>
      </section>
    </>
  )
}

export default AdminReportsPage
