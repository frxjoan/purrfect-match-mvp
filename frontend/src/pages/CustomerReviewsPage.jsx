import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import { createBreederReview } from '../services/api.js'

function CustomerReviewsPage() {
  const navigate = useNavigate()
  const [breederId, setBreederId] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('5')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setNotice('')

    try {
      await createBreederReview(breederId, {
        comment: comment.trim() || undefined,
        rating: Number(rating),
      })
      setNotice('Review submitted.')
      setBreederId('')
      setComment('')
      setRating('5')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Review could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-xl border border-black bg-[#fbfbff] p-6">
      <button className="mb-6 text-sm font-semibold" onClick={() => navigate(-1)} type="button">Back</button>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Review a breeder</h1>
          <p className="mt-2 text-sm text-slate-600">Submit a review to the backend breeder review endpoint.</p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Breeder ID</span>
          <input className="mt-2 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" min="1" onChange={(event) => setBreederId(event.target.value)} type="number" value={breederId} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Rating</span>
          <select className="mt-2 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => setRating(event.target.value)} value={rating}>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Comment</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-black bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#c9bfff]"
            onChange={(event) => setComment(event.target.value)}
            placeholder="Write your review..."
            value={comment}
          />
        </label>
        <ActionButton disabled={isSubmitting || !breederId} type="submit">{isSubmitting ? 'Submitting...' : 'Submit review'}</ActionButton>
        {notice ? <p className="text-sm font-semibold text-[#6c5ce7]">{notice}</p> : null}
      </form>
    </section>
  )
}

export default CustomerReviewsPage
