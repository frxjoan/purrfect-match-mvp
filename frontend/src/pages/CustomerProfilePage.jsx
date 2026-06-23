import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'

const CUSTOMER_PROFILE_KEY = 'purrfect-match-customer-profile'

const defaultProfile = {
  bio: 'Looking for a calm and affectionate cat.',
  location: 'Le Var',
  mail: 'customer59@example.com',
  name: 'Customer59',
}

function normalizeProfile(profile) {
  if (!profile) {
    return defaultProfile
  }

  return {
    bio: profile.bio ?? profile.preferences ?? defaultProfile.bio,
    location: profile.location ?? defaultProfile.location,
    mail: profile.mail ?? profile.email ?? defaultProfile.mail,
    name: profile.name ?? [profile.firstName, profile.lastName].filter(Boolean).join(' ') ?? defaultProfile.name,
  }
}

function getStoredProfile() {
  try {
    return normalizeProfile(JSON.parse(window.localStorage.getItem(CUSTOMER_PROFILE_KEY)))
  } catch {
    return defaultProfile
  }
}

function CustomerProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(getStoredProfile)
  const [saved, setSaved] = useState(false)

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Persist customer profile to /api/v1/users/me when profile update endpoint is confirmed.
    window.localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile))
    setSaved(true)
  }

  return (
    <form className="mx-auto grid w-full max-w-5xl gap-8 rounded-xl border border-black bg-[#fbfbff] p-6 md:grid-cols-[0.85fr_1.15fr]" onSubmit={handleSubmit}>
      <section>
        <button className="mb-5 inline-flex items-center gap-2 text-sm font-medium" onClick={() => navigate(-1)} type="button">
          <span className="text-2xl">←</span>
          Profile photo
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-2 border-[#c9bfff] bg-[#f8f7fb] text-6xl text-[#8b7cff]">
            ♡
            <span className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#ff7bac] text-lg text-white">◎</span>
          </div>
          <button className="rounded-full border border-[#c24b78] bg-[#ff7bac] px-8 py-3 text-sm font-semibold text-white" type="button">
            Upload new photo
          </button>
          <p className="text-xs text-slate-700">JPG or PNG max 2 mb</p>
        </div>
      </section>
      <section className="grid gap-4">
        {[
          ['name', 'Name', 'text'],
          ['mail', 'Mail', 'email'],
          ['location', 'Location', 'text'],
        ].map(([field, label, type]) => (
          <label key={field} className="block">
            <span className="text-sm font-medium text-slate-900">{label}</span>
            <input
              className="mt-2 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]"
              onChange={(event) => updateProfile(field, event.target.value)}
              type={type}
              value={profile[field]}
            />
          </label>
        ))}
        <label className="block">
          <span className="text-sm font-medium text-slate-900">Bio</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]"
            onChange={(event) => updateProfile('bio', event.target.value)}
            value={profile.bio}
          />
        </label>
        <div className="flex justify-center gap-4">
          <ActionButton onClick={() => setProfile(getStoredProfile())} type="button">Cancel</ActionButton>
          <ActionButton type="submit">Save</ActionButton>
        </div>
        {saved ? <p className="text-center text-sm font-semibold text-[#6c5ce7]">Profile saved locally for this demo.</p> : null}
      </section>
    </form>
  )
}

export default CustomerProfilePage
