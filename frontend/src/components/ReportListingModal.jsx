import { useEffect, useRef, useState } from 'react'
import { createListingReport } from '../services/api.js'
import ActionButton from './ActionButton.jsx'

/**
 * Report reasons supported by the Flask listing report endpoint.
 *
 * The submitted values must match backend validation, while the second value is
 * the label shown to the customer.
 */
const reportReasons = [
  ['misleading_information', 'Misleading information'],
  ['inappropriate_content', 'Inappropriate content'],
  ['suspected_scam', 'Suspected scam'],
  ['animal_abuse_or_neglect', 'Animal abuse or neglect'],
  ['duplicate_listing', 'Duplicate listing'],
  ['wrong_category', 'Wrong category'],
  ['other', 'Other'],
]

/**
 * Collects and submits a listing report for admin moderation.
 *
 * The modal posts the selected reason and optional comment to Flask. Backend
 * validation errors, such as duplicate reports or reporting your own listing,
 * are displayed through the local error state.
 *
 * @param {{ listing: Object|null, onClose: Function }} props - Report modal props.
 * @returns {JSX.Element|null} Report form, success step, or null when closed.
 */
function ReportListingModal({ listing, onClose }) {
  const dialogRef = useRef(null)
  const headingRef = useRef(null)
  const returnFocusRef = useRef(null)
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState('misleading_information')
  const [step, setStep] = useState('details')

  useEffect(() => {
    if (listing) {
      setDetails('')
      setError('')
      setIsSubmitting(false)
      setReason('misleading_information')
      setStep('details')
    }
  }, [listing])

  useEffect(() => {
    if (!listing) return undefined
    returnFocusRef.current = document.activeElement
    return () => returnFocusRef.current?.focus()
  }, [listing])

  useEffect(() => {
    if (listing) headingRef.current?.focus()
  }, [listing, step])

  if (!listing) {
    return null
  }

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const controls = [...dialogRef.current.querySelectorAll('*')].filter((element) => element.matches('button:not(:disabled), select:not(:disabled), textarea:not(:disabled)'))
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === headingRef.current && !first)) {
      event.preventDefault()
      first.focus()
    }
  }

  /**
   * Sends the report payload to Flask and advances to the thank-you step.
   *
   * @param {SubmitEvent} event - Form submit event.
   * @returns {Promise<void>} Completes after the report succeeds or an error is shown.
   */
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await createListingReport(listing.id, {
        comment: details.trim() || undefined,
        reason,
      })
      setStep('thanks')
    } catch (submitError) {
      setError(submitError.response?.data?.error?.message ?? 'Report could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div aria-labelledby="report-dialog-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-[#eee7ff]/70 p-4 backdrop-blur-sm" onKeyDown={handleDialogKeyDown} ref={dialogRef} role="dialog">
      {step === 'thanks' ? (
        <section className="w-full max-w-xl rounded-lg border border-black bg-[#fbfbff] p-10 text-center shadow-xl">
          <h2 className="text-lg font-semibold" id="report-dialog-title" ref={headingRef} tabIndex={-1}>Thank you!</h2>
          <p className="mt-6 text-sm leading-6">Our team will review your report.</p>
          <p className="mt-4 text-sm leading-6">Thank you for helping us keep Purrfect Match safe and trusted.</p>
          <ActionButton className="mt-8" onClick={onClose}>Close</ActionButton>
        </section>
      ) : (
        <form className="w-full max-w-xl rounded-lg border border-black bg-[#fbfbff] p-8 shadow-xl" onSubmit={handleSubmit}>
          <div className="mb-4 flex items-center gap-3">
            <button className="text-sm font-semibold" onClick={onClose} type="button">Back</button>
            <h2 className="text-2xl font-medium" id="report-dialog-title" ref={headingRef} tabIndex={-1}>Report listing</h2>
          </div>
          <label className="mx-auto mt-5 block max-w-xs">
            <span className="block text-sm font-semibold">Reason</span>
            <select className="mt-2 w-full rounded-lg border border-black bg-white px-4 py-3 text-sm" onChange={(event) => setReason(event.target.value)} value={reason}>
              {reportReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="mx-auto mt-5 block max-w-xs">
            <span className="block text-sm">Please provide more information (optional)</span>
            <textarea className="mt-2 min-h-24 w-full rounded-lg border border-black bg-white px-4 py-3 text-sm placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => setDetails(event.target.value)} placeholder="Describe the issue..." value={details} />
          </label>
          {error ? <p className="mt-5 text-center text-sm font-semibold text-[#c24b78]" role="alert">{error}</p> : null}
          <div className="mt-8 flex justify-center gap-4">
            <ActionButton onClick={onClose} type="button">Close</ActionButton>
            <ActionButton disabled={isSubmitting} type="submit">{isSubmitting ? 'Submitting...' : 'Submit'}</ActionButton>
          </div>
        </form>
      )}
    </div>
  )
}

export default ReportListingModal
