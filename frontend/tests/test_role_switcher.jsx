import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import MainLayout from '../src/components/MainLayout.jsx'

let currentUser = null

vi.mock('../src/hooks/useAuth.js', () => ({
  default: () => ({ currentUser, signOut: vi.fn() }),
}))

vi.mock('../src/services/api.js', () => ({
  fetchConversation: vi.fn(async () => ({ conversation: { messages: [] } })),
  fetchConversations: vi.fn(async () => ({ conversations: [] })),
}))

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<MainLayout><p>Home page</p></MainLayout>} />
        <Route path="/customer/dashboard" element={<MainLayout><p>Customer dashboard page</p></MainLayout>} />
        <Route path="/breeder/dashboard" element={<MainLayout><p>Breeder dashboard page</p></MainLayout>} />
        <Route path="/admin/dashboard" element={<MainLayout><p>Admin dashboard page</p></MainLayout>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('role switcher', () => {
  it('shows only customer for customer accounts', async () => {
    const user = userEvent.setup()
    currentUser = { id: 1, role: 'customer', token: 'token' }

    renderWithRoutes()
    await user.click(screen.getByLabelText('Switch active interface'))

    expect(screen.getByRole('button', { name: /Customer/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Breeder/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Admin Dashboard/ })).not.toBeInTheDocument()
  })

  it('lets verified breeders switch between customer and breeder interfaces without logging in again', async () => {
    const user = userEvent.setup()
    currentUser = { id: 2, role: 'breeder', token: 'token', breederVerificationStatus: 'verified' }

    renderWithRoutes()
    await user.click(screen.getByLabelText('Switch active interface'))
    await user.click(screen.getByRole('button', { name: /Customer/ }))

    expect(screen.getByText('Customer dashboard page')).toBeInTheDocument()
    expect(localStorage.getItem('purrfect-match-active-interface')).toBe('customer')
  })

  it('lets admins switch to the admin dashboard while keeping all interface options', async () => {
    const user = userEvent.setup()
    currentUser = { id: 3, role: 'admin', token: 'token' }

    renderWithRoutes()
    await user.click(screen.getByLabelText('Switch active interface'))

    expect(screen.getByRole('button', { name: /Customer/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Breeder/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Admin Dashboard/ }))

    expect(screen.getByText('Admin dashboard page')).toBeInTheDocument()
  })
})