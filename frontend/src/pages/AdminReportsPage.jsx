import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { fetchAdminReports, reviewAdminReport } from '../services/api.js'

function AdminReportsPage() {
  const { reportId } = useParams()
  const [moderationReports, setModerationReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const activeReport = useMemo(
    () => moderationReports.find((report) => String(report.id) === String(reportId)) ?? moderationReports[0],
    [reportId, moderationReports],
  )

  useEffect(() => {
    let ignore = false

    async function loadReports() {
      setIsLoading(true)
      try {
        const data = await fetchAdminReports({ status: 'all' })
        if (!ignore) {
          setModerationReports(data.reports ?? [])
          setNotice('')
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Reports could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadReports()

    return () => {
      ignore = true
    }
  }, [])

  async function updateReport(decision) {
    if (!activeReport) {
      return
    }

    try {
      const data = await reviewAdminReport(activeReport.id, { decision, admin_comment: `Marked ${decision} from admin UI.` })
      setModerationReports((currentReports) => currentReports.map((report) => report.id === activeReport.id ? data.report : report))
      setNotice(`Report ${decision}.`)
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Report moderation failed.')
    }
  }

  return (
    <>
      <SectionHeader eyebrow="Admin reports" title="Reports management" description="Review listing reports from the backend moderation queue." />
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading ? <p className="text-sm text-slate-500">Loading reports...</p> : null}
          {!isLoading && moderationReports.length === 0 ? <p className="text-sm text-slate-500">No reports in the backend queue.</p> : null}
          {moderationReports.map((report) => (
            <ActionButton className="w-full justify-start" key={report.id} to={`/admin/reports/${report.id}`} variant={activeReport?.id === report.id ? 'primary' : 'secondary'}>
              Listing #{report.listing_id} - {report.status}
            </ActionButton>
          ))}
        </div>
        {activeReport ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Report detail</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Listing #{activeReport.listing_id}</h2>
            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['Report ID', activeReport.id],
                ['Reason', activeReport.reason],
                ['Status', activeReport.status],
                ['Comment', activeReport.comment ?? 'No comment'],
                ['Reporter', activeReport.reporter_id],
                ['Reviewed at', activeReport.reviewed_at ?? 'Not reviewed'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton onClick={() => updateReport('accepted')}>Accept report</ActionButton>
              <ActionButton onClick={() => updateReport('rejected')} variant="danger">Reject report</ActionButton>
            </div>
            {notice ? <p className="mt-4 text-sm font-semibold text-teal-700">{notice}</p> : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No report selected.</div>
        )}
      </section>
    </>
  )
}

export default AdminReportsPage
