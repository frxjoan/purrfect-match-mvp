import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { breederListings, breederThreads } from '../data/mockData.js'

const breederVerified = false

function BreederDashboardPage() {
  return (
    <>
      <SectionHeader
        eyebrow="Breeder dashboard"
        title="Manage your cattery"
        description="Track verification, listing readiness, and buyer conversations from one working surface."
        actions={<ActionButton to="/breeder/certification">View certification</ActionButton>}
      />
      {!breederVerified ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          Your breeder profile is not verified yet. Listing creation is disabled until certification is approved.
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active listings" value="1" note="One draft waiting for verification" />
        <StatCard label="Buyer inquiries" value="12" note="Two need a response" />
        <StatCard label="Certification" value="In review" note="Admin decision pending" />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Listing management</h2>
          <div className="mt-5 space-y-4">
            {breederListings.map((listing) => (
              <div key={listing.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">{listing.title}</p>
                <p className="mt-1 text-sm text-slate-500">{listing.status} · {listing.inquiries} inquiries · {listing.price}</p>
              </div>
            ))}
          </div>
          <ActionButton className="mt-5" to="/breeder/listings" variant="secondary">Open listings</ActionButton>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Recent conversations</h2>
          <div className="mt-5 space-y-4">
            {breederThreads.map((thread) => (
              <div key={thread.id} className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{thread.subject}</p>
                <p className="mt-1 text-sm text-slate-500">{thread.from} · {thread.status}</p>
              </div>
            ))}
          </div>
          <ActionButton className="mt-5" to="/breeder/messages" variant="secondary">Open messages</ActionButton>
        </div>
      </section>
    </>
  )
}

export default BreederDashboardPage
