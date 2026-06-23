import { useEffect, useState } from 'react'
import ActionButton from './ActionButton.jsx'

function ReportListingModal({ listing, onClose }) {
  const [details, setDetails] = useState('')
  const [step, setStep] = useState('details')

  useEffect(() => {
    if (listing) {
      setDetails('')
      setStep('details')
    }
  }, [listing])

  if (!listing) {
    return null
  }

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Submit report details and optional screenshot to /api/v1/listings/:listing_id/reports.
    setStep('thanks')
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
          <p className="text-center text-sm">Please provide more information (optional)</p>
          <label className="mx-auto mt-5 block max-w-xs">
            <span className="sr-only">Describe the issue</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-black bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#c9bfff]"
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Describe the issue..."
              value={details}
            />
          </label>
          <label className="mx-auto mt-5 block max-w-xs">
            <span className="block text-sm">Adds screenshots (optional)</span>
            <div className="mt-2 flex h-20 cursor-pointer items-center justify-center rounded-lg border border-black bg-white text-3xl">▣</div>
            <input className="sr-only" type="file" />
          </label>
          <div className="mt-8 flex justify-center gap-4">
            <ActionButton onClick={onClose} type="button">Close</ActionButton>
            <ActionButton type="submit">Submit</ActionButton>
          </div>
        </form>
      )}
    </div>
  )
}

export default ReportListingModal
