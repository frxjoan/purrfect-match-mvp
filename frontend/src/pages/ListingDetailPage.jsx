import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import ReportListingModal from '../components/ReportListingModal.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchListingById, startConversation } from '../services/api.js'

function ListingDetailPage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { listingId } = useParams()
  const [listing, setListing] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadListing() {
      setIsLoading(true)
      setLoadError('')
      setActiveImageIndex(0)

      try {
        const result = await fetchListingById(listingId)

        if (isActive) {
          setListing(result)
        }
      } catch (error) {
        if (isActive) {
          setListing(null)
          setLoadError(error.response?.data?.error?.message ?? 'Listing details could not be loaded.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadListing()

    return () => {
      isActive = false
    }
  }, [listingId])

  const listingImages = useMemo(() => {
    if (!listing) {
      return []
    }

    const imageUrls = listing.images.map((image) => image.image_url).filter(Boolean)
    return imageUrls.length ? imageUrls : [listing.image].filter(Boolean)
  }, [listing])

  function requireLoginOrRun(action) {
    if (!currentUser?.token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    action()
  }

  async function handleStartConversation() {
    if (!currentUser?.token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    try {
      await startConversation(listing.id)
      navigate('/customer/messages')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Conversation could not be started.')
    }
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href)
    setNotice('Listing link copied.')
  }

  function showPreviousImage() {
    setActiveImageIndex((currentIndex) => Math.max(0, currentIndex - 1))
  }

  function showNextImage() {
    setActiveImageIndex((currentIndex) => Math.min(listingImages.length - 1, currentIndex + 1))
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-black bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">Loading announcement...</h1>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-black bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">Listing not found</h1>
        <p className="mt-3 text-sm">{loadError || 'This announcement is unavailable.'}</p>
      </div>
    )
  }

  const activeImage = listingImages[activeImageIndex]

  return (
    <>
      <section className="mx-auto w-full max-w-5xl rounded-xl border border-black bg-[#fbfbff] p-5">
        <button className="mb-2 text-sm font-semibold" onClick={() => navigate(-1)} type="button">Back</button>
        {loadError ? <div className="mb-4 rounded-xl border border-black bg-white p-3 text-center text-xs text-[#6c5ce7]">{loadError}</div> : null}
        <div className="rounded-xl border border-black bg-white p-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <button className="text-3xl text-slate-900 disabled:opacity-30" disabled={activeImageIndex === 0} onClick={showPreviousImage} type="button">&lt;</button>
            {activeImage ? (
              <img alt={`${listing.name} ${listing.breed}`} className="mx-auto h-56 w-full max-w-lg rounded-lg object-cover" src={activeImage} />
            ) : (
              <div className="mx-auto flex h-56 w-full max-w-lg items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                No photo available
              </div>
            )}
            <button className="text-3xl text-slate-900 disabled:opacity-30" disabled={activeImageIndex >= listingImages.length - 1} onClick={showNextImage} type="button">&gt;</button>
          </div>
          {listingImages.length ? <p className="mt-2 text-right text-xs text-slate-600">{activeImageIndex + 1}/{listingImages.length}</p> : null}
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-3 text-sm">
            <div>
              <h1 className="text-base font-semibold">{listing.name || listing.title}</h1>
              {listing.breederId ? (
                <Link className="mt-2 flex items-center gap-3 rounded-xl border border-black bg-white p-3 hover:bg-[#f7f3ff]" to={`/breeders/${listing.breederId}`}>
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-[#f8f7fb] text-xs font-semibold text-[#6c5ce7]">
                    {listing.breederPhoto ? <img alt="" className="h-full w-full object-cover" src={listing.breederPhoto} /> : (listing.breeder || 'PM').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-950">{listing.breeder || 'Breeder profile'}</span>
                    {listing.breederOwnerName ? <span className="block truncate text-xs text-slate-600">{listing.breederOwnerName}</span> : null}
                  </span>
                </Link>
              ) : null}
            </div>
            <div className="rounded-xl border border-black bg-white p-3">
              <p>{listing.breed}</p>
              <p>{listing.location}</p>
              {listing.age ? <p>{listing.age}</p> : null}
              <p className="mt-2 font-semibold">{listing.price.toLocaleString()} EUR</p>
            </div>
            {listing.summary ? (
              <div>
                <p className="font-semibold">Description</p>
                <p className="mt-1 rounded-xl border border-black bg-white p-3 text-xs leading-5">{listing.summary}</p>
              </div>
            ) : null}
          </aside>
          <section className="flex flex-col justify-center gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <ActionButton onClick={() => requireLoginOrRun(handleStartConversation)} variant="secondary">Send a message</ActionButton>
              <ActionButton onClick={handleShare} variant="secondary">Share</ActionButton>
            </div>
            {listing.breederId ? <ActionButton className="w-full" to={`/breeders/${listing.breederId}`} variant="secondary">View breeder profile</ActionButton> : null}
            <ActionButton className="w-full bg-[#ff7bac] hover:bg-[#f4679d]" onClick={() => requireLoginOrRun(() => setShowReport(true))} variant="danger">Report this announce</ActionButton>
            {!currentUser ? <div className="rounded-xl border border-black bg-white p-3 text-center text-xs">Message and report actions require login. You will be returned here after signing in.</div> : null}
            {notice ? <p className="text-center text-sm font-semibold text-[#6c5ce7]">{notice}</p> : null}
          </section>
        </div>
      </section>
      <ReportListingModal listing={showReport ? listing : null} onClose={() => setShowReport(false)} />
    </>
  )
}

export default ListingDetailPage