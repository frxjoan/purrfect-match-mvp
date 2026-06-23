import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { breederListings } from '../data/mockData.js'
import useAuth from '../hooks/useAuth.js'

const BREEDER_LISTINGS_KEY = 'purrfect-match-breeder-listings'

const emptyListingForm = {
  breed: '',
  description: '',
  imageUrl: '',
  location: '',
  price: '',
  title: '',
}

function getStoredListings() {
  try {
    return JSON.parse(window.localStorage.getItem(BREEDER_LISTINGS_KEY)) ?? breederListings
  } catch {
    return breederListings
  }
}

function BreederListingsPage() {
  const { currentUser } = useAuth()
  const breederVerified = currentUser?.breederVerificationStatus === 'verified' || currentUser?.role === 'admin'
  const [listingForm, setListingForm] = useState(emptyListingForm)
  const [listings, setListings] = useState(getStoredListings)
  const [editingListingId, setEditingListingId] = useState(null)
  const [notice, setNotice] = useState('')

  function persistListings(nextListings) {
    // TODO: Replace local listing persistence with /api/v1/listings create/update/delete calls.
    window.localStorage.setItem(BREEDER_LISTINGS_KEY, JSON.stringify(nextListings))
    return nextListings
  }

  function updateForm(field, value) {
    setListingForm((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setEditingListingId(null)
    setListingForm(emptyListingForm)
  }

  function handleCreateOrUpdate(event) {
    event.preventDefault()

    if (!breederVerified) {
      setNotice('Create listing is disabled until breeder verification is approved.')
      return
    }

    if (editingListingId) {
      setListings((currentListings) =>
        persistListings(
          currentListings.map((listing) =>
            listing.id === editingListingId
              ? {
                  ...listing,
                  imageUrl: listingForm.imageUrl,
                  price: `$${Number(listingForm.price || 0).toLocaleString()}`,
                  status: 'Draft',
                  title: listingForm.title,
                }
              : listing,
          ),
        ),
      )
      setNotice('Listing updated locally for this demo.')
      resetForm()
      return
    }

    const nextListing = {
      id: Date.now(),
      imageUrl: listingForm.imageUrl,
      inquiries: 0,
      price: `$${Number(listingForm.price || 0).toLocaleString()}`,
      status: 'Draft',
      title: listingForm.title,
    }

    setListings((currentListings) => persistListings([...currentListings, nextListing]))
    setNotice('Listing created locally for this demo.')
    resetForm()
  }

  function editListing(listing) {
    setEditingListingId(listing.id)
    setListingForm({
      breed: '',
      description: '',
      imageUrl: listing.imageUrl ?? '',
      location: '',
      price: listing.price.replace(/[$,]/g, ''),
      title: listing.title,
    })
    setNotice('Editing listing locally. Save changes to persist in this browser.')
  }

  function deleteListing(listingId) {
    setListings((currentListings) => persistListings(currentListings.filter((listing) => listing.id !== listingId)))
    setNotice('Listing deleted locally for this demo.')
  }

  return (
    <>
      <SectionHeader
        eyebrow="Breeder listings"
        title="Manage listings"
        description="Verified breeders can create and edit local demo listings with image URLs until backend mutations are connected."
      />
      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Current listings</h2>
          <div className="mt-5 space-y-4">
            {listings.map((listing) => (
              <article key={listing.id} className="rounded-lg border border-slate-200 p-4">
                {listing.imageUrl ? <img alt="" className="mb-4 h-32 w-full rounded-lg object-cover" src={listing.imageUrl} /> : null}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{listing.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{listing.status} · {listing.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton onClick={() => editListing(listing)} variant="secondary">Edit</ActionButton>
                    <ActionButton onClick={() => deleteListing(listing.id)} variant="danger">Delete</ActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleCreateOrUpdate}>
          <h2 className="text-xl font-bold text-slate-950">{editingListingId ? 'Edit listing' : 'Create listing'}</h2>
          {!breederVerified ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Listing creation is disabled until this breeder is verified by admin.
            </div>
          ) : null}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ['title', 'Title', 'text'],
              ['breed', 'Breed', 'text'],
              ['price', 'Price', 'number'],
              ['location', 'Location', 'text'],
              ['imageUrl', 'Image URL', 'url'],
            ].map(([field, label, type]) => (
              <label key={field} className={field === 'imageUrl' ? 'block md:col-span-2' : 'block'}>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm(field, event.target.value)} type={type} value={listingForm[field]} />
              </label>
            ))}
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Description</span>
              <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('description', event.target.value)} value={listingForm.description} />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton disabled={!breederVerified || !listingForm.title || !listingForm.price} type="submit">
              {editingListingId ? 'Save listing changes' : 'Create listing'}
            </ActionButton>
            {editingListingId ? <ActionButton onClick={resetForm} variant="secondary">Cancel edit</ActionButton> : null}
          </div>
          {notice ? <p className="mt-3 text-sm font-semibold text-teal-700">{notice}</p> : null}
        </form>
      </section>
    </>
  )
}

export default BreederListingsPage
