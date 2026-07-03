import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProtectedRoute from '../src/components/ProtectedRoute.jsx'

let mockedUser = null

vi.mock('../src/hooks/useAuth.js', () => ({
  default: () => ({ currentUser: mockedUser }),
}))

function renderProtected(allowedRole = 'customer', initialPath = '/private') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/unauthorized" element={<p>Unauthorized page</p>} />
        <Route path="/private" element={<ProtectedRoute allowedRole={allowedRole}><p>Protected content</p></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedUser = null
  })

  it('redirects signed-out users to login', () => {
    renderProtected('customer')

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('allows breeders into customer routes', () => {
    mockedUser = { id: 3, role: 'breeder' }

    renderProtected('customer')

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('blocks customers from admin routes', () => {
    mockedUser = { id: 4, role: 'customer' }

    renderProtected('admin')

    expect(screen.getByText('Unauthorized page')).toBeInTheDocument()
  })
})