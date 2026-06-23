import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import { customerThreads } from '../data/mockData.js'

const demoMessages = [
  { id: 1, align: 'left', text: 'Hello!\nI wanted to know if my breeder verification is still under review?' },
  { id: 2, align: 'right', text: 'Hello Sarah,\nYes, your verification is currently being reviewed.' },
  { id: 3, align: 'left', text: 'Great, thank you for the update!' },
  { id: 4, align: 'right', text: "You're welcome! We'll notify you as soon as there is any update." },
]

function CustomerMessagesPage() {
  const navigate = useNavigate()
  const [activeThread, setActiveThread] = useState(customerThreads[0])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(demoMessages)

  function handleSubmit(event) {
    event.preventDefault()
    if (!message.trim()) {
      return
    }

    // TODO: Send messages through /api/v1/conversations/:conversation_id/messages when API contract is finalized.
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: Date.now(), align: 'right', text: message.trim() },
    ])
    setMessage('')
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <button className="mb-6 text-4xl" onClick={() => navigate(-1)} type="button">←</button>
      <div className="grid min-h-[34rem] overflow-hidden bg-white shadow-sm md:grid-cols-[0.72fr_1.28fr]">
        <aside className="border-b border-slate-200 p-4 md:border-b-0 md:border-r">
          <h1 className="font-bold">Messages</h1>
          <input className="mt-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Search conversations..." />
          <div className="mt-4 space-y-2">
            {customerThreads.map((thread) => (
              <button
                className={`grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg p-3 text-left text-xs transition ${activeThread.id === thread.id ? 'bg-[#eee7ff]' : 'hover:bg-slate-50'}`}
                key={thread.id}
                onClick={() => setActiveThread(thread)}
                type="button"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#8b7cff]">♡</span>
                <span>
                  <span className="block font-semibold">{thread.from}</span>
                  <span className="block truncate text-slate-500">{thread.subject}</span>
                </span>
                <span className="text-[10px] text-slate-400">{thread.id}h ago</span>
              </button>
            ))}
          </div>
        </aside>
        <div className="flex min-h-[34rem] flex-col">
          <header className="flex items-center gap-3 border-b border-slate-200 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-[#8b7cff]">♡</span>
            <div>
              <p className="font-semibold">{activeThread.from}</p>
              <p className="text-xs text-teal-600">Online</p>
            </div>
            <span className="ml-auto text-xl">⋮</span>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
            <p className="text-center text-xs text-slate-400">May 12, 2024</p>
            {messages.map((item) => (
              <div className={`flex ${item.align === 'right' ? 'justify-end' : 'justify-start'}`} key={item.id}>
                <p className={`max-w-xs whitespace-pre-line rounded-lg p-3 ${item.align === 'right' ? 'bg-[#eee7ff]' : 'bg-white shadow'}`}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <form className="flex gap-2 border-t border-slate-200 p-4" onSubmit={handleSubmit}>
            <input
              className="min-h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your message..."
              value={message}
            />
            <ActionButton className="min-h-10 px-4" disabled={!message.trim()} type="submit">➤</ActionButton>
          </form>
        </div>
      </div>
    </section>
  )
}

export default CustomerMessagesPage
