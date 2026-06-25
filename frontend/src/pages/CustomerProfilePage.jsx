import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchCurrentUserProfile, updateCurrentUserProfile } from '../services/api.js'

const emptyProfile = {
  bio: '',
  email: '',
  firstName: '',
  lastName: '',
  location: '',
  profilePictureUrl: '',
}

function toProfile(user) {
  return {
    bio: '',
    email: user.email ?? '',
    firstName: user.first_name ?? '',
    lastName: user.last_name ?? '',
    location: user.location ?? '',
    profilePictureUrl: user.profile_picture_url ?? '',
  }
}

function CustomerProfilePage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(emptyProfile)
  const [isLoading, setIsLoading] = useState(Boolean(currentUser?.token))
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      if (!currentUser?.token) {
        setProfile({
          ...emptyProfile,
          email: currentUser?.email ?? '',
          firstName: currentUser?.first_name ?? currentUser?.firstName ?? '',
          lastName: currentUser?.last_name ?? currentUser?.lastName ?? '',
          location: currentUser?.location ?? '',
        })
        setNotice('Sign in with a backend account to edit your saved profile.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await fetchCurrentUserProfile()
        if (!ignore) {
          setProfile(toProfile(data.user))
          setNotice('')
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Profile could not be loaded.')
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
  }, [currentUser])

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!currentUser?.token) {
      setNotice('Sign in with a backend account before saving profile changes.')
      return
    }

    setIsSaving(true)
    try {
      const data = await updateCurrentUserProfile({
        first_name: profile.firstName.trim(),
        last_name: profile.lastName.trim(),
        location: profile.location.trim(),
        profile_picture_url: profile.profilePictureUrl.trim() || null,
      })
      setProfile((current) => ({ ...current, ...toProfile(data.user), bio: current.bio }))
      setNotice('Profile saved to your account.')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Profile could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="mx-auto grid w-full max-w-5xl gap-8 rounded-xl border border-black bg-[#fbfbff] p-6 md:grid-cols-[0.85fr_1.15fr]" onSubmit={handleSubmit}>
      <section>
        <button className="mb-5 inline-flex items-center gap-2 text-sm font-medium" onClick={() => navigate(-1)} type="button">
          <span className="text-2xl">←</span>
          Profile photo
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-[#c9bfff] bg-[#f8f7fb] text-6xl text-[#8b7cff]">
            {profile.profilePictureUrl ? <img alt="Profile" className="h-full w-full object-cover" src={profile.profilePictureUrl} /> : '♡'}
            <span className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#ff7bac] text-lg text-white">◎</span>
          </div>
          <label className="w-full max-w-xs text-center">
            <span className="rounded-full border border-[#c24b78] bg-[#ff7bac] px-6 py-3 text-sm font-semibold text-white">Set photo URL</span>
            <input className="mt-4 w-full rounded-xl border border-black bg-white px-4 py-2 text-sm" onChange={(event) => updateProfile('profilePictureUrl', event.target.value)} placeholder="https://..." type="url" value={profile.profilePictureUrl} />
          </label>
          <p className="text-xs text-slate-700">TODO: Add file upload when the backend exposes a profile image upload endpoint.</p>
        </div>
      </section>
      <section className="grid gap-4">
        {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading profile...</p> : null}
        <label className="block">
          <span className="text-sm font-medium text-slate-900">Name</span>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <input className="w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => updateProfile('firstName', event.target.value)} placeholder="First name" value={profile.firstName} />
            <input className="w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => updateProfile('lastName', event.target.value)} placeholder="Last name" value={profile.lastName} />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-900">Mail</span>
          <input className="mt-2 w-full rounded-xl border border-black bg-slate-100 px-4 py-2 text-slate-500" readOnly type="email" value={profile.email} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-900">Location</span>
          <input className="mt-2 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => updateProfile('location', event.target.value)} value={profile.location} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-900">Bio</span>
          <textarea className="mt-2 min-h-28 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => updateProfile('bio', event.target.value)} value={profile.bio} />
          <span className="mt-1 block text-xs text-slate-500">TODO: Bio is not available in the current user profile API.</span>
        </label>
        <div className="flex justify-center gap-4">
          <ActionButton onClick={() => navigate(-1)} type="button">Cancel</ActionButton>
          <ActionButton disabled={isSaving || isLoading} type="submit">{isSaving ? 'Saving...' : 'Save'}</ActionButton>
        </div>
        {notice ? <p className="text-center text-sm font-semibold text-[#6c5ce7]">{notice}</p> : null}
      </section>
    </form>
  )
}

export default CustomerProfilePage
