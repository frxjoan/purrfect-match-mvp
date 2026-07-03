import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CustomerListingGrid from '../components/CustomerListingGrid.jsx'
import CustomerSearchBar from '../components/CustomerSearchBar.jsx'
import FloatingMessageButton from '../components/FloatingMessageButton.jsx'
import ReportListingModal from '../components/ReportListingModal.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchListings, fetchSavedListings, saveListing, unsaveListing } from '../services/api.js'
import { applyListingFilters, emptyListingFilters } from '../utils/listingFilters.js'

function ListingsPage() {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(emptyListingFilters)
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reportListing, setReportListing] = useState(null)
  const [savedListingIds, setSavedListingIds] = useState([])
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadListings() {
      setIsLoading(true)
      setLoadError('')

      try {
        const result = await fetchListings()

        if (isActive) {
          setListings(result.listings)
        }
      } catch (error) {
        if (isActive) {
          setListings([])
          setLoadError(error.response?.data?.error?.message ?? 'Listings could not be loaded.')
        }
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

  useEffect(() => {
    let isActive = true

    async function loadSavedListings() {
      if (!currentUser?.token) {
        setSavedListingIds([])
        return
      }

      try {
        const result = await fetchSavedListings()
        if (isActive) {
          setSavedListingIds(result.savedListingIds)
        }
      } catch {
        if (isActive) {
          setSavedListingIds([])
        }
      }
    }

    loadSavedListings()

    return () => {
      isActive = false
    }
  }, [currentUser?.token])

  const filteredListings = useMemo(() => applyListingFilters(listings, query, filters), [filters, listings, query])

  function requireLoginOrRun(action) {
    if (!currentUser?.token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    action()
  }

  function handleReport(listing) {
    requireLoginOrRun(() => setReportListing(listing))
  }

  function toggleSavedListing(listingId) {
    requireLoginOrRun(async () => {
      setSaveError('')
      try {
        const isSaved = savedListingIds.map(String).includes(String(listingId))
        const result = isSaved ? await unsaveListing(listingId) : await saveListing(listingId)
        setSavedListingIds(result.savedListingIds)
      } catch (error) {
        setSaveError(error.response?.data?.error?.message ?? 'Saved listings could not be updated.')
      }
    })
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <CustomerSearchBar filters={filters} listings={listings} onChange={setQuery} onFiltersChange={setFilters} value={query} />
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
        {saveError ? (
          <div className="rounded-xl border border-black bg-white p-3 text-center text-xs text-[#c24b78]">
            {saveError}
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
        {!isLoading && filteredListings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black bg-white p-8 text-center text-sm">
            No cats match those filters yet.
          </div>
        ) : null}
      </div>

      <FloatingMessageButton />
      <ReportListingModal listing={reportListing} onClose={() => setReportListing(null)} />
    </>
  )
}

export default ListingsPage
