import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'

function CustomerProfilePage() {
  const [profile, setProfile] = useState({
    firstName: 'Maya',
    lastName: 'Reed',
    location: 'Austin, TX',
    preferences: 'Ragdoll or Siberian kitten, family-friendly temperament.',
  })
  const [saved, setSaved] = useState(false)

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Persist customer profile to /api/v1/users/me when profile update endpoint is confirmed.
    setSaved(true)
  }

  return (
    <>
      <SectionHeader eyebrow="Customer profile" title="Buyer profile placeholder" description="Controlled inputs are ready for future account/profile persistence." />
      <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2" onSubmit={handleSubmit}>
        {[
          ['firstName', 'First name'],
          ['lastName', 'Last name'],
          ['location', 'Location'],
        ].map(([field, label]) => (
          <label key={field} className="block">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateProfile(field, event.target.value)} value={profile[field]} />
          </label>
        ))}
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Preferences</span>
          <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateProfile('preferences', event.target.value)} value={profile.preferences} />
        </label>
        <ActionButton type="submit">Save placeholder profile</ActionButton>
        {saved ? <p className="self-center text-sm font-semibold text-teal-700">Profile saved locally for this demo.</p> : null}
      </form>
    </>
  )
}

export default CustomerProfilePage
