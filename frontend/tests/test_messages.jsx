import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MessageCenter from '../src/components/messages/MessageCenter.jsx'
import { fetchConversation, fetchConversations, fetchPublicBreederProfile, fetchPublicUserProfile, sendConversationMessage } from '../src/services/api.js'

let currentUser = { id: 1, role: 'customer', token: 'token', email: 'alice@test.dev' }

vi.mock('../src/hooks/useAuth.js', () => ({
  default: () => ({ currentUser }),
}))

vi.mock('../src/services/api.js', () => ({
  fetchConversation: vi.fn(),
  fetchConversations: vi.fn(),
  fetchPublicBreederProfile: vi.fn(),
  fetchPublicUserProfile: vi.fn(),
  sendConversationMessage: vi.fn(),
}))

const conversation = {
  id: 4,
  listing_title: 'Bengal kitten',
  customer_id: 1,
  breeder_id: 8,
  updated_at: '2026-07-02T14:49:00Z',
}

const detailedConversation = {
  ...conversation,
  messages: [
    { id: 1, sender_id: 8, content: 'Hello Alice', is_read: false, created_at: '2026-07-02T14:49:00Z' },
  ],
}

describe('MessageCenter', () => {
  beforeEach(() => {
    currentUser = { id: 1, role: 'customer', token: 'token', email: 'alice@test.dev' }
  })

  it('labels controls, exposes the active conversation, and confirms sending', async () => {
    const user = userEvent.setup()
    fetchConversations.mockResolvedValueOnce({ conversations: [conversation] })
    fetchConversation.mockResolvedValue({ conversation: detailedConversation })
    fetchPublicBreederProfile.mockResolvedValue({ breeder_profile: { id: 8, business_name: 'Leo Cattery', user: { id: 8, role: 'breeder' } } })
    fetchPublicUserProfile.mockResolvedValue({ user: { id: 1, first_name: 'Alice', role: 'customer' } })
    sendConversationMessage.mockResolvedValueOnce({ message: { id: 2, sender_id: 1, content: 'Thanks!', created_at: '2026-07-02T15:00:00Z' } })

    render(<MessageCenter preferredRole="customer" />)

    const conversationButton = await screen.findByRole('button', { name: /Bengal kitten - Leo Cattery/ })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('searchbox', { name: 'Search conversations' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Your message' })).toBeInTheDocument()
    await waitFor(() => expect(conversationButton).toHaveAttribute('aria-current', 'true'))
    expect(screen.getByRole('heading', { name: 'Bengal kitten - Leo Cattery', level: 2 })).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('log', { name: 'Conversation messages' })).toHaveAttribute('aria-live', 'off')
    expect(screen.getAllByText(/02\/07\/2026/).length).toBeGreaterThan(0)
    expect(document.querySelector('time[datetime="2026-07-02T14:49:00Z"]')).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Search conversations' }), 'leo')
    expect(screen.getAllByText('Bengal kitten - Leo Cattery').length).toBeGreaterThan(0)

    await user.click(conversationButton)
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Your message' })).not.toBeDisabled())
    await user.type(screen.getByRole('textbox', { name: 'Your message' }), 'Thanks!')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(sendConversationMessage).toHaveBeenCalledWith(4, 'Thanks!'))
    expect(screen.getByRole('textbox', { name: 'Your message' })).toHaveValue('')
    expect(screen.getByRole('status')).toHaveTextContent('Message sent.')
  })

  it('updates the current conversation and announced title when switching', async () => {
    const user = userEvent.setup()
    const secondConversation = { ...conversation, id: 5, listing_title: 'Maine Coon kitten' }
    fetchConversations.mockResolvedValueOnce({ conversations: [conversation, secondConversation] })
    fetchConversation.mockImplementation(async (id) => ({
      conversation: { ...(id === 4 ? conversation : secondConversation), messages: [] },
    }))
    fetchPublicBreederProfile.mockResolvedValue({ breeder_profile: { id: 8, business_name: 'Leo Cattery', user: { id: 8, role: 'breeder' } } })
    fetchPublicUserProfile.mockResolvedValue({ user: { id: 1, first_name: 'Alice', role: 'customer' } })

    render(<MessageCenter />)

    const first = await screen.findByRole('button', { name: /Bengal kitten - Leo Cattery/ })
    const second = screen.getByRole('button', { name: /Maine Coon kitten - Leo Cattery/ })
    await waitFor(() => expect(first).toHaveAttribute('aria-current', 'true'))
    await user.click(second)

    expect(first).not.toHaveAttribute('aria-current')
    expect(second).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('heading', { name: 'Maine Coon kitten - Leo Cattery', level: 2 })).toHaveAttribute('aria-live', 'polite')
  })

  it('announces an empty inbox without reading message history', async () => {
    fetchConversations.mockResolvedValueOnce({ conversations: [] })

    render(<MessageCenter />)

    expect(await screen.findByText('No conversations yet.')).toHaveAttribute('role', 'status')
    expect(screen.getByRole('log', { name: 'Conversation messages' })).toHaveAttribute('aria-live', 'off')
  })

  it('uses breeder perspective for conversation titles without hiding conversations', async () => {
    currentUser = { id: 8, role: 'breeder', token: 'token', email: 'leo@test.dev' }
    fetchConversations.mockResolvedValueOnce({ conversations: [conversation] })
    fetchConversation.mockResolvedValue({ conversation: detailedConversation })
    fetchPublicBreederProfile.mockResolvedValue({ breeder_profile: { id: 8, business_name: 'Leo Cattery', user: { id: 8, role: 'breeder' } } })
    fetchPublicUserProfile.mockResolvedValue({ user: { id: 1, first_name: 'Alice', last_name: 'Customer', role: 'customer' } })

    render(<MessageCenter preferredRole="breeder" />)

    expect(await screen.findByText('Bengal kitten - Alice Customer')).toBeInTheDocument()
  })
})