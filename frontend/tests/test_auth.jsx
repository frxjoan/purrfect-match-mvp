import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, AuthProvider, getPostLoginRedirect, getRoleDashboard } from '../src/context/AuthContext.jsx'
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
      <button type="button" onClick={() => signIn({ id: 7, email: 'breeder@test.dev', role: 'breeder', breeder_profile: { certification_status: 'verified' } })}>Sign breeder in</button>
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
    expect(screen.getByText('verified')).toBeInTheDocument()
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

  it('maps roles to their dashboards and onboarding redirects', () => {
    expect(getRoleDashboard('customer')).toBe('/customer/dashboard')
    expect(getRoleDashboard('breeder')).toBe('/breeder/dashboard')
    expect(getRoleDashboard('admin')).toBe('/admin/dashboard')
    expect(getPostLoginRedirect({ role: 'breeder', breeder_certification_status: 'unverified' })).toBe('/breeder/certification')
    expect(getPostLoginRedirect({ role: 'breeder', breeder_certification_status: 'pending' })).toBe('/breeder/certification')
    expect(getPostLoginRedirect({ role: 'breeder', breeder_certification_status: 'rejected' })).toBe('/breeder/certification')
    expect(getPostLoginRedirect({ role: 'breeder', breeder_certification_status: 'verified' })).toBe('/breeder/dashboard')
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

  it('redirects unverified breeders to certification after login', async () => {
    const user = userEvent.setup()
    loginUser.mockResolvedValueOnce({
      token: 'token',
      user: {
        id: 9,
        email: 'new-breeder@test.dev',
        role: 'breeder',
        breeder_certification_status: 'unverified',
        breeder_profile: null,
      },
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/breeder/certification" element={<p>Certification page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign in Breeder' }))
    const loginInputs = document.querySelectorAll('input')
    await user.type(loginInputs[0], 'new-breeder@test.dev')
    await user.type(loginInputs[1], 'password123')
    await user.click(screen.getByRole('button', { name: 'Login as Breeder' }))

    expect(await screen.findByText('Certification page')).toBeInTheDocument()
  })

  it('redirects verified breeders to breeder dashboard after login', async () => {
    const user = userEvent.setup()
    loginUser.mockResolvedValueOnce({
      token: 'token',
      user: {
        id: 10,
        email: 'verified-breeder@test.dev',
        role: 'breeder',
        breeder_certification_status: 'verified',
        breeder_profile: { certification_status: 'verified' },
      },
    })

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/breeder/dashboard" element={<p>Breeder dashboard page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign in Breeder' }))
    const loginInputs = document.querySelectorAll('input')
    await user.type(loginInputs[0], 'verified-breeder@test.dev')
    await user.type(loginInputs[1], 'password123')
    await user.click(screen.getByRole('button', { name: 'Login as Breeder' }))

    expect(await screen.findByText('Breeder dashboard page')).toBeInTheDocument()
  })

  it('requires customer or breeder account type on registration', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Customer')).toBeInTheDocument()
    expect(screen.getByLabelText('Breeder')).toBeInTheDocument()
    expect(screen.queryByLabelText('Admin')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Choose Customer or Breeder.')).toBeInTheDocument()
    expect(registerUser).not.toHaveBeenCalled()
  })

  it('submits breeder registration through the auth API helper', async () => {
    const user = userEvent.setup()
    registerUser.mockResolvedValueOnce({ user: { id: 6, role: 'breeder' } })

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByLabelText('Breeder'))
    await user.type(screen.getByLabelText('First name'), 'Alice')
    await user.type(screen.getByLabelText('Last name'), 'Breeder')
    await user.type(screen.getByLabelText('Email'), 'alice@test.dev')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(registerUser).toHaveBeenCalledWith({
      email: 'alice@test.dev',
      password: 'secret123',
      first_name: 'Alice',
      last_name: 'Breeder',
      role: 'breeder',
    }))
    expect(await screen.findByText('Account created. You can now sign in.')).toBeInTheDocument()
  })
})