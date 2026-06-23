import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'

const BREEDER_PROFILE_KEY = 'purrfect-match-breeder-profile'

const defaultProfile = {
  catteryName: 'Willow Cattery',
  ownerName: 'Ava Martin',
  location: 'Austin, TX',
  website: 'https://willow.example',
  bio: 'Small home cattery focused on socialized Ragdoll kittens and transparent health records.',
}

function getStoredProfile() {
  try {
    return JSON.parse(window.localStorage.getItem(BREEDER_PROFILE_KEY)) ?? defaultProfile
  } catch {
    return defaultProfile
  }
}

function BreederProfilePage() {
  const [profile, setProfile] = useState(getStoredProfile)
  const [saved, setSaved] = useState(false)

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Persist breeder profile through /api/v1/breeders when update endpoint is confirmed.
    window.localStorage.setItem(BREEDER_PROFILE_KEY, JSON.stringify(profile))
    setSaved(true)
  }

  return (
    <>
      <SectionHeader eyebrow="Breeder profile" title="Cattery profile placeholder" description="A controlled profile form ready for backend persistence." />
      <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2" onSubmit={handleSubmit}>
        {[
          ['catteryName', 'Cattery name'],
          ['ownerName', 'Owner name'],
          ['location', 'Location'],
          ['website', 'Website'],
        ].map(([field, label]) => (
          <label key={field} className="block">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateProfile(field, event.target.value)} value={profile[field]} />
          </label>
        ))}
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Cattery bio</span>
          <textarea className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateProfile('bio', event.target.value)} value={profile.bio} />
        </label>
        <ActionButton type="submit">Save profile placeholder</ActionButton>
        {saved ? <p className="self-center text-sm font-semibold text-teal-700">Breeder profile saved locally for this demo.</p> : null}
      </form>
    </>
  )
}

export default BreederProfilePage
