import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import MainLayout from '../src/components/MainLayout.jsx'

let currentUser = null

vi.mock('../src/hooks/useAuth.js', () => ({
  default: () => ({ currentUser, signOut: vi.fn() }),
}))

vi.mock('../src/services/api.js', () => ({
  fetchConversation: vi.fn(),
  fetchConversations: vi.fn().mockResolvedValue({ conversations: [] }),
}))

function renderLayout() {
  return render(
    <MemoryRouter>
      <MainLayout><p>Page content</p></MainLayout>
    </MemoryRouter>,
  )
}

describe('shared navigation accessibility', () => {
  it('offers a keyboard skip link to main content', async () => {
    const user = userEvent.setup()
    currentUser = null
    renderLayout()

    await user.tab()
    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skipLink).toHaveFocus()
    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('keeps closed interface options out of keyboard navigation', async () => {
    const user = userEvent.setup()
    currentUser = { id: 2, role: 'customer', token: 'token', first_name: 'Alice' }
    renderLayout()

    const trigger = screen.getByRole('button', { name: 'Switch active interface' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Customer' })).not.toBeInTheDocument()

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Customer' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Customer' })).not.toBeInTheDocument()
  })
})
