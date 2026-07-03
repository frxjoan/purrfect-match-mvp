import { useEffect, useMemo, useState } from 'react'
import ActionButton from '../ActionButton.jsx'
import breederIcon from '../../assets/icon/breeder-icon.png'
import customerIcon from '../../assets/icon/customer-icon.png'
import useAuth from '../../hooks/useAuth.js'
import { fetchConversation, fetchConversations, fetchPublicBreederProfile, fetchPublicUserProfile, sendConversationMessage } from '../../services/api.js'
import { getStoredProfileImage } from '../../utils/profileImageStorage.js'

const UNREAD_EVENT = 'purrfect-match-messages-unread-change'

function formatDateTime(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(value) {
  return String(value || 'PM')
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'PM'
}

function getPersonName(person, fallback = '') {
  return person?.display_name
    || [person?.first_name, person?.last_name].filter(Boolean).join(' ')
    || person?.business_name
    || person?.email
    || fallback
}

function isSameUser(person, currentUser) {
  const personUser = person?.user ?? person
  return Boolean(currentUser && (
    Number(personUser?.id) === Number(currentUser.id)
    || (personUser?.email && personUser.email === currentUser.email)
  ))
}

function getAvatarSource(person, role, currentUser) {
  const localImage = isSameUser(person, currentUser) ? getStoredProfileImage(currentUser) : ''

  return localImage
    || person?.profile_picture_url
    || person?.profilePictureUrl
    || person?.avatar_url
    || person?.user?.profile_picture_url
    || person?.user?.profilePictureUrl
    || person?.user?.avatar_url
    || (role === 'breeder' ? breederIcon : customerIcon)
}

function getParticipant(conversation, role) {
  if (role === 'customer') {
    return {
      label: getPersonName(conversation.customer, conversation.customer_id ? `Customer #${conversation.customer_id}` : 'Customer'),
      person: conversation.customer,
      role: 'customer',
    }
  }

  return {
    label: getPersonName(conversation.breeder, conversation.breeder_id ? `Breeder #${conversation.breeder_id}` : 'Breeder'),
    person: conversation.breeder?.user ?? conversation.breeder,
    role: 'breeder',
  }
}

function getConversationAvatarTarget(conversation) {
  if (!conversation) {
    return { label: 'Participant', person: null, role: 'customer' }
  }

  if (conversation.activeRole === 'breeder') {
    return getParticipant(conversation, 'customer')
  }

  if (conversation.activeRole === 'customer') {
    return getParticipant(conversation, 'breeder')
  }

  if (conversation.lastMessageSenderId && Number(conversation.lastMessageSenderId) === Number(conversation.customer?.id)) {
    return getParticipant(conversation, 'customer')
  }

  if (conversation.lastMessageSenderId && Number(conversation.lastMessageSenderId) === Number(conversation.breeder?.user?.id)) {
    return getParticipant(conversation, 'breeder')
  }

  return conversation.customer ? getParticipant(conversation, 'customer') : getParticipant(conversation, 'breeder')
}

function getMessageSender(conversation, message, currentUser) {
  if (message.sender_id === currentUser?.id) {
    return currentUser
  }

  if (message.sender_id === conversation.customer?.id) {
    return conversation.customer
  }

  if (message.sender_id === conversation.breeder?.user?.id) {
    return conversation.breeder.user
  }

  return null
}

function getPerspectiveParticipantName(conversation, activeRole) {
  const customerName = getPersonName(conversation.customer, conversation.customer_id ? `Customer #${conversation.customer_id}` : '')
  const breederName = getPersonName(conversation.breeder, conversation.breeder_id ? `Breeder #${conversation.breeder_id}` : '')

  if (activeRole === 'breeder') {
    return customerName
  }

  if (activeRole === 'admin') {
    return [customerName, breederName].filter(Boolean).join(' / ')
  }

  return breederName || customerName
}

function buildConversationTitle(conversation, activeRole) {
  const listingTitle = conversation.listing_title || conversation.listing?.title || ''
  const participantName = getPerspectiveParticipantName(conversation, activeRole)

  if (listingTitle && participantName) {
    return `${listingTitle} - ${participantName}`
  }

  return listingTitle || participantName || `Conversation #${conversation.id}`
}

function hasUnread(conversation, currentUser) {
  return (conversation.messages ?? []).some((message) => message.sender_id !== currentUser?.id && message.is_read === false)
}

function getActiveRole(currentUser, preferredRole) {
  if (preferredRole) {
    return preferredRole
  }

  return currentUser?.role === 'breeder' ? 'breeder' : 'customer'
}

function publishUnreadState(conversations, currentUser) {
  window.dispatchEvent(new CustomEvent(UNREAD_EVENT, {
    detail: { hasUnread: conversations.some((conversation) => hasUnread(conversation, currentUser)) },
  }))
}

export function NotificationBadge({ show }) {
  if (!show) {
    return null
  }

  return <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" aria-label="Unread messages" />
}

export function MessageAvatar({ currentUser, person, role = 'customer', label = 'Profile' }) {
  const source = getAvatarSource(person, role, currentUser)
  const initials = getInitials(getPersonName(person, label))

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-white text-xs font-bold text-[#6c5ce7]">
      {source ? <img alt={label} className="h-full w-full object-cover" src={source} /> : initials}
    </span>
  )
}

export function ConversationList({ activeConversation, conversations, currentUser, isLoading, onSelect, query, setQuery }) {
  return (
    <aside className="border-b border-black/10 bg-white/90 p-4 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-950">Messages</h1>
        {conversations.some((conversation) => hasUnread(conversation, currentUser)) ? <NotificationBadge show /> : null}
      </div>
      <input
        className="mt-4 w-full rounded-full border border-black bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c9bfff]"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search conversations..."
        value={query}
      />
      <div className="mt-4 space-y-2">
        {isLoading ? <p className="rounded-lg bg-[#f8f7fb] p-4 text-sm text-slate-500">Loading conversations...</p> : null}
        {!isLoading && conversations.length === 0 ? <p className="rounded-lg bg-[#f8f7fb] p-4 text-sm text-slate-500">No conversations match your search.</p> : null}
        {conversations.map((conversation) => {
          const unread = hasUnread(conversation, currentUser)
          const avatarTarget = getConversationAvatarTarget(conversation)

          return (
            <button
              className={`grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-lg border p-3 text-left transition ${activeConversation?.id === conversation.id ? 'border-[#6c5ce7] bg-[#eee7ff]' : 'border-slate-200 bg-white hover:bg-[#f7f3ff]'}`}
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              type="button"
            >
              <MessageAvatar currentUser={currentUser} label={avatarTarget.label} person={avatarTarget.person} role={avatarTarget.role} />
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold text-slate-950">
                  <span className="truncate">{conversation.displayTitle}</span>
                  <NotificationBadge show={unread} />
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">{conversation.lastMessage || 'No messages yet'}</span>
              </span>
              <span className="text-[10px] text-slate-400">{formatDateTime(conversation.updated_at)}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export function MessageThread({ activeConversation, currentUser, messages, notice }) {
  const avatarTarget = getConversationAvatarTarget(activeConversation)

  return (
    <div className="flex min-h-[36rem] flex-col bg-white/95">
      <header className="flex items-center gap-3 border-b border-black/10 p-4">
        {activeConversation ? <MessageAvatar currentUser={currentUser} label={avatarTarget.label} person={avatarTarget.person} role={avatarTarget.role} /> : null}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-950">{activeConversation?.displayTitle ?? 'Messages'}</h2>
          <p className="text-xs text-slate-500">{activeConversation ? 'Conversation' : 'Select a conversation'}</p>
        </div>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto bg-[#fbfbff] p-5 text-sm">
        {notice ? <p className="rounded-lg bg-white p-3 text-center text-xs font-semibold text-[#c24b78] shadow-sm">{notice}</p> : null}
        {!activeConversation ? <p className="rounded-lg bg-white p-4 text-center text-sm text-slate-500 shadow-sm">Choose a conversation to start messaging.</p> : null}
        {activeConversation && messages.length === 0 ? <p className="rounded-lg bg-white p-4 text-center text-sm text-slate-500 shadow-sm">No messages yet.</p> : null}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUser?.id
          const sender = getMessageSender(activeConversation, message, currentUser)
          const senderRole = sender?.role || (message.sender_id === activeConversation?.breeder?.user?.id ? 'breeder' : 'customer')

          return (
            <div className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`} key={message.id}>
              {!isMine ? <MessageAvatar currentUser={currentUser} label={getPersonName(sender, 'Participant')} person={sender} role={senderRole} /> : null}
              <div className={`max-w-xs rounded-2xl px-4 py-3 shadow-sm ${isMine ? 'bg-[#6c5ce7] text-white' : 'bg-white text-slate-800'}`}>
                <p className="whitespace-pre-line">{message.content}</p>
                <p className={`mt-2 text-[10px] ${isMine ? 'text-white/70' : 'text-slate-400'}`}>{formatDateTime(message.created_at)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function MessageComposer({ activeConversation, isSending, message, onSubmit, setMessage }) {
  return (
    <form className="flex gap-2 border-t border-black/10 bg-white p-4" onSubmit={onSubmit}>
      <input
        className="min-h-11 flex-1 rounded-full border border-black bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#c9bfff] disabled:cursor-not-allowed disabled:bg-slate-100"
        disabled={!activeConversation || isSending}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Type your message..."
        value={message}
      />
      <ActionButton className="min-h-11 px-5" disabled={!message.trim() || !activeConversation || isSending} type="submit">{isSending ? 'Sending...' : 'Send'}</ActionButton>
    </form>
  )
}

function matchesSearch(conversation, query) {
  const value = query.trim().toLowerCase()

  if (!value) {
    return true
  }

  return [
    conversation.displayTitle,
    conversation.listing_title,
    conversation.participantName,
    conversation.customer?.email,
    conversation.breeder?.user?.email,
    conversation.lastMessage,
  ].filter(Boolean).some((item) => String(item).toLowerCase().includes(value))
}

async function enrichConversation(conversation, currentUser) {
  const [detailResult, breederResult, customerResult] = await Promise.allSettled([
    fetchConversation(conversation.id),
    conversation.breeder_id ? fetchPublicBreederProfile(conversation.breeder_id) : Promise.resolve(null),
    conversation.customer_id ? fetchPublicUserProfile(conversation.customer_id) : Promise.resolve(null),
  ])
  const detail = detailResult.status === 'fulfilled' ? detailResult.value.conversation : null
  const breeder = breederResult.status === 'fulfilled' ? breederResult.value?.breeder_profile : null
  const customer = customerResult.status === 'fulfilled' ? customerResult.value?.user : null
  const messages = detail?.messages ?? conversation.messages ?? []
  const lastMessageItem = messages[messages.length - 1]
  const lastMessage = lastMessageItem?.content ?? ''
  const enriched = {
    ...conversation,
    ...detail,
    breeder,
    customer,
    lastMessage,
    lastMessageSenderId: lastMessageItem?.sender_id ?? null,
    messages,
  }
  return {
    ...enriched,
    unread: hasUnread(enriched, currentUser),
  }
}

function applyConversationPerspective(conversation, activeRole) {
  return {
    ...conversation,
    activeRole,
    displayTitle: buildConversationTitle(conversation, activeRole),
    participantName: getPerspectiveParticipantName(conversation, activeRole),
  }
}

function markMessagesReadForCurrentUser(conversation, currentUser) {
  return {
    ...conversation,
    messages: (conversation.messages ?? []).map((message) => (
      message.sender_id !== currentUser?.id ? { ...message, is_read: true } : message
    )),
  }
}

function MessageCenter({ adminMode = false, title = 'Messages', subtitle = 'Conversation center', preferredRole }) {
  const { currentUser } = useAuth()
  const [activeConversation, setActiveConversation] = useState(null)
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const activeRole = getActiveRole(currentUser, preferredRole)
  const visibleConversations = useMemo(() => conversations.map((conversation) => applyConversationPerspective(conversation, activeRole)), [activeRole, conversations])
  const filteredConversations = visibleConversations.filter((conversation) => matchesSearch(conversation, query))

  useEffect(() => {
    let ignore = false

    async function loadConversations() {
      if (!currentUser?.token) {
        setNotice('Sign in to load conversations.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const data = await fetchConversations()
        const rawConversations = data.conversations ?? []
        const enrichedConversations = await Promise.all(rawConversations.map((conversation) => enrichConversation(conversation, currentUser)))
        if (!ignore) {
          setConversations(enrichedConversations)
          setNotice(enrichedConversations.length ? '' : adminMode ? 'Admin messages are not available yet.' : 'No conversations yet.')
          publishUnreadState(enrichedConversations, currentUser)
        }
      } catch (error) {
        if (!ignore) {
          setNotice(adminMode ? 'Admin messages are not available yet.' : error.response?.data?.error?.message ?? 'Conversations could not be loaded.')
          setConversations([])
          publishUnreadState([], currentUser)
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
  }, [adminMode, currentUser])

  useEffect(() => {
    setActiveConversation((currentConversation) => {
      if (!visibleConversations.length) {
        return null
      }

      if (!currentConversation) {
        return visibleConversations[0]
      }

      return visibleConversations.find((conversation) => conversation.id === currentConversation.id) ?? visibleConversations[0]
    })
  }, [visibleConversations])
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
          const nextMessages = data.conversation?.messages ?? []
          const readConversation = markMessagesReadForCurrentUser({ ...activeConversation, messages: nextMessages }, currentUser)
          setMessages(readConversation.messages)
          setConversations((current) => {
            const nextConversations = current.map((conversation) => conversation.id === activeConversation.id ? { ...conversation, ...readConversation, lastMessage: nextMessages[nextMessages.length - 1]?.content ?? conversation.lastMessage } : conversation)
            publishUnreadState(nextConversations, currentUser)
            return nextConversations
          })
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
      const nextMessages = [...messages, data.message]
      setMessages(nextMessages)
      setConversations((current) => {
        const nextConversations = current.map((conversation) => conversation.id === activeConversation.id ? { ...conversation, messages: nextMessages, lastMessage: data.message.content, updated_at: data.message.created_at } : conversation)
        publishUnreadState(nextConversations, currentUser)
        return nextConversations
      })
      setMessage('')
      setNotice('')
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Message could not be sent.')
    } finally {
      setIsSending(false)
    }
  }

  function handleSelectConversation(conversation) {
    const readConversation = markMessagesReadForCurrentUser(conversation, currentUser)
    const nextConversations = conversations.map((item) => item.id === conversation.id ? readConversation : item)
    setConversations(nextConversations)
    setActiveConversation(readConversation)
    setMessages(readConversation.messages ?? [])
    publishUnreadState(nextConversations, currentUser)
  }


  return (
    <section className="mx-auto w-full max-w-6xl space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6c5ce7]">{subtitle}</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">{title}</h1>
      </div>
      <div className="grid min-h-[36rem] overflow-hidden rounded-xl border border-black bg-white shadow-sm lg:grid-cols-[0.8fr_1.2fr]">
        <ConversationList activeConversation={activeConversation} conversations={filteredConversations} currentUser={currentUser} isLoading={isLoading} onSelect={handleSelectConversation} query={query} setQuery={setQuery} />
        <div className="flex min-h-[36rem] flex-col">
          <MessageThread activeConversation={activeConversation} currentUser={currentUser} messages={messages} notice={notice} />
          <MessageComposer activeConversation={activeConversation} isSending={isSending} message={message} onSubmit={handleSubmit} setMessage={setMessage} />
        </div>
      </div>
    </section>
  )
}

export default MessageCenter