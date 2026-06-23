import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import SectionHeader from '../components/SectionHeader.jsx'
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
    const demoUser = {
      breederVerificationStatus: form.role === 'breeder' ? form.breederVerificationStatus : undefined,
      email: form.email,
      role: form.role,
    }
    // TODO: Replace demo sign-in with /api/v1/auth/login, JWT storage, and /api/v1/auth/me session restore.
    signIn(demoUser)
    setNotice(`Signed in locally as ${form.role}. Redirecting...`)
    navigate(redirectTarget ?? getRoleDashboard(form.role), { replace: true })
  }

  return (
    <>
      <SectionHeader eyebrow="Account access" title="Sign in" description="Controlled demo login keeps testing open while backend auth integration is pending." />
      <form className="mx-auto w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('email', event.target.value)} placeholder="buyer@purrfectmatch.dev" type="email" value={form.email} />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <input className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('password', event.target.value)} placeholder="Password" type="password" value={form.password} />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Demo role</span>
          <select className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3" onChange={(event) => updateForm('role', event.target.value)} value={form.role}>
            <option value="customer">Customer</option>
            <option value="breeder">Breeder</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {form.role === 'breeder' ? (
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">Breeder verification demo</span>
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"
              onChange={(event) => updateForm('breederVerificationStatus', event.target.value)}
              value={form.breederVerificationStatus}
            >
              <option value="unverified">Unverified breeder</option>
              <option value="verified">Verified breeder</option>
            </select>
          </label>
        ) : null}
        <ActionButton className="mt-6 w-full" disabled={!form.email || !form.password} type="submit">Sign in locally</ActionButton>
        {notice ? <p className="mt-4 text-sm font-semibold text-teal-700">{notice}</p> : null}
      </form>
    </>
  )
}

export default LoginPage
