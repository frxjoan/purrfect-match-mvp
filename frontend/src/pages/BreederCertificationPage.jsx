import { useEffect, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { applyAsBreeder, fetchBreederProfile } from '../services/api.js'

const emptyApplication = {
  bio: '',
  business_name: '',
  certification_document: null,
  location: '',
}

function BreederCertificationPage() {
  const [application, setApplication] = useState(emptyApplication)
  const [breederProfile, setBreederProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadCertification() {
      setIsLoading(true)
      try {
        const data = await fetchBreederProfile()
        if (!ignore) {
          setBreederProfile(data.breeder_profile)
          setApplication({
            bio: data.breeder_profile?.bio ?? '',
            business_name: data.breeder_profile?.business_name ?? '',
            certification_document: null,
            location: data.breeder_profile?.location ?? '',
          })
          setNotice('')
        }
      } catch (error) {
        if (!ignore) {
          setBreederProfile(null)
          setNotice(error.response?.status === 404 ? '' : error.response?.data?.error?.message ?? 'Certification status could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadCertification()

    return () => {
      ignore = true
    }
  }, [])

  function updateForm(field, value) {
    setApplication((current) => ({ ...current, [field]: value }))
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const data = await applyAsBreeder(application)
      setBreederProfile(data.breeder_profile)
      setNotice('Certification application submitted.')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Certification application could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const status = breederProfile?.certification_status ?? 'not submitted'
  const canSubmitApplication = !breederProfile

  return (
    <>
      <SectionHeader
        eyebrow="Certification"
        title={`Verification status: ${status}`}
        description="Submit and review breeder certification details."
      />
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-xl font-bold">Listing access</h2>
          <p className="mt-3 text-sm leading-6">
            Only verified breeders can publish new listings. Current status: {status}.
          </p>
          <ActionButton className="mt-5" disabled={status !== 'verified'} to="/breeder/listings" variant={status === 'verified' ? 'primary' : 'muted'}>
            Create listing
          </ActionButton>
        </aside>
        <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading certification...</p> : null}
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Business name</span>
              <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" disabled={!canSubmitApplication} onChange={(event) => updateForm('business_name', event.target.value)} value={application.business_name} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Location</span>
              <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" disabled={!canSubmitApplication} onChange={(event) => updateForm('location', event.target.value)} value={application.location} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Certification document</span>
              <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" disabled={!canSubmitApplication} onChange={(event) => updateForm('certification_document', event.target.files?.[0] ?? null)} type="file" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Bio</span>
              <textarea className="mt-2 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3" disabled={!canSubmitApplication} onChange={(event) => updateForm('bio', event.target.value)} value={application.bio} />
            </label>
          </div>
          {canSubmitApplication ? (
            <ActionButton className="mt-5" disabled={isSubmitting || !application.business_name.trim() || !application.location.trim() || !application.certification_document} type="submit">
              {isSubmitting ? 'Submitting...' : 'Submit certification'}
            </ActionButton>
          ) : (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              Certification document: {breederProfile.certification_document_url ? 'Uploaded' : 'Missing'}
            </div>
          )}
          {notice ? <p className="mt-3 text-sm font-semibold text-teal-700">{notice}</p> : null}
        </form>
      </section>
    </>
  )
}

export default BreederCertificationPage
