import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CustomerListingGrid from '../components/CustomerListingGrid.jsx'
import CustomerSearchBar from '../components/CustomerSearchBar.jsx'
import FloatingMessageButton from '../components/FloatingMessageButton.jsx'
import ReportListingModal from '../components/ReportListingModal.jsx'
import { listings as demoListings } from '../data/mockData.js'
import useAuth from '../hooks/useAuth.js'
import { fetchListings } from '../services/api.js'

const SAVED_LISTINGS_KEY = 'purrfect-match-saved-listings'

function getSavedListingIds() {
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_LISTINGS_KEY)) ?? []
  } catch {
    return []
  }
}

function CustomerSavedListingsPage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reportListing, setReportListing] = useState(null)
  const [savedListingIds, setSavedListingIds] = useState(getSavedListingIds)

  useEffect(() => {
    let isActive = true

    async function loadListings() {
      setIsLoading(true)
      setLoadError('')

      try {
        const result = await fetchListings()

        if (!isActive) {
          return
        }

        setListings(result.listings)
      } catch {
        if (!isActive) {
          return
        }

        // TODO: Remove demo fallback once saved listings have a backend endpoint.
        setListings(demoListings)
        setLoadError('Backend listings are unavailable, so demo liked announcements are shown temporarily.')
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadListings()

    return () => {
      isActive = false
    }
  }, [])

  const savedListings = useMemo(
    () => listings.filter((listing) => {
      const haystack = `${listing.name} ${listing.breed} ${listing.location}`.toLowerCase()
      return savedListingIds.map(String).includes(String(listing.id)) && haystack.includes(query.toLowerCase())
    }),
    [listings, query, savedListingIds],
  )

  function removeSavedListing(listingId) {
    setSavedListingIds((currentIds) => {
      const nextIds = currentIds.map(String).filter((id) => id !== String(listingId))
      // TODO: Remove saved listing through customer API when backend persistence exists.
      window.localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(nextIds))
      return nextIds
    })
  }

  function handleReport(listing) {
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setReportListing(listing)
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <CustomerSearchBar onChange={setQuery} value={query} />
        {loadError ? (
          <div className="rounded-xl border border-black bg-white p-3 text-center text-xs text-[#6c5ce7]">
            {loadError}
          </div>
        ) : null}
        {isLoading ? (
          <div className="rounded-xl border border-black bg-white p-8 text-center text-sm">
            Loading liked announcements...
          </div>
        ) : savedListings.length ? (
          <CustomerListingGrid
            listings={savedListings}
            onReport={handleReport}
            onToggleSave={removeSavedListing}
            savedListingIds={savedListingIds}
          />
        ) : (
          <div className="rounded-xl border border-black bg-white p-8 text-center text-sm">
            No liked announcements yet.
          </div>
        )}
      </div>
      <FloatingMessageButton />
      <ReportListingModal listing={reportListing} onClose={() => setReportListing(null)} />
    </>
  )
}

export default CustomerSavedListingsPage
