import { useEffect, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { fetchCurrentUserProfile, updateCurrentUserProfile } from '../services/api.js'

const emptySettings = {
  email: '',
  first_name: '',
  last_name: '',
  location: '',
  phone_number: '',
  profile_picture_url: '',
}

function CustomerSettingsPage() {
  const [settings, setSettings] = useState(emptySettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadSettings() {
      setIsLoading(true)
      try {
        const data = await fetchCurrentUserProfile()
        if (!ignore) {
          setSettings({
            email: data.user?.email ?? '',
            first_name: data.user?.first_name ?? '',
            last_name: data.user?.last_name ?? '',
            location: data.user?.location ?? '',
            phone_number: data.user?.phone_number ?? '',
            profile_picture_url: data.user?.profile_picture_url ?? '',
          })
          setNotice('')
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Account settings could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      ignore = true
    }
  }, [])

  function updateSetting(field, value) {
    setSettings((current) => ({ ...current, [field]: value }))
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)

    try {
      const data = await updateCurrentUserProfile({
        first_name: settings.first_name.trim(),
        last_name: settings.last_name.trim(),
        location: settings.location.trim() || null,
        phone_number: settings.phone_number.trim() || null,
        profile_picture_url: settings.profile_picture_url.trim() || null,
      })
      setSettings({
        email: data.user?.email ?? '',
        first_name: data.user?.first_name ?? '',
        last_name: data.user?.last_name ?? '',
        location: data.user?.location ?? '',
        phone_number: data.user?.phone_number ?? '',
        profile_picture_url: data.user?.profile_picture_url ?? '',
      })
      setNotice('Account settings saved.')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Account settings could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Customer settings"
        title="Account preferences"
        description="Manage contact and profile details for your account."
      />
      <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2" onSubmit={handleSubmit}>
        {isLoading ? <p className="text-sm font-semibold text-slate-500 md:col-span-2">Loading settings...</p> : null}
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">First name</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateSetting('first_name', event.target.value)} value={settings.first_name} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Last name</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateSetting('last_name', event.target.value)} value={settings.last_name} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-3 text-slate-500" readOnly type="email" value={settings.email} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Location</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateSetting('location', event.target.value)} value={settings.location} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Phone number</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateSetting('phone_number', event.target.value)} value={settings.phone_number} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Profile picture URL</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateSetting('profile_picture_url', event.target.value)} type="url" value={settings.profile_picture_url} />
        </label>
        <div className="md:col-span-2">
          <ActionButton disabled={isSaving || isLoading || !settings.first_name.trim() || !settings.last_name.trim()} type="submit">
            {isSaving ? 'Saving...' : 'Save settings'}
          </ActionButton>
        </div>
        {notice ? <p className="text-sm font-semibold text-teal-700 md:col-span-2">{notice}</p> : null}
      </form>
    </>
  )
}

export default CustomerSettingsPage
