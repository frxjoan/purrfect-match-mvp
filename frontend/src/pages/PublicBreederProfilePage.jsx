import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import useAuth from '../hooks/useAuth.js'
import { createBreederReview, deleteReview, fetchBreederReviews, fetchListings, fetchPublicBreederProfile, updateReview } from '../services/api.js'
import { getStoredProfileImage } from '../utils/profileImageStorage.js'

function getInitials(name) {
  return String(name || 'PM')
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PM'
}

function getAvatarUrl(person) {
  return getStoredProfileImage(person)
    || person?.profile_picture_url
    || person?.profilePictureUrl
    || person?.avatar_url
    || ''
}

function getReviewerName(review) {
  return review.reviewer?.display_name
    || review.reviewer?.username
    || review.reviewer?.email
    || 'Customer'
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function ratingLabel(value) {
  return `${value}/5`
}

function PublicBreederProfilePage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { breederId } = useParams()
  const [breederProfile, setBreederProfile] = useState(null)
  const [comment, setComment] = useState('')
  const [deletingReviewId, setDeletingReviewId] = useState(null)
  const [editComment, setEditComment] = useState('')
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState('5')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isUpdatingReview, setIsUpdatingReview] = useState(false)
  const [listings, setListings] = useState([])
  const [notice, setNotice] = useState('')
  const [rating, setRating] = useState('5')
  const [reviews, setReviews] = useState([])

  async function loadReviews() {
    const reviewData = await fetchBreederReviews(breederId)
    setReviews(reviewData.reviews ?? [])
  }

  useEffect(() => {
    let ignore = false

    async function loadBreederProfile() {
      setIsLoading(true)
      setNotice('')

      try {
        const [profileData, reviewData, listingData] = await Promise.all([
          fetchPublicBreederProfile(breederId),
          fetchBreederReviews(breederId),
          fetchListings(),
        ])

        if (!ignore) {
          setBreederProfile(profileData.breeder_profile)
          setReviews(reviewData.reviews ?? [])
          setListings(listingData.listings.filter((listing) => Number(listing.breederId) === Number(breederId)))
        }
      } catch (error) {
        if (!ignore) {
          setBreederProfile(null)
          setNotice(error.response?.data?.error?.message ?? 'Breeder profile could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadBreederProfile()

    return () => {
      ignore = true
    }
  }, [breederId])

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return null
    }

    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0)
    return (total / reviews.length).toFixed(1)
  }, [reviews])

  const ownReview = useMemo(
    () => reviews.find((review) => Number(review.reviewer_id) === Number(currentUser?.id)),
    [currentUser?.id, reviews],
  )
  const isOwnBreederProfile = Number(currentUser?.breeder_profile?.id) === Number(breederId)
  const canReview = Boolean(currentUser?.token) && !isOwnBreederProfile && !ownReview
  const displayName = breederProfile?.display_name ?? breederProfile?.business_name ?? 'Breeder profile'
  const ownerName = breederProfile?.owner_name ?? breederProfile?.user?.display_name ?? ''
  const breederAvatarUser = breederProfile?.user ?? { id: breederProfile?.user_id, profile_picture_url: breederProfile?.profile_picture_url }
  const profilePhoto = getAvatarUrl(breederAvatarUser) || breederProfile?.profile_picture_url

  function canDeleteReview(review) {
    return currentUser?.role === 'admin' || Number(review.reviewer_id) === Number(currentUser?.id)
  }

  async function handleSubmitReview(event) {
    event.preventDefault()

    if (!currentUser?.token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setIsSubmittingReview(true)
    setNotice('')

    try {
      const data = await createBreederReview(breederId, {
        comment: comment.trim() || undefined,
        rating: Number(rating),
      })
      setReviews((currentReviews) => [data.review, ...currentReviews])
      setComment('')
      setRating('5')
      setNotice('Review submitted.')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Review could not be submitted.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  function startEditReview(review) {
    setEditingReviewId(review.id)
    setEditRating(String(review.rating ?? 5))
    setEditComment(review.comment ?? '')
    setNotice('')
  }

  async function handleUpdateReview(event) {
    event.preventDefault()

    if (!editingReviewId) {
      return
    }

    setIsUpdatingReview(true)
    setNotice('')

    try {
      const data = await updateReview(editingReviewId, {
        comment: editComment.trim() || undefined,
        rating: Number(editRating),
      })
      setReviews((currentReviews) => currentReviews.map((review) => (review.id === editingReviewId ? data.review : review)))
      setEditingReviewId(null)
      setEditComment('')
      setEditRating('5')
      setNotice('Review updated.')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Review could not be updated.')
    } finally {
      setIsUpdatingReview(false)
    }
  }

  async function handleDeleteReview(review) {
    if (!canDeleteReview(review)) {
      return
    }

    const confirmed = window.confirm('Delete this review? This action cannot be undone.')

    if (!confirmed) {
      return
    }

    setDeletingReviewId(review.id)
    setNotice('')

    try {
      await deleteReview(review.id)
      if (editingReviewId === review.id) {
        setEditingReviewId(null)
        setEditComment('')
        setEditRating('5')
      }
      await loadReviews()
      setNotice('Review deleted.')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Review could not be deleted.')
    } finally {
      setDeletingReviewId(null)
    }
  }

  if (isLoading) {
    return <div className="mx-auto max-w-xl rounded-xl border border-black bg-white p-8 text-center text-sm">Loading breeder profile...</div>
  }

  if (!breederProfile) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-black bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">Breeder not found</h1>
        {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <button className="text-sm font-semibold" onClick={() => navigate(-1)} type="button">Back</button>
      <section className="grid gap-6 rounded-xl border border-black bg-[#fbfbff] p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-black bg-white text-2xl font-semibold text-[#6c5ce7]">
          {profilePhoto ? <img alt={displayName} className="h-full w-full object-cover" src={profilePhoto} /> : getInitials(displayName)}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-950">{displayName}</h1>
          {ownerName ? <p className="mt-1 text-sm text-slate-600">{ownerName}</p> : null}
          <p className="mt-1 text-sm text-slate-700">{breederProfile.location}</p>
          {breederProfile.bio ? <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700">{breederProfile.bio}</p> : null}
        </div>
        <div className="rounded-lg border border-black bg-white p-4 text-sm">
          <p className="font-semibold text-slate-950">{averageRating ? ratingLabel(averageRating) : 'No rating yet'}</p>
          <p className="text-slate-600">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
          <p className="mt-2 text-slate-600">{listings.length} listing{listings.length === 1 ? '' : 's'}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Listings</h2>
          <div className="mt-5 space-y-4">
            {listings.length ? listings.map((listing) => (
              <article key={listing.id} className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-[6rem_1fr_auto] sm:items-center">
                {listing.image ? <img alt={listing.title} className="h-24 w-24 rounded-lg object-cover" src={listing.image} /> : <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-500">No photo</div>}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{listing.title}</p>
                  <p className="text-sm text-slate-500">{listing.breed} - {listing.location}</p>
                  <p className="text-sm font-semibold text-slate-900">{listing.price.toLocaleString()} EUR</p>
                </div>
                <ActionButton to={`/customer/listings/${listing.id}`} variant="secondary">Open</ActionButton>
              </article>
            )) : <p className="text-sm text-slate-500">No public listings yet.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmitReview}>
            <h2 className="text-xl font-bold text-slate-950">Leave a review</h2>
            {!currentUser ? <p className="mt-3 text-sm text-slate-600">Sign in to review this breeder.</p> : null}
            {isOwnBreederProfile ? <p className="mt-3 text-sm text-slate-600">You cannot review your own breeder profile.</p> : null}
            {ownReview ? <p className="mt-3 text-sm text-slate-600">You already reviewed this breeder. You can edit your review below.</p> : null}
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">Rating</span>
              <select className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" disabled={!canReview || isSubmittingReview} onChange={(event) => setRating(event.target.value)} value={rating}>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}
              </select>
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">Comment</span>
              <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3" disabled={!canReview || isSubmittingReview} onChange={(event) => setComment(event.target.value)} value={comment} />
            </label>
            <div className="mt-5 flex flex-wrap gap-3">
              {currentUser ? (
                <ActionButton disabled={!canReview || isSubmittingReview} type="submit">{isSubmittingReview ? 'Submitting...' : 'Submit review'}</ActionButton>
              ) : (
                <ActionButton onClick={() => navigate('/login', { state: { from: location.pathname } })} type="button">Sign in</ActionButton>
              )}
            </div>
            {notice ? <p className="mt-3 text-sm font-semibold text-[#6c5ce7]">{notice}</p> : null}
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Reviews</h2>
            <div className="mt-5 space-y-4">
              {reviews.length ? reviews.map((review) => {
                const reviewerName = getReviewerName(review)
                const reviewerAvatar = getAvatarUrl(review.reviewer)
                const isOwnReview = Number(review.reviewer_id) === Number(currentUser?.id)
                const isEditing = editingReviewId === review.id
                const showDeleteReview = canDeleteReview(review)

                return (
                  <article key={review.id} className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-bold text-[#6c5ce7]">
                          {reviewerAvatar ? <img alt={reviewerName} className="h-full w-full object-cover" src={reviewerAvatar} /> : getInitials(reviewerName)}
                        </div>
                        <p className="truncate font-semibold text-slate-950">{reviewerName}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#6c5ce7]">{ratingLabel(review.rating)}</p>
                    </div>
                    {isEditing ? (
                      <form className="mt-4 grid gap-3" onSubmit={handleUpdateReview}>
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">Rating</span>
                          <select className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" disabled={isUpdatingReview} onChange={(event) => setEditRating(event.target.value)} value={editRating}>
                            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">Comment</span>
                          <textarea className="mt-2 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-3" disabled={isUpdatingReview} onChange={(event) => setEditComment(event.target.value)} value={editComment} />
                        </label>
                        <div className="flex flex-wrap gap-3">
                          <ActionButton disabled={isUpdatingReview} type="submit">{isUpdatingReview ? 'Saving...' : 'Save review'}</ActionButton>
                          <ActionButton disabled={isUpdatingReview} onClick={() => setEditingReviewId(null)} type="button" variant="secondary">Cancel</ActionButton>
                          {showDeleteReview ? <ActionButton disabled={isUpdatingReview || deletingReviewId === review.id} onClick={() => handleDeleteReview(review)} type="button" variant="danger">{deletingReviewId === review.id ? 'Deleting...' : 'Delete review'}</ActionButton> : null}
                        </div>
                      </form>
                    ) : (
                      <>
                        {review.comment ? <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p> : null}
                        {review.created_at ? <p className="mt-3 text-xs text-slate-500">{formatDate(review.created_at)}</p> : null}
                        {(isOwnReview || showDeleteReview) ? (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {isOwnReview ? <ActionButton onClick={() => startEditReview(review)} type="button" variant="secondary">Edit review</ActionButton> : null}
                            {showDeleteReview ? <ActionButton disabled={deletingReviewId === review.id} onClick={() => handleDeleteReview(review)} type="button" variant="danger">{deletingReviewId === review.id ? 'Deleting...' : 'Delete review'}</ActionButton> : null}
                          </div>
                        ) : null}
                      </>
                    )}
                  </article>
                )
              }) : <p className="text-sm text-slate-500">No reviews yet.</p>}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export default PublicBreederProfilePage
