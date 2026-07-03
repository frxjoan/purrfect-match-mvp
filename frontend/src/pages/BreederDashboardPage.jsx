import { useEffect, useMemo, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchBreederProfile, fetchConversations, fetchListings } from '../services/api.js'

function BreederDashboardPage() {
  const { currentUser } = useAuth()
  const [breederProfile, setBreederProfile] = useState(currentUser?.breeder_profile ?? null)
  const [conversations, setConversations] = useState([])
  const [listings, setListings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      setIsLoading(true)
      setNotice('')

      try {
        const [profileData, listingData, conversationData] = await Promise.all([
          fetchBreederProfile(),
          fetchListings(),
          fetchConversations(),
        ])

        if (!ignore) {
          setBreederProfile(profileData.breeder_profile)
          setListings(listingData.listings)
          setConversations(conversationData.conversations ?? [])
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Breeder dashboard data could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      ignore = true
    }
  }, [])

  const breederListings = useMemo(() => {
    if (!breederProfile?.id) {
      return []
    }

    return listings.filter((listing) => Number(listing.breeder_id) === Number(breederProfile.id))
  }, [breederProfile?.id, listings])
  const breederVerified = breederProfile?.certification_status === 'verified' || currentUser?.role === 'admin'

  return (
    <>
      <SectionHeader
        eyebrow="Breeder dashboard"
        title="Manage your cattery"
        description="Verification, live listings, and buyer conversations."
        actions={<ActionButton to="/breeder/certification">View certification</ActionButton>}
      />
      {!breederVerified ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-900">
          Your breeder profile is not verified yet. Listing creation is disabled until certification is approved.
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active listings" value={String(breederListings.length)} note="Listings" />
        <StatCard label="Buyer inquiries" value={String(conversations.length)} note="Conversations" />
        <StatCard label="Certification" value={breederVerified ? 'Verified' : 'In review'} note="Breeder profile" />
      </section>
      {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading dashboard...</p> : null}
      {notice ? <p className="text-sm font-semibold text-[#c24b78]">{notice}</p> : null}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Listing management</h2>
          <div className="mt-5 space-y-4">
            {breederListings.length ? breederListings.map((listing) => (
              <div key={listing.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">{listing.title}</p>
                <p className="mt-1 text-sm text-slate-500">{listing.status} - {listing.price.toLocaleString()} EUR</p>
                <p className="mt-1 text-sm text-slate-500">{listing.breed} - {listing.location}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No listings for this breeder yet.</p>}
          </div>
          <ActionButton className="mt-5" to="/breeder/listings" variant="secondary">Open listings</ActionButton>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Recent conversations</h2>
          <div className="mt-5 space-y-4">
            {conversations.length ? conversations.slice(0, 3).map((conversation) => (
              <div key={conversation.id} className="rounded-lg bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{conversation.listing_title ?? `Conversation #${conversation.id}`}</p>
                <p className="mt-1 text-sm text-slate-500">Listing #{conversation.listing_id}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No conversations yet.</p>}
          </div>
          <ActionButton className="mt-5" to="/breeder/messages" variant="secondary">Open messages</ActionButton>
        </div>
      </section>
    </>
  )
}

export default BreederDashboardPage
