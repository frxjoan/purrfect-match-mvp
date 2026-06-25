import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { approveAdminCertification, fetchAdminCertifications, rejectAdminCertification } from '../services/api.js'

function PendingVerificationPage() {
  const { breederId } = useParams()
  const [verifications, setVerifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const activeBreeder = useMemo(
    () => verifications.find((breeder) => String(breeder.id) === String(breederId)) ?? verifications[0],
    [breederId, verifications],
  )

  useEffect(() => {
    let ignore = false

    async function loadVerifications() {
      setIsLoading(true)
      try {
        const data = await fetchAdminCertifications()
        if (!ignore) {
          setVerifications(data.certifications ?? [])
          setNotice('')
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Verification queue could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadVerifications()

    return () => {
      ignore = true
    }
  }, [])

  async function decide(decision) {
    if (!activeBreeder) {
      return
    }

    try {
      const data = decision === 'approve'
        ? await approveAdminCertification(activeBreeder.id, { comment: 'Approved from admin UI.' })
        : await rejectAdminCertification(activeBreeder.id, { comment: 'Rejected from admin UI.' })

      setVerifications((currentVerifications) => currentVerifications.filter((breeder) => breeder.id !== data.breeder_profile.id))
      setNotice(`Certification ${decision === 'approve' ? 'approved' : 'rejected'}.`)
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Verification decision failed.')
    }
  }

  return (
    <>
      <SectionHeader eyebrow="Admin verification" title="Pending breeder verification" description="Review breeder certification applications from the backend queue." />
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading ? <p className="text-sm text-slate-500">Loading verification queue...</p> : null}
          {!isLoading && verifications.length === 0 ? <p className="text-sm text-slate-500">No breeder applications in the backend queue.</p> : null}
          {verifications.map((breeder) => (
            <ActionButton className="w-full justify-start" key={breeder.id} to={`/admin/verifications/${breeder.id}`} variant={activeBreeder?.id === breeder.id ? 'primary' : 'secondary'}>
              {breeder.business_name} - {breeder.certification_status}
            </ActionButton>
          ))}
        </div>
        {activeBreeder ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Verification detail</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{activeBreeder.business_name}</h2>
            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['Breeder ID', activeBreeder.id],
                ['Location', activeBreeder.location],
                ['Status', activeBreeder.certification_status],
                ['Bio', activeBreeder.bio ?? 'No bio'],
                ['Document', activeBreeder.certification_document_url ? 'Uploaded' : 'Missing'],
                ['Submitted', activeBreeder.created_at ?? 'Unknown'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
            {activeBreeder.certification_document_url ? <ActionButton className="mt-5" to={activeBreeder.certification_document_url} variant="secondary">Open document</ActionButton> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton onClick={() => decide('approve')}>Accept</ActionButton>
              <ActionButton onClick={() => decide('reject')} variant="danger">Reject</ActionButton>
            </div>
            {notice ? <p className="mt-4 text-sm font-semibold text-teal-700">{notice}</p> : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No breeder application selected.</div>
        )}
      </section>
    </>
  )
}

export default PendingVerificationPage
