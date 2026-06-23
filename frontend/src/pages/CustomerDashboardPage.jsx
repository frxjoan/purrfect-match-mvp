import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { customerThreads, listings } from '../data/mockData.js'

const SAVED_LISTINGS_KEY = 'purrfect-match-saved-listings'
const CUSTOMER_PROFILE_KEY = 'purrfect-match-customer-profile'

function readStoredArray(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? []
  } catch {
    return []
  }
}

function readStoredProfile() {
  try {
    return JSON.parse(window.localStorage.getItem(CUSTOMER_PROFILE_KEY)) ?? null
  } catch {
    return null
  }
}

function CustomerDashboardPage() {
  const savedListingIds = readStoredArray(SAVED_LISTINGS_KEY)
  const profile = readStoredProfile()
  const recommendedListings = savedListingIds.length
    ? listings.filter((listing) => savedListingIds.includes(listing.id))
    : listings.slice(0, 3)

  return (
    <>
      <SectionHeader
        eyebrow="Customer dashboard"
        title="Your adoption search"
        description="A practical dashboard for saved listings, active conversations, and profile readiness."
        actions={<ActionButton to="/customer/listings">Browse listings</ActionButton>}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Saved listings" value={String(savedListingIds.length)} note="Stored locally for the demo" />
        <StatCard label="Open messages" value="2" note="Conversation API exists; UI wiring is TODO" />
        <StatCard label="Profile" value={profile ? 'Saved' : 'Draft'} note="Customer details persist locally" />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Recommended listings</h2>
          <div className="mt-5 space-y-4">
            {recommendedListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-950">{listing.name}</p>
                  <p className="text-sm text-slate-500">{listing.breed} · {listing.location}</p>
                </div>
                <ActionButton to={`/customer/listings/${listing.id}`} variant="secondary">Open</ActionButton>
              </div>
            ))}
          </div>
          <ActionButton className="mt-5" to="/customer/saved" variant="secondary">Manage saved listings</ActionButton>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Messages</h2>
          <div className="mt-5 space-y-4">
            {customerThreads.map((thread) => (
              <div key={thread.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">{thread.subject}</p>
                <p className="mt-1 text-sm text-slate-500">{thread.from} · {thread.status}</p>
              </div>
            ))}
          </div>
          <ActionButton className="mt-5" to="/customer/messages" variant="secondary">Open messages</ActionButton>
        </div>
      </section>
    </>
  )
}

export default CustomerDashboardPage
