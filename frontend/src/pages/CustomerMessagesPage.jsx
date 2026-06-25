import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchConversation, fetchConversations, sendConversationMessage } from '../services/api.js'

function formatTime(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function CustomerMessagesPage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [activeConversation, setActiveConversation] = useState(null)
  const [conversations, setConversations] = useState([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadConversations() {
      if (!currentUser?.token) {
        setNotice('Sign in with a backend account to load conversations.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await fetchConversations()
        const nextConversations = data.conversations ?? []
        if (!ignore) {
          setConversations(nextConversations)
          setActiveConversation(nextConversations[0] ?? null)
          setNotice(nextConversations.length ? '' : 'No conversations yet. Start one from a listing page.')
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Conversations could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadConversations()

    return () => {
      ignore = true
    }
  }, [currentUser?.token])

  useEffect(() => {
    let ignore = false

    async function loadMessages() {
      if (!activeConversation || !currentUser?.token) {
        setMessages([])
        return
      }

      try {
        const data = await fetchConversation(activeConversation.id)
        if (!ignore) {
          setMessages(data.conversation?.messages ?? [])
          setNotice('')
        }
      } catch (error) {
        if (!ignore) {
          setNotice(error.response?.data?.error?.message ?? 'Messages could not be loaded.')
        }
      }
    }

    loadMessages()

    return () => {
      ignore = true
    }
  }, [activeConversation, currentUser?.token])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!message.trim() || !activeConversation) {
      return
    }

    setIsSending(true)
    try {
      const data = await sendConversationMessage(activeConversation.id, message.trim())
      setMessages((currentMessages) => [...currentMessages, data.message])
      setMessage('')
      setNotice('')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Message could not be sent.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <button className="mb-6 text-4xl" onClick={() => navigate(-1)} type="button">←</button>
      <div className="grid min-h-[34rem] overflow-hidden bg-white shadow-sm md:grid-cols-[0.72fr_1.28fr]">
        <aside className="border-b border-slate-200 p-4 md:border-b-0 md:border-r">
          <h1 className="font-bold">Messages</h1>
          <input className="mt-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Search conversations..." />
          <div className="mt-4 space-y-2">
            {isLoading ? <p className="text-sm text-slate-500">Loading conversations...</p> : null}
            {!isLoading && conversations.length === 0 ? <p className="text-sm text-slate-500">No conversations yet.</p> : null}
            {conversations.map((conversation) => (
              <button
                className={`grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg p-3 text-left text-xs transition ${activeConversation?.id === conversation.id ? 'bg-[#eee7ff]' : 'hover:bg-slate-50'}`}
                key={conversation.id}
                onClick={() => setActiveConversation(conversation)}
                type="button"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#8b7cff]">♡</span>
                <span>
                  <span className="block font-semibold">{conversation.listing_title ?? `Conversation #${conversation.id}`}</span>
                  <span className="block truncate text-slate-500">Listing #{conversation.listing_id}</span>
                </span>
                <span className="text-[10px] text-slate-400">{formatTime(conversation.updated_at)}</span>
              </button>
            ))}
          </div>
        </aside>
        <div className="flex min-h-[34rem] flex-col">
          <header className="flex items-center gap-3 border-b border-slate-200 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-[#8b7cff]">♡</span>
            <div>
              <p className="font-semibold">{activeConversation?.listing_title ?? 'Messages'}</p>
              <p className="text-xs text-teal-600">Backend conversations</p>
            </div>
            <span className="ml-auto text-xl">⋮</span>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
            {notice ? <p className="text-center text-xs font-semibold text-[#c24b78]">{notice}</p> : null}
            {messages.map((item) => {
              const isMine = item.sender_id === currentUser?.id
              return (
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`} key={item.id}>
                  <p className={`max-w-xs whitespace-pre-line rounded-lg p-3 ${isMine ? 'bg-[#eee7ff]' : 'bg-white shadow'}`}>
                    {item.content}
                  </p>
                </div>
              )
            })}
          </div>
          <form className="flex gap-2 border-t border-slate-200 p-4" onSubmit={handleSubmit}>
            <input className="min-h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm" disabled={!activeConversation || isSending} onChange={(event) => setMessage(event.target.value)} placeholder="Type your message..." value={message} />
            <ActionButton className="min-h-10 px-4" disabled={!message.trim() || !activeConversation || isSending} type="submit">➤</ActionButton>
          </form>
        </div>
      </div>
    </section>
  )
}

export default CustomerMessagesPage
