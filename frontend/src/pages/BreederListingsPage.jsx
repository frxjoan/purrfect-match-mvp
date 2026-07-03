import { useEffect, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import ImageFilePicker from '../components/ImageFilePicker.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { createListing, deleteListing, fetchBreederProfile, fetchListings } from '../services/api.js'
import useAuth from '../hooks/useAuth.js'

const emptyListingForm = {
  age_months: '',
  breed: '',
  description: '',
  gender: 'female',
  images: [],
  location: '',
  price: '',
  title: '',
}

const emptyEditForm = {
  age_months: '',
  breed: '',
  description: '',
  gender: 'female',
  location: '',
  price: '',
  status: 'Available',
  title: '',
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.error?.message ?? fallback
}

function getEditFormFromListing(listing) {
  return {
    age_months: listing.ageMonths ?? listing.age_months ?? '',
    breed: listing.breed ?? '',
    description: listing.summary ?? listing.description ?? '',
    gender: String(listing.gender || 'Female').toLowerCase(),
    location: listing.location ?? '',
    price: listing.price ?? '',
    status: listing.status || 'Available',
    title: listing.title || listing.name || '',
  }
}

function BreederListingsPage() {
  const { currentUser } = useAuth()
  const [breederProfile, setBreederProfile] = useState(currentUser?.breeder_profile ?? null)
  const breederVerified = breederProfile?.certification_status === 'verified' || currentUser?.role === 'admin'
  const [editForm, setEditForm] = useState(emptyEditForm)
  const [editingListing, setEditingListing] = useState(null)
  const [listingForm, setListingForm] = useState(emptyListingForm)
  const [listings, setListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingListingId, setDeletingListingId] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadListings() {
      setLoadingListings(true)
      try {
        if (currentUser?.role === 'admin') {
          const listingData = await fetchListings()
          if (!ignore) {
            setBreederProfile(null)
            setListings(listingData.listings)
            setNotice('')
          }
          return
        }

        const [profileData, listingData] = await Promise.all([
          fetchBreederProfile(),
          fetchListings(),
        ])
        const profile = profileData.breeder_profile
        if (!ignore) {
          setBreederProfile(profile)
          setListings(listingData.listings.filter((listing) => Number(listing.breeder_id) === Number(profile.id)))
          setNotice('')
        }
      } catch (error) {
        if (!ignore) {
          setListings([])
          setNotice(getErrorMessage(error, 'Breeder listings are unavailable.'))
        }
      } finally {
        if (!ignore) {
          setLoadingListings(false)
        }
      }
    }

    loadListings()

    return () => {
      ignore = true
    }
  }, [currentUser?.role])

  function updateForm(field, value) {
    setListingForm((current) => ({ ...current, [field]: value }))
  }

  function updateEditForm(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setListingForm(emptyListingForm)
  }

  function startEditing(listing) {
    setEditingListing(listing)
    setEditForm(getEditFormFromListing(listing))
    setNotice('Listing editing is not available yet.')
  }

  function cancelEditing() {
    setEditingListing(null)
    setEditForm(emptyEditForm)
  }

  function handleUnavailableEditSubmit(event) {
    event.preventDefault()
    setNotice('Listing editing is not available yet.')
  }

  async function handleCreate(event) {
    event.preventDefault()
    setNotice('')

    if (!breederVerified) {
      setNotice('Create listing is disabled until breeder verification is approved.')
      return
    }

    if (!currentUser?.token) {
      setNotice('Sign in with a breeder account before creating a listing.')
      return
    }

    if (!listingForm.images.length) {
      setNotice('Add at least one image file before creating the listing.')
      return
    }

    setSubmitting(true)
    try {
      const createdListing = await createListing(listingForm)
      setListings((currentListings) => [createdListing, ...currentListings])
      setNotice('Listing created.')
      resetForm()
    } catch (error) {
      setNotice(getErrorMessage(error, 'Listing creation failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(listingId) {
    setNotice('')

    if (!currentUser?.token) {
      setNotice('Sign in with a breeder account before deleting a listing.')
      return
    }

    setDeletingListingId(listingId)
    try {
      await deleteListing(listingId)
      setListings((currentListings) => currentListings.filter((listing) => listing.id !== listingId))
      setNotice('Listing deleted from the public catalogue.')
    } catch (error) {
      setNotice(getErrorMessage(error, 'Listing deletion failed.'))
    } finally {
      setDeletingListingId(null)
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Breeder listings"
        title="Manage listings"
        description="Create and manage listings for your breeder profile."
      />
      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Current listings</h2>
          <div className="mt-5 space-y-4">
            {loadingListings ? <p className="text-sm text-slate-500">Loading listings...</p> : null}
            {!loadingListings && listings.length === 0 ? <p className="text-sm text-slate-500">No listings yet.</p> : null}
            {listings.map((listing) => (
              <article key={listing.id} className="rounded-lg border border-slate-200 p-4">
                {listing.image ? <img alt="" className="mb-4 h-32 w-full rounded-lg object-cover" src={listing.image} /> : null}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{listing.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{listing.status} - {Number(listing.price || 0).toLocaleString()} EUR</p>
                    <p className="mt-1 text-sm text-slate-500">{listing.breed} - {listing.gender || 'Gender not provided'} - {listing.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton to={`/customer/listings/${listing.id}`} variant="secondary">Open</ActionButton>
                    <ActionButton onClick={() => startEditing(listing)} variant="secondary">Edit</ActionButton>
                    <ActionButton disabled={deletingListingId === listing.id} onClick={() => handleDelete(listing.id)} variant="danger">
                      {deletingListingId === listing.id ? 'Deleting...' : 'Delete'}
                    </ActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {editingListing ? (
            <form className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4" onSubmit={handleUnavailableEditSubmit}>
              <h3 className="text-lg font-bold text-slate-950">Edit listing</h3>
              <p className="mt-1 text-sm text-slate-600">You can review listing details here. Editing is not available yet.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ['title', 'Title', 'text'],
                  ['breed', 'Breed', 'text'],
                  ['age_months', 'Age in months', 'number'],
                  ['price', 'Price', 'number'],
                  ['location', 'Location', 'text'],
                ].map(([field, label, type]) => (
                  <label key={field} className={field === 'location' ? 'block md:col-span-2' : 'block'}>
                    <span className="text-sm font-semibold text-slate-700">{label}</span>
                    <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" min="0" onChange={(event) => updateEditForm(field, event.target.value)} type={type} value={editForm[field]} />
                  </label>
                ))}
                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Gender</span>
                  <select className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateEditForm('gender', event.target.value)} value={editForm.gender}>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Status</span>
                  <select className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateEditForm('status', event.target.value)} value={editForm.status}>
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Sold">Sold</option>
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">Description</span>
                  <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateEditForm('description', event.target.value)} value={editForm.description} />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton type="submit" variant="muted">Editing unavailable</ActionButton>
                <ActionButton onClick={cancelEditing} type="button" variant="secondary">Cancel</ActionButton>
              </div>
            </form>
          ) : null}
        </div>
        <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleCreate}>
          <h2 className="text-xl font-bold text-slate-950">Create listing</h2>
          {!breederVerified ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Listing creation is disabled until this breeder is verified by admin.
            </div>
          ) : null}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              ['title', 'Title', 'text'],
              ['breed', 'Breed', 'text'],
              ['age_months', 'Age in months', 'number'],
              ['price', 'Price', 'number'],
              ['location', 'Location', 'text'],
            ].map(([field, label, type]) => (
              <label key={field} className={field === 'location' ? 'block md:col-span-2' : 'block'}>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" min="0" onChange={(event) => updateForm(field, event.target.value)} type={type} value={listingForm[field]} />
              </label>
            ))}
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Gender</span>
              <select className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('gender', event.target.value)} value={listingForm.gender}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </label>
            <div className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Images</span>
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <ImageFilePicker
                  files={listingForm.images}
                  multiple
                  onFilesChange={(files) => updateForm('images', files)}
                />
              </div>
            </div>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Description</span>
              <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('description', event.target.value)} value={listingForm.description} />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ActionButton disabled={!breederVerified || submitting || !listingForm.title || !listingForm.price || !listingForm.age_months || !listingForm.breed || !listingForm.location || !listingForm.images.length} type="submit">
              {submitting ? 'Creating...' : 'Create listing'}
            </ActionButton>
          </div>
          {notice ? <p className="mt-3 text-sm font-semibold text-teal-700">{notice}</p> : null}
        </form>
      </section>
    </>
  )
}

export default BreederListingsPage