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

function ListingsPage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ search: '' })
  const [listings, setListings] = useState([])
  const [isFallbackDemo, setIsFallbackDemo] = useState(false)
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
        setIsFallbackDemo(false)
      } catch {
        if (!isActive) {
          return
        }

        // TODO: Remove demo fallback once the hosted Flask API is always available in demo environments.
        setListings(demoListings)
        setIsFallbackDemo(true)
        setLoadError('Backend listings are unavailable, so demo announcements are shown temporarily.')
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

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const haystack = `${listing.name} ${listing.breed} ${listing.location}`.toLowerCase()

      return haystack.includes(filters.search.toLowerCase())
    })
  }, [filters, listings])

  function handleReport(listing) {
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setReportListing(listing)
  }

  function toggleSavedListing(listingId) {
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setSavedListingIds((currentIds) => {
      const normalizedListingId = String(listingId)
      const normalizedCurrentIds = currentIds.map(String)
      const nextIds = normalizedCurrentIds.includes(normalizedListingId)
        ? normalizedCurrentIds.filter((id) => id !== normalizedListingId)
        : [...normalizedCurrentIds, normalizedListingId]

      // TODO: Persist saved listings through the customer saved-listings API when it exists.
      window.localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(nextIds))
      return nextIds
    })
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <CustomerSearchBar onChange={(value) => setFilters({ search: value })} value={filters.search} />
        {!currentUser ? (
          <div className="mx-auto max-w-md rounded-xl border border-black bg-white p-3 text-center text-xs">
            Listings are public. Message, save and report actions require login.
          </div>
        ) : null}
        {loadError ? (
          <div className="rounded-xl border border-black bg-white p-3 text-center text-xs text-[#6c5ce7]">
            {loadError}
          </div>
        ) : null}
        {isLoading ? (
          <div className="rounded-xl border border-black bg-white p-8 text-center text-sm">
            Loading announcements...
          </div>
        ) : (
          <CustomerListingGrid
            listings={filteredListings}
            onReport={handleReport}
            onToggleSave={toggleSavedListing}
            savedListingIds={savedListingIds}
          />
        )}
      </div>

      {!isLoading && filteredListings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black bg-white p-8 text-center text-sm">
          {isFallbackDemo ? 'No demo cats match those filters yet.' : 'No cats match those filters yet.'}
        </div>
      ) : null}

      <FloatingMessageButton />
      <ReportListingModal listing={reportListing} onClose={() => setReportListing(null)} />
    </>
  )
}

export default ListingsPage
