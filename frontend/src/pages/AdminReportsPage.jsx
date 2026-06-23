import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { reports } from '../data/mockData.js'

const ADMIN_REPORTS_KEY = 'purrfect-match-admin-reports'

function getStoredReports() {
  try {
    return JSON.parse(window.localStorage.getItem(ADMIN_REPORTS_KEY)) ?? reports
  } catch {
    return reports
  }
}

function AdminReportsPage() {
  const { reportId } = useParams()
  const [moderationReports, setModerationReports] = useState(getStoredReports)
  const [notice, setNotice] = useState('')
  const activeReport = useMemo(
    () => moderationReports.find((report) => report.id === reportId) ?? moderationReports[0],
    [reportId, moderationReports],
  )

  function persistReports(nextReports) {
    // TODO: Connect report moderation actions to admin reports API when endpoint is finalized.
    window.localStorage.setItem(ADMIN_REPORTS_KEY, JSON.stringify(nextReports))
    return nextReports
  }

  function updateReport(status) {
    if (!activeReport) {
      return
    }

    setModerationReports((currentReports) =>
      persistReports(
        currentReports.map((report) =>
          report.id === activeReport.id ? { ...report, status } : report,
        ),
      ),
    )
    setNotice(`${status} placeholder saved for ${activeReport.id}.`)
  }

  return (
    <>
      <SectionHeader eyebrow="Admin reports" title="Reports management" description="Review report details and take placeholder moderation actions." />
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {moderationReports.map((report) => (
            <ActionButton className="w-full justify-start" key={report.id} to={`/admin/reports/${report.id}`} variant={activeReport?.id === report.id ? 'primary' : 'secondary'}>
              {report.listing} · {report.status}
            </ActionButton>
          ))}
        </div>
        {activeReport ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Report detail</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{activeReport.listing}</h2>
            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['Report ID', activeReport.id],
                ['Reason', activeReport.reason],
                ['Status', activeReport.status],
                ['Evidence', 'Customer submitted notes placeholder'],
                ['Reviewer workflow', 'Triage, investigate, resolve'],
                ['Backend TODO', 'Persist moderation status through admin reports API'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton onClick={() => updateReport('In review')}>Mark in review</ActionButton>
              <ActionButton onClick={() => updateReport('Resolved')} variant="secondary">Resolve placeholder</ActionButton>
              <ActionButton onClick={() => updateReport('Escalated')} variant="danger">Escalate placeholder</ActionButton>
            </div>
            {notice ? <p className="mt-4 text-sm font-semibold text-teal-700">{notice}</p> : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No reports in the local queue.
          </div>
        )}
      </section>
    </>
  )
}

export default AdminReportsPage
