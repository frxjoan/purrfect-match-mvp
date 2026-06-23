import ActionButton from './ActionButton.jsx'

function ListingCard({ isSaved = false, listing, onReport, onToggleSave }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <img alt={`${listing.name} the ${listing.breed}`} className="h-48 w-full object-cover" src={listing.image} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-teal-700">{listing.breed}</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{listing.name}</h2>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{listing.status}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{listing.summary}</p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">Location</dt>
            <dd className="font-semibold text-slate-900">{listing.location}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Price</dt>
            <dd className="font-semibold text-slate-900">${listing.price.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Age</dt>
            <dd className="font-semibold text-slate-900">{listing.age}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Breeder</dt>
            <dd className="font-semibold text-slate-900">{listing.breeder}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap gap-3">
          <ActionButton to={`/customer/listings/${listing.id}`}>View details</ActionButton>
          {onToggleSave ? (
            <ActionButton onClick={() => onToggleSave(listing.id)} variant={isSaved ? 'primary' : 'secondary'}>
              {isSaved ? 'Saved' : 'Save'}
            </ActionButton>
          ) : null}
          <ActionButton onClick={() => onReport(listing)} variant="secondary">
            Report
          </ActionButton>
        </div>
      </div>
    </article>
  )
}

export default ListingCard
