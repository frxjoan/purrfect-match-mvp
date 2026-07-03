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

  it('shows role-aware titles, unread badges, search, and sends messages', async () => {
    const user = userEvent.setup()
    fetchConversations.mockResolvedValueOnce({ conversations: [conversation] })
    fetchConversation.mockResolvedValue({ conversation: detailedConversation })
    fetchPublicBreederProfile.mockResolvedValue({ breeder_profile: { id: 8, business_name: 'Leo Cattery', user: { id: 8, role: 'breeder' } } })
    fetchPublicUserProfile.mockResolvedValue({ user: { id: 1, first_name: 'Alice', role: 'customer' } })
    sendConversationMessage.mockResolvedValueOnce({ message: { id: 2, sender_id: 1, content: 'Thanks!', created_at: '2026-07-02T15:00:00Z' } })

    render(<MessageCenter preferredRole="customer" />)

    const conversationButton = await screen.findByRole('button', { name: /Bengal kitten - Leo Cattery/ })
    expect(screen.getAllByLabelText('Unread messages').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/02\/07\/2026/).length).toBeGreaterThan(0)

    await user.type(screen.getByPlaceholderText('Search conversations...'), 'leo')
    expect(screen.getAllByText('Bengal kitten - Leo Cattery').length).toBeGreaterThan(0)

    await user.click(conversationButton)
    await waitFor(() => expect(screen.getByPlaceholderText('Type your message...')).not.toBeDisabled())
    await user.type(screen.getByPlaceholderText('Type your message...'), 'Thanks!')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(sendConversationMessage).toHaveBeenCalledWith(4, 'Thanks!'))
    expect(screen.getByPlaceholderText('Type your message...')).toHaveValue('')
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