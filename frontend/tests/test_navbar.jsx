import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import MainLayout from '../src/components/MainLayout.jsx'
import { fetchConversation, fetchConversations } from '../src/services/api.js'

let currentUser = null
const signOut = vi.fn()

vi.mock('../src/hooks/useAuth.js', () => ({
  default: () => ({ currentUser, signOut }),
}))

vi.mock('../src/services/api.js', () => ({
  fetchConversation: vi.fn(),
  fetchConversations: vi.fn(),
}))

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="*" element={<MainLayout><p>Page content</p></MainLayout>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MainLayout navbar', () => {
  it('shows public dropdown links and customer placeholder avatar when signed out', async () => {
    const user = userEvent.setup()
    currentUser = null

    renderLayout()

    expect(screen.getByRole('link', { name: 'Purrfect Match home' })).toBeInTheDocument()
    expect(screen.getByAltText('Customer')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Open profile menu'))
    const menu = screen.getByRole('navigation')
    expect(within(menu).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(within(menu).getByRole('link', { name: 'Listings' })).toHaveAttribute('href', '/customer/listings')
    expect(within(menu).getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login')
    expect(within(menu).getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register')
  })

  it('shows customer navigation and unread message badge for authenticated users', async () => {
    const user = userEvent.setup()
    currentUser = { id: 2, role: 'customer', token: 'token', first_name: 'Alice' }
    fetchConversations.mockResolvedValueOnce({ conversations: [{ id: 1 }] })
    fetchConversation.mockResolvedValueOnce({ conversation: { messages: [{ id: 1, sender_id: 9, is_read: false }] } })

    renderLayout()

    await waitFor(() => expect(fetchConversations).toHaveBeenCalled())
    await user.click(screen.getByLabelText('Open profile menu'))

    const menu = screen.getByRole('navigation')
    expect(within(menu).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/customer/dashboard')
    expect(within(menu).getByRole('link', { name: /Message/ })).toHaveAttribute('href', '/customer/messages')
    expect(screen.getByLabelText('Unread messages')).toBeInTheDocument()
  })

  it('logs out from the profile dropdown', async () => {
    const user = userEvent.setup()
    currentUser = { id: 2, role: 'customer', token: 'token', first_name: 'Alice' }
    fetchConversations.mockResolvedValueOnce({ conversations: [] })

    renderLayout()
    await user.click(screen.getByLabelText('Open profile menu'))
    await user.click(screen.getByRole('button', { name: 'Logout' }))

    expect(signOut).toHaveBeenCalled()
  })
})