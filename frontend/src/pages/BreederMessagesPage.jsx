import { useEffect, useState } from 'react'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
import useAuth from '../hooks/useAuth.js'
import { fetchConversation, fetchConversations, sendConversationMessage } from '../services/api.js'

function formatTime(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function BreederMessagesPage() {
  const { currentUser } = useAuth()
  const [activeConversation, setActiveConversation] = useState(null)
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadConversations() {
      if (!currentUser?.token) {
        setNotice('Sign in with a backend breeder account to load conversations.')
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
          setNotice(nextConversations.length ? '' : 'No conversations yet.')
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

    if (!reply.trim() || !activeConversation) {
      return
    }

    setIsSending(true)
    try {
      const data = await sendConversationMessage(activeConversation.id, reply.trim())
      setMessages((currentMessages) => [...currentMessages, data.message])
      setReply('')
      setNotice('')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Message could not be sent.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <SectionHeader eyebrow="Breeder messages" title="Inquiry queue" description="Buyer conversations from the backend messaging API." />
      <section className="grid min-h-[34rem] overflow-hidden rounded-lg bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
          {isLoading ? <p className="text-sm text-slate-500">Loading conversations...</p> : null}
          {!isLoading && conversations.length === 0 ? <p className="text-sm text-slate-500">No conversations yet.</p> : null}
          {conversations.map((conversation) => (
            <button
              className={`w-full rounded-lg border p-4 text-left transition ${activeConversation?.id === conversation.id ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-200'}`}
              key={conversation.id}
              onClick={() => setActiveConversation(conversation)}
              type="button"
            >
              <p className="font-semibold text-slate-950">{conversation.listing_title ?? `Conversation #${conversation.id}`}</p>
              <p className="mt-1 text-sm text-slate-500">Listing #{conversation.listing_id} - {formatTime(conversation.updated_at)}</p>
            </button>
          ))}
        </div>
        <div className="flex min-h-[34rem] flex-col">
          <header className="border-b border-slate-200 p-4">
            <h2 className="text-xl font-bold text-slate-950">{activeConversation?.listing_title ?? 'Messages'}</h2>
            <p className="text-xs text-teal-700">Backend conversations</p>
          </header>
          <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
            {notice ? <p className="text-center text-xs font-semibold text-[#c24b78]">{notice}</p> : null}
            {messages.map((item) => {
              const isMine = item.sender_id === currentUser?.id
              return (
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`} key={item.id}>
                  <p className={`max-w-xs whitespace-pre-line rounded-lg p-3 ${isMine ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {item.content}
                  </p>
                </div>
              )
            })}
          </div>
          <form className="flex flex-col gap-3 border-t border-slate-200 p-4 md:flex-row" onSubmit={handleSubmit}>
            <input className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3" disabled={!activeConversation || isSending} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply" value={reply} />
            <ActionButton disabled={!reply.trim() || !activeConversation || isSending} type="submit">{isSending ? 'Sending...' : 'Send'}</ActionButton>
          </form>
        </div>
      </section>
    </>
  )
}

export default BreederMessagesPage
