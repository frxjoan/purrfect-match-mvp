import { useEffect, useMemo, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import ImageFilePicker from '../components/ImageFilePicker.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchBreederProfile, fetchCurrentUserProfile, updateBreederProfile, updateCurrentUserProfile } from '../services/api.js'
import { getStoredProfileImage, profileImageFileToDataUrl, setStoredProfileImage } from '../utils/profileImageStorage.js'

const emptyAccountProfile = {
  email: '',
  firstName: '',
  lastName: '',
  location: '',
  phoneNumber: '',
  profilePictureUrl: '',
}

const emptyBreederProfile = {
  bio: '',
  business_name: '',
  location: '',
}

function toAccountProfile(user) {
  return {
    email: user.email ?? '',
    firstName: user.first_name ?? '',
    lastName: user.last_name ?? '',
    location: user.location ?? '',
    phoneNumber: user.phone_number ?? '',
    profilePictureUrl: user.profile_picture_url ?? '',
  }
}

function toBreederProfile(profile) {
  return {
    bio: profile?.bio ?? '',
    business_name: profile?.business_name ?? '',
    location: profile?.location ?? '',
  }
}

function BreederProfilePage() {
  const { currentUser } = useAuth()
  const [accountProfile, setAccountProfile] = useState(emptyAccountProfile)
  const [breederProfile, setBreederProfile] = useState(emptyBreederProfile)
  const [profileImageFiles, setProfileImageFiles] = useState([])
  const [storedProfileImage, setStoredProfileImageState] = useState(() => getStoredProfileImage(currentUser))
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const selectedProfilePreview = useMemo(() => (profileImageFiles[0] ? URL.createObjectURL(profileImageFiles[0]) : ''), [profileImageFiles])
  const currentProfileImage = selectedProfilePreview || storedProfileImage || accountProfile.profilePictureUrl

  useEffect(() => () => {
    if (selectedProfilePreview) {
      URL.revokeObjectURL(selectedProfilePreview)
    }
  }, [selectedProfilePreview])

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      setIsLoading(true)
      try {
        const [accountData, breederData] = await Promise.all([
          fetchCurrentUserProfile(),
          fetchBreederProfile(),
        ])
        if (!ignore) {
          setAccountProfile(toAccountProfile(accountData.user))
          setBreederProfile(toBreederProfile(breederData.breeder_profile))
          setStoredProfileImageState(getStoredProfileImage(accountData.user))
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

  function updateAccount(field, value) {
    setAccountProfile((current) => ({ ...current, [field]: value }))
    setNotice('')
  }

  function updateBreeder(field, value) {
    setBreederProfile((current) => ({ ...current, [field]: value }))
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)

    try {
      const [accountData, breederData] = await Promise.all([
        updateCurrentUserProfile({
          first_name: accountProfile.firstName.trim(),
          last_name: accountProfile.lastName.trim(),
          location: accountProfile.location.trim() || null,
          phone_number: accountProfile.phoneNumber.trim() || null,
          profile_picture_url: accountProfile.profilePictureUrl || null,
        }),
        updateBreederProfile({
          bio: breederProfile.bio.trim() || null,
          business_name: breederProfile.business_name.trim(),
          location: breederProfile.location.trim(),
        }),
      ])

      if (profileImageFiles[0]) {
        const dataUrl = await profileImageFileToDataUrl(profileImageFiles[0])
        setStoredProfileImage(accountData.user, dataUrl)
        setStoredProfileImageState(dataUrl)
      } else {
        setStoredProfileImageState(getStoredProfileImage(accountData.user))
      }

      setAccountProfile(toAccountProfile(accountData.user))
      setBreederProfile(toBreederProfile(breederData.breeder_profile))
      setNotice('Breeder profile saved.')
      setProfileImageFiles([])
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? error.message ?? 'Breeder profile could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <SectionHeader eyebrow="Breeder profile" title="Profile" description="Manage your account details and public breeder profile." />
      <form className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[0.85fr_1.15fr]" onSubmit={handleSubmit}>
        {isLoading ? <p className="text-sm font-semibold text-slate-500 lg:col-span-2">Loading breeder profile...</p> : null}
        <section className="grid gap-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-[#c9bfff] bg-[#f8f7fb] text-3xl text-[#8b7cff]">
              {currentProfileImage ? <img alt="Profile" className="h-full w-full object-cover" src={currentProfileImage} /> : 'PM'}
            </div>
            <ImageFilePicker files={profileImageFiles} onFilesChange={setProfileImageFiles} showPreview={false} />
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">First name</span>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateAccount('firstName', event.target.value)} value={accountProfile.firstName} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Last name</span>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateAccount('lastName', event.target.value)} value={accountProfile.lastName} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-3 text-slate-500" readOnly type="email" value={accountProfile.email} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Phone number</span>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateAccount('phoneNumber', event.target.value)} value={accountProfile.phoneNumber} />
          </label>
        </section>
        <section className="grid content-start gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Business name</span>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateBreeder('business_name', event.target.value)} value={breederProfile.business_name} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Location</span>
            <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => {
              updateBreeder('location', event.target.value)
              updateAccount('location', event.target.value)
            }} value={breederProfile.location || accountProfile.location} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Cattery bio</span>
            <textarea className="mt-2 min-h-32 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateBreeder('bio', event.target.value)} value={breederProfile.bio} />
          </label>
          <div className="flex flex-wrap gap-3">
            <ActionButton disabled={isSaving || isLoading || !accountProfile.firstName.trim() || !accountProfile.lastName.trim() || !breederProfile.business_name.trim() || !(breederProfile.location || accountProfile.location).trim()} type="submit">
              {isSaving ? 'Saving...' : 'Save profile'}
            </ActionButton>
          </div>
          {notice ? <p className="text-sm font-semibold text-teal-700">{notice}</p> : null}
        </section>
      </form>
    </>
  )
}

export default BreederProfilePage