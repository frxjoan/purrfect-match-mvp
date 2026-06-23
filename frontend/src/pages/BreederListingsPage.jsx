import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { breederListings } from '../data/mockData.js'

const breederVerified = false

function BreederListingsPage() {
  const [listingForm, setListingForm] = useState({ title: '', breed: '', price: '', location: '', description: '' })
  const [notice, setNotice] = useState('')

  function updateForm(field, value) {
    setListingForm((current) => ({ ...current, [field]: value }))
  }

  function handleCreate(event) {
    event.preventDefault()
    // TODO: Create listing through /api/v1/listings with multipart image upload after verified breeder auth is connected.
    setNotice('Create listing is disabled until breeder verification is approved.')
  }

  function placeholderAction(action) {
    setNotice(`${action} is a frontend placeholder until listing mutation endpoints are wired.`)
  }

  return (
    <>
      <SectionHeader eyebrow="Breeder listings" title="Manage listings" description="Create, edit, and delete states are represented without calling backend mutations yet." />
      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Current listings</h2>
          <div className="mt-5 space-y-4">
            {breederListings.map((listing) => (
              <article key={listing.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{listing.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{listing.status} · {listing.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton onClick={() => placeholderAction('Edit listing')} variant="secondary">Edit</ActionButton>
                    <ActionButton onClick={() => placeholderAction('Delete listing')} variant="danger">Delete</ActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
              ['title', 'Title'],
              ['breed', 'Breed'],
              ['price', 'Price'],
              ['location', 'Location'],
            ].map(([field, label]) => (
              <label key={field} className="block">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm(field, event.target.value)} type={field === 'price' ? 'number' : 'text'} value={listingForm[field]} />
              </label>
            ))}
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Description</span>
              <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('description', event.target.value)} value={listingForm.description} />
            </label>
          </div>
          <ActionButton className="mt-5" disabled={!breederVerified} type="submit">Create listing</ActionButton>
          {notice ? <p className="mt-3 text-sm font-semibold text-teal-700">{notice}</p> : null}
        </form>
      </section>
    </>
  )
}

export default BreederListingsPage
