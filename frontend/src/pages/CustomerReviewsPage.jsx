import { useEffect, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchBreederReviews, fetchListings, fetchPublicBreederProfile } from '../services/api.js'

function formatDate(value) {
  if (!value) {
    return 'No date'
  }

  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function getBreederName(profile, fallback) {
  return profile?.display_name
    || profile?.business_name
    || profile?.owner_name
    || fallback
    || 'Breeder profile'
}

function CustomerReviewsPage() {
  const { currentUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let ignore = false

    async function loadAuthoredReviews() {
      if (!currentUser?.id) {
        setReviews([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setNotice('')

      try {
        const listingData = await fetchListings()
        const breederSummaries = new Map()

        listingData.listings.forEach((listing) => {
          if (!listing.breederId) {
            return
          }

          breederSummaries.set(String(listing.breederId), {
            id: listing.breederId,
            name: listing.breeder || listing.breederProfile?.business_name || `Breeder #${listing.breederId}`,
          })
        })

        const discoveredReviews = await Promise.all(Array.from(breederSummaries.values()).map(async (breeder) => {
          try {
            const [profileData, reviewData] = await Promise.all([
              fetchPublicBreederProfile(breeder.id),
              fetchBreederReviews(breeder.id),
            ])
            const breederName = getBreederName(profileData.breeder_profile, breeder.name)

            return (reviewData.reviews ?? [])
              .filter((review) => Number(review.reviewer_id) === Number(currentUser.id))
              .map((review) => ({
                ...review,
                breederId: breeder.id,
                breederName,
              }))
          } catch {
            return []
          }
        }))

        if (!ignore) {
          setReviews(discoveredReviews.flat().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)))
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Your reviews could not be loaded.')
          setReviews([])
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadAuthoredReviews()

    return () => {
      ignore = true
    }
  }, [currentUser?.id])

  return (
    <div className="grid gap-6">
      <SectionHeader eyebrow="Customer reviews" title="My reviews" description="Reviews you have written for breeders." />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading your reviews...</p> : null}
        {notice ? <p className="text-sm font-semibold text-rose-700">{notice}</p> : null}
        {!isLoading && !notice && reviews.length === 0 ? (
          <div>
            <h2 className="text-xl font-bold text-slate-950">No reviews yet</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Reviews you write on breeder profile pages will appear here.</p>
            <div className="mt-5">
              <ActionButton to="/customer/listings" variant="secondary">Browse listings</ActionButton>
            </div>
          </div>
        ) : null}
        {reviews.length ? (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={review.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{review.breederName}</h2>
                    <p className="mt-1 text-sm font-semibold text-[#6c5ce7]">{review.rating}/5</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(review.created_at)}</p>
                    {review.status ? <p className="mt-1 text-xs font-semibold text-slate-500">Status: {review.status}</p> : null}
                  </div>
                  <ActionButton to={`/breeders/${review.breederId}`} variant="secondary">View / Edit review</ActionButton>
                </div>
                {review.comment ? <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default CustomerReviewsPage
