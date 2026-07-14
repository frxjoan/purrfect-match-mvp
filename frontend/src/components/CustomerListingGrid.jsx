import ListingCard from './ListingCard.jsx'

/**
 * Renders the customer-facing listing collection.
 *
 * It compares backend listing ids with the saved-listing id list so each card
 * can show its current saved state without asking Flask again.
 *
 * @param {{ listings: Object[], onReport?: Function, onToggleSave?: Function, savedListingIds?: Array<number|string> }} props - Grid props.
 * @returns {JSX.Element} Responsive listing grid.
 */
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
