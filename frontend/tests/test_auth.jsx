import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, AuthProvider, getRoleDashboard } from '../src/context/AuthContext.jsx'
import LoginPage from '../src/pages/LoginPage.jsx'
import RegisterPage from '../src/pages/RegisterPage.jsx'
import { loginUser, registerUser } from '../src/services/api.js'

vi.mock('../src/services/api.js', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}))

function AuthProbe() {
  const { currentUser, signIn, signOut } = useContext(AuthContext)

  return (
    <div>
      <p>{currentUser ? currentUser.email : 'signed out'}</p>
      <p>{currentUser?.breederVerificationStatus ?? 'no status'}</p>
      <button type="button" onClick={() => signIn({ id: 7, email: 'breeder@test.dev', role: 'breeder', breeder_profile: { certification_status: 'approved' } })}>Sign breeder in</button>
      <button type="button" onClick={signOut}>Sign out</button>
    </div>
  )
}

describe('AuthContext', () => {
  it('stores and clears the authenticated user', async () => {
    const user = userEvent.setup()
    render(<AuthProvider><AuthProbe /></AuthProvider>)

    expect(screen.getByText('signed out')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign breeder in' }))

    expect(screen.getByText('breeder@test.dev')).toBeInTheDocument()
    expect(screen.getByText('approved')).toBeInTheDocument()
    expect(localStorage.getItem('purrfect-match-user')).toContain('breeder@test.dev')

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(localStorage.getItem('purrfect-match-user')).toBeNull()
  })

  it('restores the user from localStorage', () => {
    localStorage.setItem('purrfect-match-user', JSON.stringify({ id: 2, email: 'ada@test.dev', role: 'admin' }))

    render(<AuthProvider><AuthProbe /></AuthProvider>)

    expect(screen.getByText('ada@test.dev')).toBeInTheDocument()
  })

  it('maps roles to their dashboards', () => {
    expect(getRoleDashboard('customer')).toBe('/customer/dashboard')
    expect(getRoleDashboard('breeder')).toBe('/breeder/dashboard')
    expect(getRoleDashboard('admin')).toBe('/admin/dashboard')
  })
})

describe('login and register pages', () => {
  it('requires credentials before submitting customer login', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<p>Home page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('button', { name: 'Sign in Customer' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign in Customer' }))
    await user.click(screen.getByRole('button', { name: 'Login as Customer' }))

    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(loginUser).not.toHaveBeenCalled()

    loginUser.mockResolvedValueOnce({ token: 'token', user: { id: 4, email: 'alice@test.dev', role: 'customer' } })
    const loginInputs = document.querySelectorAll('input')
    await user.type(loginInputs[0], 'alice@test.dev')
    await user.type(loginInputs[1], 'secret123')
    await user.click(screen.getByRole('button', { name: 'Login as Customer' }))

    await waitFor(() => expect(loginUser).toHaveBeenCalledWith({ email: 'alice@test.dev', password: 'secret123' }))
    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })

  it('submits the register form through the auth API helper', async () => {
    const user = userEvent.setup()
    registerUser.mockResolvedValueOnce({ user: { id: 6 } })

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('First name'), 'Alice')
    await user.type(screen.getByLabelText('Last name'), 'Customer')
    await user.type(screen.getByLabelText('Email'), 'alice@test.dev')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(registerUser).toHaveBeenCalledWith({
      email: 'alice@test.dev',
      password: 'secret123',
      first_name: 'Alice',
      last_name: 'Customer',
    }))
    expect(await screen.findByText('Account created. You can now sign in.')).toBeInTheDocument()
  })
})