import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { fetchAdminReports, fetchListingById, restrictAdminUser, reviewAdminReport } from '../services/api.js'

const reasonLabels = {
  animal_abuse_or_neglect: 'Animal abuse or neglect',
  duplicate_listing: 'Duplicate listing',
  inappropriate_content: 'Inappropriate content',
  misleading_information: 'Misleading information',
  other: 'Other',
  suspected_scam: 'Scam',
  wrong_category: 'Wrong category',
}

const sanctionOptions = [
  { label: 'No account restriction', value: 'none' },
  { label: 'Temporary suspension', value: 'suspension' },
  { label: 'Permanent ban', value: 'ban' },
]

const statusLabels = {
  accepted: 'Accepted',
  pending: 'Pending',
  rejected: 'Rejected',
}

function formatReportDate(value) {
  if (!value) {
    return 'Not reviewed'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function getBreederName(report, listing) {
  return report.listing?.breeder?.business_name
    || report.listing?.breeder_name
    || listing?.breederProfile?.business_name
    || listing?.breeder
    || (report.listing?.breeder_id ? `Breeder #${report.listing.breeder_id}` : null)
    || (listing?.breederId ? `Breeder #${listing.breederId}` : null)
    || 'Unknown breeder'
}

function getListingTitle(report, listing) {
  return report.listing?.title
    || report.listing_title
    || listing?.title
    || listing?.name
    || `Listing #${report.listing_id}`
}

function getReasonLabel(reason) {
  return reasonLabels[reason] ?? reason ?? 'Unknown reason'
}

function getReporterName(report) {
  const reporter = report.reporter ?? report.reporter_user ?? report.user ?? null
  const fullName = [reporter?.first_name, reporter?.last_name].filter(Boolean).join(' ')

  return fullName
    || reporter?.display_name
    || reporter?.username
    || reporter?.email
    || report.reporter_display_name
    || report.reporter_name
    || report.reporter_email
    || (report.reporter_id ? `Reporter #${report.reporter_id}` : 'Unknown reporter')
}

function getReportSummary(report, listing) {
  return `${getBreederName(report, listing)} - ${getReasonLabel(report.reason)} - ${statusLabels[report.status] ?? report.status ?? 'Unknown'}`
}

function getRestrictionReason(report, sanction) {
  const label = sanctionOptions.find((option) => option.value === sanction)?.label ?? sanction
  return `Listing report #${report.id} accepted. Sanction: ${label}. Reason: ${report.reason}.`
}

function getSuspensionExpiry(days) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + Number(days))
  return expiresAt.toISOString()
}

