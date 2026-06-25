<<<<<<< HEAD
﻿import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import useAuth from '../hooks/useAuth.js'

const emptyForm = {
  email: '',
  password: '',
}

function LoginPage() {
  const { currentUser, getRoleDashboard, signIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isDevLoginHandled, setIsDevLoginHandled] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const redirectTarget = location.state?.from
  const searchParams = new URLSearchParams(location.search)
  const breederVerificationStatus = searchParams.get('breederStatus') === 'verified' ? 'verified' : 'unverified'
  const demoRole = searchParams.get('demoRole')

  useEffect(() => {
    if (currentUser) {
      navigate(redirectTarget ?? getRoleDashboard(currentUser.role), { replace: true })
    }
  }, [currentUser, getRoleDashboard, navigate, redirectTarget])

  useEffect(() => {
    if (currentUser || isDevLoginHandled || demoRole !== 'admin') {
      return
    }

    setIsDevLoginHandled(true)
    signInRole('admin', 'admin@purrfectmatch.dev')
  }, [currentUser, demoRole, isDevLoginHandled])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function chooseRole(role) {
    setSelectedRole(role)
    setForm(emptyForm)
    setErrors({})
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    }

    if (!form.password.trim()) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')

    try {
      const data = await loginUser({
        email: form.email,
        password: form.password,
      })
      const user = {
        ...data.user,
        breederVerificationStatus: data.user?.breeder_profile?.certification_status,
        token: data.token,
      }

      signIn(user)
      navigate(redirectTarget ?? getRoleDashboard(user.role), { replace: true })
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Login failed. Check your backend account credentials.')
    }

    if (!selectedRole || !validateForm()) {
      return
    }

    signInRole(selectedRole, form.email.trim())
  }

  function signInRole(role, email) {
    const demoUser = {
      breederVerificationStatus: role === 'breeder' ? breederVerificationStatus : undefined,
      email,
      role,
    }
    // TODO: Replace demo sign-in with /api/v1/auth/login, JWT storage, and /api/v1/auth/me session restore.
    // TODO: Replace hidden dev-only admin access with backend-managed admin accounts.
    signIn(demoUser)
    navigate(redirectTarget ?? getRoleDashboard(role), { replace: true })
  }

  function handleQuickRole(role) {
    updateForm('role', role)

    if (role === 'admin') {
      setNotice('Use the backend login form with an admin account to access live dashboard stats.')
      return
    }

    signInRole(role)
  }

  return (
    <section className="mx-auto flex min-h-[62vh] w-full max-w-3xl flex-col items-center justify-center gap-10 rounded-lg border border-black/20 bg-[#eee7ff] px-4 py-12">
      <div className="grid w-full max-w-xs gap-10">
        <ActionButton className="w-full" onClick={() => handleQuickRole('breeder')} type="button">
          Sign in Breeder
        </ActionButton>
        <ActionButton className="w-full" onClick={() => handleQuickRole('customer')} type="button">
          Sign in Customer
        </ActionButton>
        <ActionButton className="w-full" onClick={() => handleQuickRole('admin')} type="button">
          Sign in Admin
        </ActionButton>
        <ActionButton className="w-full" onClick={() => navigate('/register')} type="button">
          Sign up
        </ActionButton>
      </div>

      <form className="w-full max-w-md rounded-lg border border-black bg-[#fbfbff] p-5 shadow-sm" onSubmit={handleSubmit}>
        <p className="text-center text-sm font-semibold text-slate-800">Demo account options</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Email</span>
    <section className="mx-auto flex min-h-[62vh] w-full max-w-3xl flex-col items-center justify-center rounded-lg border border-black/20 bg-[#eee7ff] px-4 py-12">
      {!selectedRole ? (
        <div className="grid w-full max-w-xs gap-10">
          <ActionButton className="w-full" onClick={() => chooseRole('breeder')} type="button">
            Sign in Breeder
          </ActionButton>
          <ActionButton className="w-full" onClick={() => chooseRole('customer')} type="button">
            Sign in Customer
          </ActionButton>
          <ActionButton className="w-full" onClick={() => navigate('/register')} type="button">
            Sign up
          </ActionButton>
        </div>
      ) : (
        <form className="w-full max-w-md rounded-lg border border-black bg-[#fbfbff] p-6 shadow-sm" onSubmit={handleSubmit} noValidate>
          <button className="mb-4 text-2xl leading-none" onClick={() => chooseRole(null)} type="button" aria-label="Back to login options">
            ←
          </button>
          <h1 className="text-center text-xl font-semibold text-slate-950">
            {selectedRole === 'breeder' ? 'Breeder login' : 'Customer login'}
          </h1>
          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d8d1ff]"
              onChange={(event) => updateForm('email', event.target.value)}
              type="email"
              value={form.email}
            />
            {errors.email ? <span className="mt-1 block text-xs font-semibold text-[#c24b78]">{errors.email}</span> : null}
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d8d1ff]"
              onChange={(event) => updateForm('password', event.target.value)}
              placeholder="password123"
              type="password"
              value={form.password}
            />
            {errors.password ? <span className="mt-1 block text-xs font-semibold text-[#c24b78]">{errors.password}</span> : null}
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-slate-700">Demo role</span>
          <select className="mt-1 w-full rounded-lg border border-black bg-white px-3 py-2 text-sm" onChange={(event) => updateForm('role', event.target.value)} value={form.role}>
            <option value="customer">Customer</option>
            <option value="breeder">Breeder</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {form.role === 'breeder' ? (
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-slate-700">Breeder verification demo</span>
            <select
              className="mt-1 w-full rounded-lg border border-black bg-white px-3 py-2 text-sm"
              onChange={(event) => updateForm('breederVerificationStatus', event.target.value)}
              value={form.breederVerificationStatus}
            >
              <option value="unverified">Unverified breeder</option>
              <option value="verified">Verified breeder</option>
            </select>
          </label>
        ) : null}
        <ActionButton className="mt-4 w-full" type="submit">
          Sign in with backend
        </ActionButton>
        {notice ? <p className="mt-3 text-center text-sm font-semibold text-teal-700">{notice}</p> : null}
      </form>
          <ActionButton className="mt-6 w-full" type="submit">
            {selectedRole === 'breeder' ? 'Login as Breeder' : 'Login as Customer'}
          </ActionButton>
        </form>
      )}
    </section>
  )
}

>>>>>>> origin/dev
export default LoginPage
