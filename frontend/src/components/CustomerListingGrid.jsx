import ListingCard from './ListingCard.jsx'

function CustomerListingGrid({ listings, onReport, onToggleSave, savedListingIds = [] }) {
  return (
    <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard
          isSaved={savedListingIds.map(String).includes(String(listing.id))}
          key={listing.id}
          listing={listing}
          onReport={onReport}
          onToggleSave={onToggleSave}
        />
      ))}
    </section>
  )
}

export default CustomerListingGrid
