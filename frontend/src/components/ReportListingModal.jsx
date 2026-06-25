import { useEffect, useState } from 'react'
import { createListingReport } from '../services/api.js'
import ActionButton from './ActionButton.jsx'

const reportReasons = [
  ['misleading_information', 'Misleading information'],
  ['inappropriate_content', 'Inappropriate content'],
  ['suspected_scam', 'Suspected scam'],
  ['animal_abuse_or_neglect', 'Animal abuse or neglect'],
  ['duplicate_listing', 'Duplicate listing'],
  ['wrong_category', 'Wrong category'],
  ['other', 'Other'],
]

function ReportListingModal({ listing, onClose }) {
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

  if (!listing) {
    return null
  }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#eee7ff]/70 p-4 backdrop-blur-sm">
      {step === 'thanks' ? (
        <section className="w-full max-w-xl rounded-lg border border-black bg-[#fbfbff] p-10 text-center shadow-xl">
          <h2 className="text-lg font-semibold">Thank you!</h2>
          <p className="mt-6 text-sm leading-6">Our team will review your report.</p>
          <p className="mt-4 text-sm leading-6">Thank you for helping us keep Purrfect Match safe and trusted.</p>
          <ActionButton className="mt-8" onClick={onClose}>Close</ActionButton>
        </section>
      ) : (
        <form className="w-full max-w-xl rounded-lg border border-black bg-[#fbfbff] p-8 shadow-xl" onSubmit={handleSubmit}>
          <div className="mb-4 flex items-center gap-3">
            <button className="text-3xl" onClick={onClose} type="button">←</button>
            <h2 className="text-2xl font-medium">Report announce</h2>
          </div>
          <label className="mx-auto mt-5 block max-w-xs">
            <span className="block text-sm font-semibold">Reason</span>
            <select className="mt-2 w-full rounded-lg border border-black bg-white px-4 py-3 text-sm" onChange={(event) => setReason(event.target.value)} value={reason}>
              {reportReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="mx-auto mt-5 block max-w-xs">
            <span className="block text-sm">Please provide more information (optional)</span>
            <textarea className="mt-2 min-h-24 w-full rounded-lg border border-black bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => setDetails(event.target.value)} placeholder="Describe the issue..." value={details} />
          </label>
          <label className="mx-auto mt-5 block max-w-xs opacity-60">
            <span className="block text-sm">Screenshot upload unavailable</span>
            <div className="mt-2 flex h-20 items-center justify-center rounded-lg border border-dashed border-black bg-white text-xs">TODO: backend report screenshot endpoint needed</div>
          </label>
          {error ? <p className="mt-5 text-center text-sm font-semibold text-[#c24b78]">{error}</p> : null}
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
