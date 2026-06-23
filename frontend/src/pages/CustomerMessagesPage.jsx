import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { customerThreads } from '../data/mockData.js'

function CustomerMessagesPage() {
  const [activeThread, setActiveThread] = useState(customerThreads[0])
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Send messages through /api/v1/conversations/:conversation_id/messages when API contract is finalized.
    setSent(true)
    setMessage('')
  }

  return (
    <>
      <SectionHeader eyebrow="Customer messages" title="Buyer inbox placeholder" description="A responsive messaging layout with static threads and controlled reply input." />
      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {customerThreads.map((thread) => (
            <button
              className={`w-full rounded-lg border p-4 text-left transition ${activeThread.id === thread.id ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-200'}`}
              key={thread.id}
              onClick={() => setActiveThread(thread)}
              type="button"
            >
              <p className="font-semibold text-slate-950">{thread.subject}</p>
              <p className="mt-1 text-sm text-slate-500">{thread.from} · {thread.status}</p>
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">{activeThread.subject}</h2>
          <div className="mt-5 space-y-3">
            <p className="max-w-lg rounded-lg bg-slate-100 p-4 text-sm text-slate-700">Thanks for reaching out. What questions can I answer?</p>
            <p className="ml-auto max-w-lg rounded-lg bg-teal-700 p-4 text-sm text-white">Could you share more about health records and pickup timing?</p>
          </div>
          <form className="mt-6 flex flex-col gap-3 md:flex-row" onSubmit={handleSubmit}>
            <input className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3" onChange={(event) => setMessage(event.target.value)} placeholder="Write a reply" value={message} />
            <ActionButton disabled={!message.trim()} type="submit">Send placeholder</ActionButton>
          </form>
          {sent ? <p className="mt-3 text-sm font-semibold text-teal-700">Message captured locally as a TODO state.</p> : null}
        </div>
      </section>
    </>
  )
}

export default CustomerMessagesPage
