import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import ImageFilePicker from '../components/ImageFilePicker.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchCurrentUserProfile, updateCurrentUserProfile } from '../services/api.js'
import { getStoredProfileImage, profileImageFileToDataUrl, setStoredProfileImage } from '../utils/profileImageStorage.js'

const emptyProfile = {
  email: '',
  firstName: '',
  lastName: '',
  location: '',
  phoneNumber: '',
  profilePictureUrl: '',
}

function toProfile(user) {
  return {
    email: user.email ?? '',
    firstName: user.first_name ?? '',
    lastName: user.last_name ?? '',
    location: user.location ?? '',
    phoneNumber: user.phone_number ?? '',
    profilePictureUrl: user.profile_picture_url ?? '',
  }
}

function CustomerProfilePage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(emptyProfile)
  const [profileImageFiles, setProfileImageFiles] = useState([])
  const [storedProfileImage, setStoredProfileImageState] = useState(() => getStoredProfileImage(currentUser))
  const [isLoading, setIsLoading] = useState(Boolean(currentUser?.token))
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      setIsLoading(true)
      try {
        const data = await fetchCurrentUserProfile()
        if (!ignore) {
          setProfile(toProfile(data.user))
          setStoredProfileImageState(getStoredProfileImage(data.user))
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
  }, [])

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)

    try {
      // TODO: Replace local data URL persistence with backend binary upload when an upload endpoint exists.
      const data = await updateCurrentUserProfile({
        first_name: profile.firstName.trim(),
        last_name: profile.lastName.trim(),
        location: profile.location.trim() || null,
        phone_number: profile.phoneNumber.trim() || null,
        profile_picture_url: profile.profilePictureUrl || null,
      })

      if (profileImageFiles[0]) {
        const dataUrl = await profileImageFileToDataUrl(profileImageFiles[0])
        setStoredProfileImage(data.user, dataUrl)
        setStoredProfileImageState(dataUrl)
      } else {
        setStoredProfileImageState(getStoredProfileImage(data.user))
      }

      setProfile(toProfile(data.user))
      setNotice(profileImageFiles.length ? 'Profile saved. Photo is stored locally until backend image upload is available.' : 'Profile saved.')
      setProfileImageFiles([])
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? error.message ?? 'Profile could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const currentProfileImage = storedProfileImage || profile.profilePictureUrl

  return (
    <form className="mx-auto grid w-full max-w-5xl gap-8 rounded-xl border border-black bg-[#fbfbff] p-6 md:grid-cols-[0.85fr_1.15fr]" onSubmit={handleSubmit}>
      <section>
        <button className="mb-5 inline-flex items-center gap-2 text-sm font-medium" onClick={() => navigate(-1)} type="button">
          Back
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-[#c9bfff] bg-[#f8f7fb] text-4xl text-[#8b7cff]">
            {profileImageFiles.length ? null : currentProfileImage ? <img alt="Profile" className="h-full w-full object-cover" src={currentProfileImage} /> : 'PM'}
          </div>
          <div className="w-full max-w-xs">
            <ImageFilePicker
              existingImageUrl={currentProfileImage}
              files={profileImageFiles}
              helperText="Saved locally until backend image upload is available."
              onFilesChange={setProfileImageFiles}
            />
          </div>
        </div>
      </section>
      <section className="grid gap-4">
        {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading profile...</p> : null}
        <label className="block">
          <span className="text-sm font-medium text-slate-900">First name</span>
          <input className="mt-2 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => updateProfile('firstName', event.target.value)} value={profile.firstName} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-900">Last name</span>
          <input className="mt-2 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => updateProfile('lastName', event.target.value)} value={profile.lastName} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-900">Email</span>
          <input className="mt-2 w-full rounded-xl border border-black bg-slate-100 px-4 py-2 text-slate-500" readOnly type="email" value={profile.email} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-900">Location</span>
          <input className="mt-2 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => updateProfile('location', event.target.value)} value={profile.location} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-900">Phone number</span>
          <input className="mt-2 w-full rounded-xl border border-black bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-[#c9bfff]" onChange={(event) => updateProfile('phoneNumber', event.target.value)} value={profile.phoneNumber} />
        </label>
        <div className="flex justify-center gap-4">
          <ActionButton onClick={() => navigate(-1)} type="button">Cancel</ActionButton>
          <ActionButton disabled={isSaving || isLoading || !profile.firstName.trim() || !profile.lastName.trim()} type="submit">{isSaving ? 'Saving...' : 'Save'}</ActionButton>
        </div>
        {notice ? <p className="text-center text-sm font-semibold text-[#6c5ce7]">{notice}</p> : null}
      </section>
    </form>
  )
}

export default CustomerProfilePage
