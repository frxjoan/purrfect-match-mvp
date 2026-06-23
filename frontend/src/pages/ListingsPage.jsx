import { useMemo, useState } from 'react'
import ListingCard from '../components/ListingCard.jsx'
import ReportListingModal from '../components/ReportListingModal.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { listings } from '../data/mockData.js'

function ListingsPage() {
  const [filters, setFilters] = useState({ breed: '', location: '', maxPrice: '' })
  const [reportListing, setReportListing] = useState(null)

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesBreed = listing.breed.toLowerCase().includes(filters.breed.toLowerCase())
      const matchesLocation = listing.location.toLowerCase().includes(filters.location.toLowerCase())
      const matchesPrice = filters.maxPrice ? listing.price <= Number(filters.maxPrice) : true

      return matchesBreed && matchesLocation && matchesPrice
    })
  }, [filters])

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function clearFilters() {
    setFilters({ breed: '', location: '', maxPrice: '' })
  }

  return (
    <>
      <SectionHeader
        eyebrow="Customer"
        title="Find your next cat"
        description="Search real marketplace-style cards with temporary static data. API integration should fetch from /api/v1/listings once pagination and response needs are finalized."
      />

      <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Breed</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"
            onChange={(event) => updateFilter('breed', event.target.value)}
            placeholder="Ragdoll"
            value={filters.breed}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Location</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"
            onChange={(event) => updateFilter('location', event.target.value)}
            placeholder="Austin"
            value={filters.location}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Max price</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"
            min="0"
            onChange={(event) => updateFilter('maxPrice', event.target.value)}
            placeholder="2000"
            type="number"
            value={filters.maxPrice}
          />
        </label>
        <div className="flex items-end">
          <button className="min-h-11 w-full rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-teal-300 hover:text-teal-700" onClick={clearFilters} type="button">
            Clear filters
          </button>
        </div>
      </form>

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {filteredListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} onReport={setReportListing} />
        ))}
      </section>

      {filteredListings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No cats match those filters yet.
        </div>
      ) : null}

      <ReportListingModal listing={reportListing} onClose={() => setReportListing(null)} />
    </>
  )
}

export default ListingsPage
