import ActionButton from './ActionButton.jsx'

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
        <p className="mt-1 text-slate-800">{listing.breed}</p>
        {listing.age ? <p className="text-slate-800">{listing.age}</p> : null}
        <p className="truncate text-slate-800">{listing.location}</p>
        <p className="font-semibold text-slate-950">{listing.price.toLocaleString()} EUR</p>
        <ActionButton className="mt-2 min-h-8 px-3 py-1 text-xs" to={`/customer/listings/${listing.id}`} variant="secondary">Open</ActionButton>
      </div>
      <div className="flex flex-col items-end justify-between">
        {listing.status ? <span className="rounded-full bg-[#f7f3ff] px-2 py-1 text-[10px] text-slate-700">{listing.status}</span> : null}
        <div className="flex flex-col gap-2">
          {onToggleSave ? (
            <button
              aria-label={isSaved ? 'Unsave listing' : 'Save listing'}
              className="text-2xl leading-none text-black"
              onClick={() => onToggleSave(listing.id)}
              type="button"
            >
              {isSaved ? '?' : '?'}
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
