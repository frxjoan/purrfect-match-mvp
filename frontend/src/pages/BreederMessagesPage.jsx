import { useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import { breederThreads } from '../data/mockData.js'

function BreederMessagesPage() {
  const [activeThread, setActiveThread] = useState(breederThreads[0])
  const [reply, setReply] = useState('')
  const [notice, setNotice] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    // TODO: Send breeder replies through conversation message endpoints after auth is connected.
    setNotice('Reply saved locally as a placeholder.')
    setReply('')
  }

  return (
    <>
      <SectionHeader eyebrow="Breeder messages" title="Inquiry queue" description="A breeder-focused messaging placeholder for buyer and admin conversations." />
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {breederThreads.map((thread) => (
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
            <p className="max-w-lg rounded-lg bg-slate-100 p-4 text-sm text-slate-700">Hello, I’m interested in availability and next steps.</p>
            <p className="ml-auto max-w-lg rounded-lg bg-teal-700 p-4 text-sm text-white">Thanks for the inquiry. I can share details here.</p>
          </div>
          <form className="mt-6 flex flex-col gap-3 md:flex-row" onSubmit={handleSubmit}>
            <input className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3" onChange={(event) => setReply(event.target.value)} placeholder="Write a reply" value={reply} />
            <ActionButton disabled={!reply.trim()} type="submit">Send placeholder</ActionButton>
          </form>
          {notice ? <p className="mt-3 text-sm font-semibold text-teal-700">{notice}</p> : null}
        </div>
      </section>
    </>
  )
}

export default BreederMessagesPage
