import { useEffect, useMemo, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { fetchConversations, fetchListings, fetchSavedListings } from '../services/api.js'
import useAuth from '../hooks/useAuth.js'

function CustomerDashboardPage() {
  const { currentUser } = useAuth()
  const [listings, setListings] = useState([])
  const [savedListings, setSavedListings] = useState([])
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      setIsLoading(true)
      setNotice('')

      try {
        const [listingData, savedData, conversationData] = await Promise.all([
          fetchListings({ status: 'available' }),
          fetchSavedListings(),
          fetchConversations(),
        ])

        if (!ignore) {
          setListings(listingData.listings)
          setSavedListings(savedData.listings)
          setConversations(conversationData.conversations ?? [])
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Customer dashboard data could not be loaded.')
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

  const recommendedListings = useMemo(
    () => (savedListings.length ? savedListings : listings).slice(0, 3),
    [listings, savedListings],
  )
  const profileComplete = Boolean(currentUser?.first_name && currentUser?.last_name && currentUser?.email)

  return (
    <>
      <SectionHeader
        eyebrow="Customer dashboard"
        title="Your adoption search"
        description="Saved listings, active conversations, and account readiness."
        actions={<ActionButton to="/customer/listings">Browse listings</ActionButton>}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Saved listings" value={String(savedListings.length)} note="Synced with your account" />
        <StatCard label="Open messages" value={String(conversations.length)} note="Conversations" />
        <StatCard label="Profile" value={profileComplete ? 'Ready' : 'Incomplete'} note="Account profile" />
      </section>
      {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading dashboard...</p> : null}
      {notice ? <p className="text-sm font-semibold text-[#c24b78]">{notice}</p> : null}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Recommended listings</h2>
          <div className="mt-5 space-y-4">
            {recommendedListings.length ? recommendedListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{listing.name || listing.title}</p>
                  <p className="truncate text-sm text-slate-500">{listing.breed} - {listing.location}</p>
                </div>
                <ActionButton to={`/customer/listings/${listing.id}`} variant="secondary">Open</ActionButton>
              </div>
            )) : <p className="text-sm text-slate-500">No available listings yet.</p>}
          </div>
          <ActionButton className="mt-5" to="/customer/saved" variant="secondary">Manage saved listings</ActionButton>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Messages</h2>
          <div className="mt-5 space-y-4">
            {conversations.length ? conversations.slice(0, 3).map((conversation) => (
              <div key={conversation.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">{conversation.listing_title ?? `Conversation #${conversation.id}`}</p>
                <p className="mt-1 text-sm text-slate-500">Listing #{conversation.listing_id}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No conversations yet.</p>}
          </div>
          <ActionButton className="mt-5" to="/customer/messages" variant="secondary">Open messages</ActionButton>
        </div>
      </section>
    </>
  )
}

export default CustomerDashboardPage