function AdminReportsPage() {
  const { reportId } = useParams()
  const [listingDetailsById, setListingDetailsById] = useState({})
  const [moderationReports, setModerationReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModerating, setIsModerating] = useState(false)
  const [listingError, setListingError] = useState('')
  const [listingLoading, setListingLoading] = useState(false)
  const [listingModalReport, setListingModalReport] = useState(null)
  const [listingDetails, setListingDetails] = useState(null)
  const [notice, setNotice] = useState('')
  const [sanction, setSanction] = useState('none')
  const [suspensionDays, setSuspensionDays] = useState('7')
  const [sanctionError, setSanctionError] = useState('')
  const [showSanctionModal, setShowSanctionModal] = useState(false)
  const activeReport = useMemo(
    () => moderationReports.find((report) => String(report.id) === String(reportId)) ?? moderationReports[0],
    [reportId, moderationReports],
  )
  const activeListing = activeReport ? listingDetailsById[activeReport.listing_id] : null

  async function loadReportListings(reports) {
    const ids = [...new Set(reports.map((report) => report.listing_id).filter(Boolean).map(String))]
    const entries = await Promise.all(ids.map(async (id) => {
      const report = reports.find((item) => String(item.listing_id) === id)

      if (report?.listing) {
        return [id, report.listing]
      }

      try {
        return [id, await fetchListingById(id)]
      } catch {
        return [id, null]
      }
    }))

    setListingDetailsById(Object.fromEntries(entries))
  }

  async function loadReports() {
    setIsLoading(true)
    try {
      const data = await fetchAdminReports({ status: 'all' })
      const reports = data.reports ?? []
      setModerationReports(reports)
      await loadReportListings(reports)
      setNotice('')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Reports could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialReports() {
      setIsLoading(true)
      try {
        const data = await fetchAdminReports({ status: 'all' })
        const reports = data.reports ?? []
        if (!ignore) {
          setModerationReports(reports)
          await loadReportListings(reports)
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

    loadInitialReports()

    return () => {
      ignore = true
    }
  }, [])

  async function rejectReport() {
    if (!activeReport) {
      return
    }

    setIsModerating(true)
    try {
      await reviewAdminReport(activeReport.id, { decision: 'rejected', admin_comment: 'Rejected from admin UI.' })
      setNotice('Report rejected.')
      await loadReports()
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Report moderation failed.')
    } finally {
      setIsModerating(false)
    }
  }

  function openAcceptFlow() {
    setSanction('none')
    setSuspensionDays('7')
    setSanctionError('')
    setShowSanctionModal(true)
  }

  async function openListingModal(report) {
    setListingModalReport(report)
    setListingDetails(null)
    setListingError('')
    setListingLoading(true)

    try {
      const listing = report.listing ?? listingDetailsById[report.listing_id] ?? await fetchListingById(report.listing_id)
      setListingDetails(listing)
    } catch (error) {
      setListingError(error.response?.data?.error?.message ?? 'Reported listing could not be loaded.')
    } finally {
      setListingLoading(false)
    }
  }

  async function applySanctionAndAccept(event) {
    event.preventDefault()

    if (!activeReport) {
      return
    }

    if (sanction === 'suspension' && (!suspensionDays || Number(suspensionDays) < 1)) {
      setSanctionError('Suspension duration must be at least 1 day.')
      return
    }

    setIsModerating(true)
    setSanctionError('')

    try {
      if (sanction !== 'none') {
        const listing = activeListing ?? await fetchListingById(activeReport.listing_id)
        const ownerUserId = listing.breederProfile?.user_id ?? listing.breederProfile?.user?.id

        if (!ownerUserId) {
          throw new Error('The reported listing owner could not be identified.')
        }

        await restrictAdminUser(ownerUserId, {
          expires_at: sanction === 'suspension' ? getSuspensionExpiry(suspensionDays) : undefined,
          reason: getRestrictionReason(activeReport, sanction),
          restriction_type: sanction,
        })
      }

      await reviewAdminReport(activeReport.id, {
        admin_comment: getRestrictionReason(activeReport, sanction),
        decision: 'accepted',
      })
      setShowSanctionModal(false)
      setNotice('Report accepted and moderation action applied.')
      await loadReports()
    } catch (error) {
      setSanctionError(error.response?.data?.error?.message ?? error.message ?? 'Moderation action failed.')
    } finally {
      setIsModerating(false)
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
              {getReportSummary(report, listingDetailsById[report.listing_id])}
            </ActionButton>
          ))}
        </div>
        {activeReport ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Report detail</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{getReportSummary(activeReport, activeListing)}</h2>
            <p className="mt-2 text-sm text-slate-600">Reported by: <span className="font-semibold text-slate-950">{getReporterName(activeReport)}</span></p>
            <p className="mt-1 text-sm text-slate-600">Reported listing: <span className="font-semibold text-slate-950">{getListingTitle(activeReport, activeListing)}</span></p>
            <p className="mt-2 text-[11px] text-slate-400">Reference #{activeReport.id}</p>
            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['Reason', getReasonLabel(activeReport.reason)],
                ['Status', statusLabels[activeReport.status] ?? activeReport.status ?? 'Unknown'],
                ['Comment', activeReport.comment ?? 'No comment'],
                ['Created at', formatReportDate(activeReport.created_at)],
                ['Reviewed at', formatReportDate(activeReport.reviewed_at)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton onClick={() => openListingModal(activeReport)} variant="secondary">View reported listing</ActionButton>
              <ActionButton disabled={isModerating} onClick={openAcceptFlow}>Accept report</ActionButton>
              <ActionButton disabled={isModerating} onClick={rejectReport} variant="danger">Reject report</ActionButton>
            </div>
            {notice ? <p className="mt-4 text-sm font-semibold text-teal-700">{notice}</p> : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No report selected.</div>
        )}
      </section>

      {listingModalReport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{getListingTitle(listingModalReport, listingDetails)}</h2>
                <p className="text-xs text-slate-500">Reported by {getReporterName(listingModalReport)}</p>
              </div>
              <ActionButton onClick={() => setListingModalReport(null)} type="button" variant="secondary">Close</ActionButton>
            </div>
            {listingLoading ? <p className="mt-6 text-sm text-slate-500">Loading listing...</p> : null}
            {listingError ? <p className="mt-6 text-sm font-semibold text-rose-700">{listingError}</p> : null}
            {listingDetails ? (
              <div className="mt-6 space-y-5">
                {listingDetails.images?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {listingDetails.images.map((image) => (
                      <img alt={listingDetails.title} className="h-44 w-full rounded-lg object-cover" key={image.id ?? image.image_url} src={image.image_url} />
                    ))}
                  </div>
                ) : null}
                <dl className="grid gap-4 md:grid-cols-2">
                  {[
                    ['Title', listingDetails.title || listingDetails.name || 'Untitled listing'],
                    ['Breed', listingDetails.breed || 'Unknown'],
                    ['Age', listingDetails.age || 'Unknown'],
                    ['Gender', listingDetails.gender || 'Unknown'],
                    ['Price', Number(listingDetails.price || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })],
                    ['Location', listingDetails.location || 'Unknown'],
                    ['Status', listingDetails.status || 'Unknown'],
                    ['Breeder', getBreederName(listingModalReport, listingDetails)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-4">
                      <dt className="text-sm text-slate-500">{label}</dt>
                      <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{listingDetails.summary || listingDetails.description || 'No description provided.'}</p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {showSanctionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl" onSubmit={applySanctionAndAccept}>
            <h2 className="text-xl font-bold text-slate-950">Choose moderation action</h2>
            <p className="mt-2 text-sm text-slate-600">Select a backend-supported action before accepting this report.</p>
            <div className="mt-5 grid gap-3">
              {sanctionOptions.map((option) => (
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3" key={option.value}>
                  <input checked={sanction === option.value} onChange={() => setSanction(option.value)} type="radio" value={option.value} />
                  <span className="font-semibold text-slate-800">{option.label}</span>
                </label>
              ))}
            </div>
            {sanction === 'suspension' ? (
              <label className="mt-5 block">
                <span className="text-sm font-semibold text-slate-700">Suspension duration in days</span>
                <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" min="1" onChange={(event) => setSuspensionDays(event.target.value)} type="number" value={suspensionDays} />
              </label>
            ) : null}
            {sanctionError ? <p className="mt-4 text-sm font-semibold text-rose-700">{sanctionError}</p> : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <ActionButton disabled={isModerating} onClick={() => setShowSanctionModal(false)} type="button" variant="secondary">Cancel</ActionButton>
              <ActionButton disabled={isModerating} type="submit">{isModerating ? 'Applying...' : 'Confirm accept'}</ActionButton>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}

export default AdminReportsPage
