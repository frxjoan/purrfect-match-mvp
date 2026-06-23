import { useState } from 'react'
import ActionButton from './ActionButton.jsx'

function ReportListingModal({ listing, onClose }) {
  const [reason, setReason] = useState('verification')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!listing) {
    return null
  }

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Submit report to /api/v1/listings/:listing_id/reports when auth and report reasons are wired.
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-4 md:items-center md:justify-center">
      <section className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Report listing</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{listing.name}</h2>
          </div>
          <ActionButton onClick={onClose} variant="secondary">Close</ActionButton>
        </div>
        {submitted ? (
          <div className="mt-6 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
            Report saved as a frontend placeholder. Backend submission is marked as a TODO.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Reason</span>
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"
                onChange={(event) => setReason(event.target.value)}
                value={reason}
              >
                <option value="verification">Verification concern</option>
                <option value="accuracy">Incorrect listing details</option>
                <option value="duplicate">Duplicate listing</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Details</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3"
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Share what looks wrong or concerning."
                value={details}
              />
            </label>
            <ActionButton type="submit">Save report placeholder</ActionButton>
          </form>
        )}
      </section>
    </div>
  )
}

export default ReportListingModal
