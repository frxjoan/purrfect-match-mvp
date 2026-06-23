import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import useAuth from '../hooks/useAuth.js'

function LoginPage() {
  const { currentUser, getRoleDashboard, signIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    breederVerificationStatus: 'unverified',
    email: '',
    password: '',
    role: 'customer',
  })
  const [notice, setNotice] = useState('')
  const redirectTarget = location.state?.from

  useEffect(() => {
    if (currentUser) {
      navigate(redirectTarget ?? getRoleDashboard(currentUser.role), { replace: true })
    }
  }, [currentUser, getRoleDashboard, navigate, redirectTarget])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    signInRole(form.role)
  }

  function signInRole(role) {
    const demoUser = {
      breederVerificationStatus: role === 'breeder' ? form.breederVerificationStatus : undefined,
      email: form.email || `${role}@purrfectmatch.dev`,
      role,
    }
    // TODO: Replace demo sign-in with /api/v1/auth/login, JWT storage, and /api/v1/auth/me session restore.
    signIn(demoUser)
    setNotice(`Signed in locally as ${role}. Redirecting...`)
    navigate(redirectTarget ?? getRoleDashboard(role), { replace: true })
  }

  function handleQuickRole(role) {
    updateForm('role', role)
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
        <ActionButton className="w-full" onClick={() => navigate('/register')} type="button">
          Sign up
        </ActionButton>
      </div>

      <form className="w-full max-w-md rounded-lg border border-black bg-[#fbfbff] p-5 shadow-sm" onSubmit={handleSubmit}>
        <p className="text-center text-sm font-semibold text-slate-800">Demo account options</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Email</span>
            <input
              className="mt-1 w-full rounded-lg border border-black bg-white px-3 py-2 text-sm"
              onChange={(event) => updateForm('email', event.target.value)}
              placeholder="buyer@purrfectmatch.dev"
              type="email"
              value={form.email}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Password</span>
            <input
              className="mt-1 w-full rounded-lg border border-black bg-white px-3 py-2 text-sm"
              onChange={(event) => updateForm('password', event.target.value)}
              placeholder="Optional for demo"
              type="password"
              value={form.password}
            />
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
          Continue as selected role
        </ActionButton>
        {notice ? <p className="mt-3 text-center text-sm font-semibold text-teal-700">{notice}</p> : null}
      </form>
    </section>
  )
}

export default LoginPage
