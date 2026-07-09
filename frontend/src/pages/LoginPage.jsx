import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ActionButton from '../components/ActionButton.jsx'
import useAuth from '../hooks/useAuth.js'
import { loginUser } from '../services/api.js'

/**
 * Initial controlled login form state.
 *
 * The values are kept in React state so validation, reset, and submission all
 * use the same source of truth.
 */
const emptyForm = {
  email: '',
  password: '',
}

/**
 * Handles role-aware login against the Flask authentication endpoint.
 *
 * The visible role choice only selects which form the user intends to use. The
 * actual role is trusted from Flask after login, then AuthContext stores the
 * JWT and user payload for future protected API calls.
 *
 * @returns {JSX.Element} Login options or the selected login form.
 */
function LoginPage() {
  const { currentUser, signIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const isHiddenAdminLogin = searchParams.get('admin') === '1' || searchParams.get('demoRole') === 'admin'
  const [selectedRole, setSelectedRole] = useState(isHiddenAdminLogin ? 'admin' : null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true })
    }
  }, [currentUser, navigate])

  /**
   * Updates a controlled login input and clears stale validation/server errors.
   *
   * @param {'email'|'password'} field - Login form field name.
   * @param {string} value - Latest input value.
   */
  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setNotice('')
  }

  /**
   * Selects the intended login flow and resets the current form state.
   *
   * @param {'customer'|'breeder'|'admin'|null} role - Requested login flow.
   */
  function chooseRole(role) {
    setSelectedRole(role)
    setForm(emptyForm)
    setErrors({})
    setNotice('')
  }

  /**
   * Validates required login fields before calling Flask.
   *
   * @returns {boolean} True when the form can be submitted.
   */
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

  /**
   * Resolves the submit button label from the selected login flow.
   *
   * @returns {string} Button label shown in the form.
   */
  function getSubmitLabel() {
    if (selectedRole === 'breeder') {
      return 'Login as Breeder'
    }

    if (selectedRole === 'admin') {
      return 'Login as Admin'
    }

    return 'Login as Customer'
  }

  /**
   * Resolves the form title from the selected login flow.
   *
   * @returns {string} Form title shown above the inputs.
   */
  function getTitle() {
    if (selectedRole === 'breeder') {
      return 'Breeder login'
    }

    if (selectedRole === 'admin') {
      return 'Admin login'
    }

    return 'Customer login'
  }

  /**
   * Submits credentials to Flask and stores the returned JWT on success.
   *
   * Flask is the source of truth for the final user role. The frontend compares
   * the returned role with the selected login flow and displays backend error
   * messages through the notice state when authentication fails.
   *
   * @param {SubmitEvent} event - Form submit event.
   * @returns {Promise<void>} Completes after login succeeds or an error notice is shown.
   */
  async function handleSubmit(event) {
    event.preventDefault()

    if (!selectedRole || !validateForm()) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      const data = await loginUser({
        email: form.email.trim(),
        password: form.password,
      })
      const user = {
        ...data.user,
        breederVerificationStatus: data.user?.breeder_profile?.certification_status,
        token: data.token,
      }

      if (user.role !== 'admin' && selectedRole !== 'admin' && user.role !== selectedRole) {
        setNotice(`This account is registered as ${user.role}. Please choose the matching sign-in option.`)
        return
      }

      signIn(user)
      navigate('/', { replace: true })
    } catch (error) {
      setNotice(error.response?.data?.error?.message ?? 'Login failed. Check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
          <h1 className="text-center text-xl font-semibold text-slate-950">{getTitle()}</h1>
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
              type="password"
              value={form.password}
            />
            {errors.password ? <span className="mt-1 block text-xs font-semibold text-[#c24b78]">{errors.password}</span> : null}
          </label>
          <ActionButton className="mt-6 w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : getSubmitLabel()}
          </ActionButton>
          {notice ? <p className="mt-4 text-center text-sm font-semibold text-[#c24b78]">{notice}</p> : null}
        </form>
      )}
    </section>
  )
}

export default LoginPage
