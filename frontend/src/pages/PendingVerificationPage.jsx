import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { pendingBreeders } from '../data/mockData.js'

const ADMIN_VERIFICATIONS_KEY = 'purrfect-match-admin-verifications'

function getStoredVerifications() {
  try {
    return JSON.parse(window.localStorage.getItem(ADMIN_VERIFICATIONS_KEY)) ?? pendingBreeders
  } catch {
    return pendingBreeders
  }
}

function PendingVerificationPage() {
  const { breederId } = useParams()
  const [verifications, setVerifications] = useState(getStoredVerifications)
  const [notice, setNotice] = useState('')
  const activeBreeder = useMemo(
    () => verifications.find((breeder) => breeder.id === breederId) ?? verifications[0],
    [breederId, verifications],
  )

  function persistVerifications(nextVerifications) {
    // TODO: Connect accept/reject decisions to admin verification endpoints when the backend contract is finalized.
    window.localStorage.setItem(ADMIN_VERIFICATIONS_KEY, JSON.stringify(nextVerifications))
    return nextVerifications
  }

  function decide(decision) {
    if (!activeBreeder) {
      return
    }

    const nextStatus = decision === 'Accept' ? 'Approved' : 'Rejected'
    setVerifications((currentVerifications) =>
      persistVerifications(
        currentVerifications.map((breeder) =>
          breeder.id === activeBreeder.id ? { ...breeder, reviewStatus: nextStatus } : breeder,
        ),
      ),
    )
    setNotice(`${nextStatus} decision recorded locally for ${activeBreeder.name}.`)
  }

  return (
    <>
      <SectionHeader eyebrow="Admin verification" title="Pending breeder verification" description="Queue and detail view for reviewing breeder applications." />
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {verifications.map((breeder) => (
            <ActionButton className="w-full justify-start" key={breeder.id} to={`/admin/verifications/${breeder.id}`} variant={activeBreeder?.id === breeder.id ? 'primary' : 'secondary'}>
              {breeder.name} {breeder.reviewStatus ? `· ${breeder.reviewStatus}` : ''}
            </ActionButton>
          ))}
        </div>
        {activeBreeder ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Verification detail</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">{activeBreeder.name}</h2>
            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ['Owner', activeBreeder.owner],
                ['Location', activeBreeder.location],
                ['Submitted', activeBreeder.submitted],
                ['Status', activeBreeder.reviewStatus ?? 'Pending review'],
                ['Documents', 'License, registry, cattery photos'],
                ['Review notes', 'Placeholder checklist ready for backend evidence.'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton onClick={() => decide('Accept')}>Accept placeholder</ActionButton>
              <ActionButton onClick={() => decide('Reject')} variant="danger">Reject placeholder</ActionButton>
            </div>
            {notice ? <p className="mt-4 text-sm font-semibold text-teal-700">{notice}</p> : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No breeder applications in the local queue.
          </div>
        )}
      </section>
    </>
  )
}

export default PendingVerificationPage
