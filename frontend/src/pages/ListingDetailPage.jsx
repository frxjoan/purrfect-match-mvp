import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import ReportListingModal from '../components/ReportListingModal.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { listings } from '../data/mockData.js'

function ListingDetailPage() {
  const { listingId } = useParams()
  const [showReport, setShowReport] = useState(false)
  const listing = useMemo(() => listings.find((item) => item.id === listingId), [listingId])

  if (!listing) {
    return (
      <SectionHeader
        eyebrow="Listing"
        title="Listing not found"
        description="This placeholder state will use backend 404 handling once listing details are fetched from the API."
      />
    )
  }

  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <img alt={`${listing.name} the ${listing.breed}`} className="h-full min-h-96 rounded-lg object-cover shadow-sm" src={listing.image} />
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow={listing.breed}
            title={listing.name}
            description={listing.summary}
          />
          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
            {[
              ['Location', listing.location],
              ['Price', `$${listing.price.toLocaleString()}`],
              ['Age', listing.age],
              ['Gender', listing.gender],
              ['Breeder', listing.breeder],
              ['Verification', listing.verified ? 'Verified breeder' : 'In review'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-4">
                <dt className="text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <ActionButton to="/customer/messages">Message breeder</ActionButton>
            <ActionButton onClick={() => setShowReport(true)} variant="secondary">Report listing</ActionButton>
          </div>
          <p className="mt-5 text-sm text-slate-500">
            TODO: Fetch listing detail from /api/v1/listings/:listing_id and start conversations through /api/v1/conversations.
          </p>
        </div>
      </section>
      <ReportListingModal listing={showReport ? listing : null} onClose={() => setShowReport(false)} />
    </>
  )
}

export default ListingDetailPage
