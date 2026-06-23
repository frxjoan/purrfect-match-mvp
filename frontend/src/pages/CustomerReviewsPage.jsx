import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'

function CustomerReviewsPage() {
  const navigate = useNavigate()
  const [review, setReview] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Submit customer reviews through breeder review endpoints once backend contract is connected.
    setSubmitted(true)
    setReview('')
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl border border-black bg-[#fbfbff] md:grid-cols-[0.85fr_1.15fr]">
      <aside className="border-b border-black p-6 md:border-b-0 md:border-r">
        <button className="mb-8 text-3xl" onClick={() => navigate(-1)} type="button">←</button>
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#c9bfff] bg-[#f8f7fb] text-5xl text-[#8b7cff]">
            ♡
            <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#ff7bac] text-sm text-white">◎</span>
          </div>
          <div className="w-full max-w-xs text-sm leading-7">
            <p>Charlotte83</p>
            <p>Le Var</p>
            <p>Bio</p>
            <p className="mt-3 rounded-xl border border-black bg-white p-3">Éleveuse de chat depuis 2 ans dans le var</p>
          </div>
        </div>
      </aside>
      <form className="flex min-h-96 flex-col items-center justify-center gap-8 p-6" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 self-start md:ml-12">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c9bfff] text-[#8b7cff]">♡</span>
          <div>
            <p className="text-sm font-semibold">Customer59</p>
            <p className="rounded-full border border-black bg-white px-4 py-1 text-sm">Très chaleureuse</p>
          </div>
        </div>
        <label className="w-full max-w-sm">
          <span className="sr-only">Write your review</span>
          <textarea
            className="min-h-16 w-full rounded-xl border border-black bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#c9bfff]"
            onChange={(event) => setReview(event.target.value)}
            placeholder="Write your review..."
            value={review}
          />
        </label>
        <ActionButton disabled={!review.trim()} type="submit">Review</ActionButton>
        {submitted ? <p className="text-sm font-semibold text-[#6c5ce7]">Review saved locally as a placeholder.</p> : null}
      </form>
    </section>
  )
}

export default CustomerReviewsPage
