import { useEffect, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { fetchBreederProfile, updateBreederProfile } from '../services/api.js'

const emptyProfile = {
  bio: '',
  business_name: '',
  location: '',
}

function BreederProfilePage() {
  const [profile, setProfile] = useState(emptyProfile)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      setIsLoading(true)
      try {
        const data = await fetchBreederProfile()
        if (!ignore) {
          setProfile({
            bio: data.breeder_profile?.bio ?? '',
            business_name: data.breeder_profile?.business_name ?? '',
            location: data.breeder_profile?.location ?? '',
          })
          setNotice('')
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Breeder profile could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      ignore = true
    }
  }, [])

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)

    try {
      const data = await updateBreederProfile({
        bio: profile.bio.trim() || null,
        business_name: profile.business_name.trim(),
        location: profile.location.trim(),
      })
      setProfile({
        bio: data.breeder_profile?.bio ?? '',
        business_name: data.breeder_profile?.business_name ?? '',
        location: data.breeder_profile?.location ?? '',
      })
      setNotice('Breeder profile saved.')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Breeder profile could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <SectionHeader eyebrow="Breeder profile" title="Cattery profile" description="Manage the public breeder profile stored in the backend." />
      <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2" onSubmit={handleSubmit}>
        {isLoading ? <p className="text-sm font-semibold text-slate-500 md:col-span-2">Loading breeder profile...</p> : null}
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Business name</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateProfile('business_name', event.target.value)} value={profile.business_name} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Location</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateProfile('location', event.target.value)} value={profile.location} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Cattery bio</span>
          <textarea className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateProfile('bio', event.target.value)} value={profile.bio} />
        </label>
        <ActionButton disabled={isSaving || isLoading || !profile.business_name.trim() || !profile.location.trim()} type="submit">
          {isSaving ? 'Saving...' : 'Save profile'}
        </ActionButton>
        {notice ? <p className="self-center text-sm font-semibold text-teal-700">{notice}</p> : null}
      </form>
    </>
  )
}

export default BreederProfilePage
