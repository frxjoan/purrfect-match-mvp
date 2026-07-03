import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import CustomerListingGrid from '../components/CustomerListingGrid.jsx'
import CustomerSearchBar from '../components/CustomerSearchBar.jsx'
import FloatingMessageButton from '../components/FloatingMessageButton.jsx'
import ReportListingModal from '../components/ReportListingModal.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchSavedListings, unsaveListing } from '../services/api.js'
import { applyListingFilters, emptyListingFilters } from '../utils/listingFilters.js'

function CustomerSavedListingsPage() {
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

  useEffect(() => {
    let isActive = true

    async function loadSavedListings() {
      setIsLoading(true)
      setLoadError('')

      try {
        const result = await fetchSavedListings()

        if (isActive) {
          setListings(result.listings)
          setSavedListingIds(result.savedListingIds)
        }
      } catch (error) {
        if (isActive) {
          setListings([])
          setSavedListingIds([])
          setLoadError(error.response?.data?.error?.message ?? 'Saved listings could not be loaded.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadSavedListings()

    return () => {
      isActive = false
    }
  }, [])

  const savedListings = useMemo(
    () => applyListingFilters(listings, query, filters),
    [filters, listings, query],
  )

  async function removeSavedListing(listingId) {
    try {
      const result = await unsaveListing(listingId)
      setListings(result.listings)
      setSavedListingIds(result.savedListingIds)
      setLoadError('')
    } catch (error) {
      setLoadError(error.response?.data?.error?.message ?? 'Saved listing could not be removed.')
    }
  }

  function handleReport(listing) {
    if (!currentUser?.token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setReportListing(listing)
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <CustomerSearchBar filters={filters} listings={listings} onChange={setQuery} onFiltersChange={setFilters} value={query} />
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
            No liked announcements match this search or filter yet.
          </div>
        )}
      </div>
      <FloatingMessageButton />
      <ReportListingModal listing={reportListing} onClose={() => setReportListing(null)} />
    </>
  )
}

export default CustomerSavedListingsPage
