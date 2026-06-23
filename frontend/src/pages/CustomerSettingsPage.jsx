import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'

const CUSTOMER_SETTINGS_KEY = 'purrfect-match-customer-settings'

const defaultSettings = {
  emailUpdates: true,
  messageAlerts: true,
  maxDistance: '100',
}

function getStoredSettings() {
  try {
    return JSON.parse(window.localStorage.getItem(CUSTOMER_SETTINGS_KEY)) ?? defaultSettings
  } catch {
    return defaultSettings
  }
}

function CustomerSettingsPage() {
  const [settings, setSettings] = useState(getStoredSettings)
  const [notice, setNotice] = useState('')

  function updateSetting(field, value) {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Persist account settings through customer settings API when it exists.
    window.localStorage.setItem(CUSTOMER_SETTINGS_KEY, JSON.stringify(settings))
    setNotice('Settings saved locally for this demo.')
  }

  return (
    <>
      <SectionHeader
        eyebrow="Customer settings"
        title="Account preferences"
        description="Demo account settings persist locally and are ready for future backend integration."
      />
      <form className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <label className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
          <span>
            <span className="block font-semibold text-slate-950">Email updates</span>
            <span className="text-sm text-slate-500">Receive saved search and listing updates.</span>
          </span>
          <input
            checked={settings.emailUpdates}
            onChange={(event) => updateSetting('emailUpdates', event.target.checked)}
            type="checkbox"
          />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
          <span>
            <span className="block font-semibold text-slate-950">Message alerts</span>
            <span className="text-sm text-slate-500">Show alerts for breeder replies.</span>
          </span>
          <input
            checked={settings.messageAlerts}
            onChange={(event) => updateSetting('messageAlerts', event.target.checked)}
            type="checkbox"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Preferred max distance</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"
            min="0"
            onChange={(event) => updateSetting('maxDistance', event.target.value)}
            type="number"
            value={settings.maxDistance}
          />
        </label>
        <ActionButton type="submit">Save settings</ActionButton>
        {notice ? <p className="text-sm font-semibold text-teal-700">{notice}</p> : null}
      </form>
    </>
  )
}

export default CustomerSettingsPage
