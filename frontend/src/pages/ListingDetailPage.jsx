import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import ReportListingModal from '../components/ReportListingModal.jsx'
import { listings as demoListings } from '../data/mockData.js'
import useAuth from '../hooks/useAuth.js'
import { fetchListingById } from '../services/api.js'

function ListingDetailPage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { listingId } = useParams()
  const [listing, setListing] = useState(null)
  const [isFallbackDemo, setIsFallbackDemo] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadListing() {
      setIsLoading(true)
      setLoadError('')
      setIsFallbackDemo(false)

      try {
        const result = await fetchListingById(listingId)

        if (!isActive) {
          return
        }

        setListing(result)
      } catch {
        if (!isActive) {
          return
        }

        const fallbackListing = demoListings.find((item) => String(item.id) === String(listingId)) ?? null

        // TODO: Remove demo fallback once deployed frontend and Flask API data use the same listing IDs.
        setListing(fallbackListing)
        setIsFallbackDemo(Boolean(fallbackListing))
        setLoadError(
          fallbackListing
            ? 'Backend listing details are unavailable, so a demo announcement is shown temporarily.'
            : 'Listing details could not be loaded from the backend.',
        )
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

  function requireLoginOrRun(action) {
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    action()
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

  return (
    <>
      <section className="mx-auto w-full max-w-5xl rounded-xl border border-black bg-[#fbfbff] p-5">
        <button className="mb-2 text-3xl" onClick={() => navigate(-1)} type="button">←</button>
        {loadError ? (
          <div className="mb-4 rounded-xl border border-black bg-white p-3 text-center text-xs text-[#6c5ce7]">
            {loadError}
          </div>
        ) : null}
        <div className="rounded-xl border border-black bg-white p-4">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <button className="text-4xl text-slate-900" onClick={() => setNotice('Previous image placeholder.')} type="button">←</button>
            <img alt={`${listing.name} the ${listing.breed}`} className="mx-auto h-40 w-full max-w-xs object-cover" src={listing.image} />
            <button className="text-4xl text-slate-900" onClick={() => setNotice('Next image placeholder.')} type="button">→</button>
          </div>
          <p className="mt-1 text-right text-xs text-slate-600">2/5</p>
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-3 text-sm">
            <div>
              <h1 className="text-base font-semibold">{listing.name} {listing.breed}</h1>
              <p>by {listing.breeder}</p>
              <p className="text-yellow-500">★★★★★ <span className="text-slate-700">(83 Reviews)</span></p>
            </div>
            <div className="rounded-xl border border-black bg-white p-3">
              <p>{listing.location}</p>
              <p>Born 20 juin, 2022</p>
              <p className="mt-2 font-semibold">{listing.price.toLocaleString()} €</p>
            </div>
            <div>
              <p className="font-semibold">Description</p>
              <p className="mt-1 rounded-xl border border-black bg-white p-3 text-xs leading-5">{listing.summary}</p>
            </div>
          </aside>
          <section className="flex flex-col justify-center gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <ActionButton onClick={() => requireLoginOrRun(() => navigate('/customer/messages'))} variant="secondary">
                Send a message
              </ActionButton>
              <ActionButton onClick={() => setNotice('Share action placeholder.')} variant="secondary">
                Share
              </ActionButton>
            </div>
            <ActionButton className="w-full bg-[#ff7bac] hover:bg-[#f4679d]" onClick={() => requireLoginOrRun(() => setShowReport(true))} variant="danger">
              Report this announce
            </ActionButton>
            {!currentUser ? (
              <div className="rounded-xl border border-black bg-white p-3 text-center text-xs">
                Message and report actions require login. You will be returned here after signing in.
              </div>
            ) : null}
            {notice ? <p className="text-center text-sm font-semibold text-[#6c5ce7]">{notice}</p> : null}
            <p className="text-center text-xs text-slate-500">
              TODO: Start conversations through /api/v1/conversations once JWT auth is connected.
            </p>
            {isFallbackDemo ? <p className="text-center text-xs text-slate-500">Demo fallback data is active for this announcement.</p> : null}
          </section>
        </div>
      </section>
      <ReportListingModal listing={showReport ? listing : null} onClose={() => setShowReport(false)} />
    </>
  )
}

export default ListingDetailPage
