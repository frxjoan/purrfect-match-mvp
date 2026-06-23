import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { pendingBreeders } from '../data/mockData.js'

function PendingVerificationPage() {
  const { breederId } = useParams()
  const [notice, setNotice] = useState('')
  const activeBreeder = useMemo(() => pendingBreeders.find((breeder) => breeder.id === breederId) ?? pendingBreeders[0], [breederId])

  function decide(decision) {
    // TODO: Connect accept/reject decisions to admin verification endpoints when the backend contract is finalized.
    setNotice(`${decision} action recorded locally for ${activeBreeder.name}.`)
  }

  return (
    <>
      <SectionHeader eyebrow="Admin verification" title="Pending breeder verification" description="Queue and detail view for reviewing breeder applications." />
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {pendingBreeders.map((breeder) => (
            <ActionButton className="w-full justify-start" key={breeder.id} to={`/admin/verifications/${breeder.id}`} variant={activeBreeder.id === breeder.id ? 'primary' : 'secondary'}>
              {breeder.name}
            </ActionButton>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Verification detail</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">{activeBreeder.name}</h2>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['Owner', activeBreeder.owner],
              ['Location', activeBreeder.location],
              ['Submitted', activeBreeder.submitted],
              ['Documents', 'License, registry, cattery photos'],
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
      </section>
    </>
  )
}

export default PendingVerificationPage
