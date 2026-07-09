import { Link } from 'react-router-dom'
import ActionButton from './ActionButton.jsx'

/**
 * Displays one normalized listing returned by the Flask listings endpoints.
 *
 * The card remains reusable by receiving callbacks from the parent page. Saving
 * and reporting are optional because public pages, saved pages, and management
 * views do not all expose the same actions.
 *
 * @param {{ isSaved?: boolean, listing: Object, onReport?: Function, onToggleSave?: Function }} props - Listing card props.
 * @returns {JSX.Element} Listing card UI.
 */
function ListingCard({ isSaved = false, listing, onReport, onToggleSave }) {
  return (
    <article className="grid min-h-28 grid-cols-[5rem_1fr_auto] gap-3 rounded-xl border border-black bg-[#fbfbff] p-3 text-xs shadow-sm">
      {listing.image ? (
        <img alt={`${listing.name || listing.title} ${listing.breed}`} className="h-20 w-20 rounded-lg object-cover" src={listing.image} />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center text-[10px] text-slate-500">
          No photo
        </div>
      )}
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-slate-950">{listing.name || listing.title}</h2>
        {listing.breederId ? (
          <Link className="mt-1 inline-flex max-w-full items-center gap-2 text-slate-800 underline-offset-2 hover:underline" to={`/breeders/${listing.breederId}`}>
            {listing.breederPhoto ? <img alt="" className="h-5 w-5 rounded-full object-cover" src={listing.breederPhoto} /> : null}
            <span className="truncate">{listing.breeder || 'Breeder profile'}</span>
          </Link>
        ) : null}
        <p className="mt-1 text-slate-800">{listing.breed}</p>
        {listing.age ? <p className="text-slate-800">{listing.age}</p> : null}
        <p className="truncate text-slate-800">{listing.location}</p>
        <p className="font-semibold text-slate-950">{listing.price.toLocaleString()} EUR</p>
        <ActionButton className="mt-2 min-h-8 px-3 py-1 text-xs" to={`/customer/listings/${listing.id}`} variant="secondary">Open</ActionButton>
      </div>
      <div className="flex flex-col items-end justify-between">
        {listing.status ? <span className="rounded-full bg-[#f7f3ff] px-2 py-1 text-[10px] text-slate-700">{listing.status}</span> : null}
        <div className="flex flex-col items-end gap-2">
          {onToggleSave ? (
            <button
              aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
              className="rounded-full border border-black bg-white px-2 py-1 text-[11px] font-semibold"
              onClick={() => onToggleSave(listing.id)}
              type="button"
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          ) : null}
          {onReport ? (
            <button className="text-[11px] text-[#ff5f98] underline" onClick={() => onReport(listing)} type="button">
              Report
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default ListingCard