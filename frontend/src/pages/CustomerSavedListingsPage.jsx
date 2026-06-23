import { useMemo, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { listings } from '../data/mockData.js'

const SAVED_LISTINGS_KEY = 'purrfect-match-saved-listings'

function getSavedListingIds() {
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_LISTINGS_KEY)) ?? []
  } catch {
    return []
  }
}

function CustomerSavedListingsPage() {
  const [savedListingIds, setSavedListingIds] = useState(getSavedListingIds)
  const savedListings = useMemo(
    () => listings.filter((listing) => savedListingIds.includes(listing.id)),
    [savedListingIds],
  )

  function removeSavedListing(listingId) {
    setSavedListingIds((currentIds) => {
      const nextIds = currentIds.filter((id) => id !== listingId)
      // TODO: Remove saved listing through customer API when backend persistence exists.
      window.localStorage.setItem(SAVED_LISTINGS_KEY, JSON.stringify(nextIds))
      return nextIds
    })
  }

  return (
    <>
      <SectionHeader
        eyebrow="Customer saved listings"
        title="Favorites"
        description="Saved cats are stored locally for demo browsing until backend saved-listing endpoints are added."
        actions={<ActionButton to="/customer/listings">Browse more cats</ActionButton>}
      />
      {savedListings.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {savedListings.map((listing) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={listing.id}>
              <p className="text-sm font-semibold text-teal-700">{listing.breed}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">{listing.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{listing.location} · ${listing.price.toLocaleString()}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton to={`/customer/listings/${listing.id}`}>Open</ActionButton>
                <ActionButton onClick={() => removeSavedListing(listing.id)} variant="secondary">
                  Remove
                </ActionButton>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No saved listings yet.
        </div>
      )}
    </>
  )
}

export default CustomerSavedListingsPage
