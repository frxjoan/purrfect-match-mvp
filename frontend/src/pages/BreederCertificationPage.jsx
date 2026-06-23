import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'

const BREEDER_CERTIFICATION_KEY = 'purrfect-match-breeder-certification'

const defaultCertification = { license: '', registry: '', notes: '' }

function getStoredCertification() {
  try {
    return JSON.parse(window.localStorage.getItem(BREEDER_CERTIFICATION_KEY)) ?? defaultCertification
  } catch {
    return defaultCertification
  }
}

function BreederCertificationPage() {
  const [form, setForm] = useState(getStoredCertification)
  const [submitted, setSubmitted] = useState(false)

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Upload certification documents through the breeder verification API once file contract is confirmed.
    window.localStorage.setItem(BREEDER_CERTIFICATION_KEY, JSON.stringify(form))
    setSubmitted(true)
  }

  return (
    <>
      <SectionHeader
        eyebrow="Certification"
        title="Verification status: In review"
        description="Breeders can prepare certification details here. File upload remains a placeholder until the backend upload contract is connected."
      />
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-xl font-bold">Create listing disabled</h2>
          <p className="mt-3 text-sm leading-6">
            Only verified breeders can publish new listings. Complete certification and wait for admin approval before creating live inventory.
          </p>
          <ActionButton className="mt-5" disabled variant="muted">Create listing locked</ActionButton>
        </aside>
        <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">License or registry ID</span>
              <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('license', event.target.value)} value={form.license} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Registry name</span>
              <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('registry', event.target.value)} value={form.registry} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Upload document placeholder</span>
              <input className="mt-2 w-full rounded-lg border border-dashed border-slate-300 px-3 py-3" type="file" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Notes for admin</span>
              <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('notes', event.target.value)} value={form.notes} />
            </label>
          </div>
          <ActionButton className="mt-5" type="submit">Submit certification placeholder</ActionButton>
          {submitted ? <p className="mt-3 text-sm font-semibold text-teal-700">Certification captured locally as a placeholder.</p> : null}
        </form>
      </section>
    </>
  )
}

export default BreederCertificationPage
